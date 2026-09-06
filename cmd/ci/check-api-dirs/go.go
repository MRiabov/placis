package main

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"strings"
)

var chiRouteNames = map[string]bool{
	"Get": true, "Post": true, "Put": true, "Patch": true, "Delete": true,
	"Handle": true, "Method": true, "Route": true, "Mount": true,
}

var dtoTagBits = []string{
	"json:", "doc:", "minLength", "maxLength", "minimum", "maximum", "enum:", "required",
}

func checkGo(root string, files []string) []string {
	var errs []string
	fset := token.NewFileSet()
	for _, path := range files {
		rel := relSlash(root, path)
		if !strings.HasSuffix(rel, ".go") || skipWalk(rel) {
			continue
		}
		src, err := os.ReadFile(path)
		if err != nil {
			errs = append(errs, fmt.Sprintf("%s: %v", rel, err))
			continue
		}
		f, err := parser.ParseFile(fset, path, src, parser.ParseComments)
		if err != nil {
			errs = append(errs, fmt.Sprintf("%s: parse: %v", rel, err))
			continue
		}
		aliases := importAliases(f)
		hits := walkGoFile(f, aliases)
		for _, h := range hits {
			switch h.tag {
			case "register":
				if isDtoFile(rel) {
					errs = append(errs, fmt.Sprintf("%s: Register must not live in dto.go", rel))
					continue
				}
				if registerOK(rel) {
					continue
				}
				errs = append(errs, fmt.Sprintf("%s: Register outside feature/api/ route files", rel))
			case "chi":
				if isHttpapi(rel) {
					continue
				}
				errs = append(errs, fmt.Sprintf("%s: chi route registration only in infrastructure/httpapi", rel))
			case "dto":
				if isAllowedDTOFile(rel) {
					continue
				}
				errs = append(errs, fmt.Sprintf("%s: DTO struct %s must live in dto.go or api/dto/", rel, h.name))
			case "unconstrained":
				if !isAllowedDTOFile(rel) && !isHttpapi(rel) {
					continue
				}
				errs = append(errs, fmt.Sprintf("%s: DTO field %s is unconstrained (%s)", rel, h.name, h.detail))
			}
		}
	}
	return errs
}

type goHit struct {
	tag    string
	name   string
	detail string
}

func importAliases(f *ast.File) map[string]string {
	out := map[string]string{}
	for _, imp := range f.Imports {
		path := strings.Trim(imp.Path.Value, `"`)
		name := ""
		if imp.Name != nil {
			name = imp.Name.Name
		} else {
			parts := strings.Split(path, "/")
			name = parts[len(parts)-1]
			if i := strings.IndexByte(name, '.'); i >= 0 {
				name = name[:i]
			}
		}
		out[name] = path
	}
	return out
}

func walkGoFile(f *ast.File, aliases map[string]string) []goHit {
	var hits []goHit
	chi := hasChi(aliases)
	ast.Inspect(f, func(n ast.Node) bool {
		switch x := n.(type) {
		case *ast.CallExpr:
			sel, ok := x.Fun.(*ast.SelectorExpr)
			if !ok || sel.Sel == nil {
				return true
			}
			if ident, ok := sel.X.(*ast.Ident); ok {
				pkg := aliases[ident.Name]
				if sel.Sel.Name == "Register" && (isHumaPath(pkg) || isSSEPath(pkg) || ident.Name == "huma" || ident.Name == "sse") {
					hits = append(hits, goHit{tag: "register"})
				}
			}
			if chi && chiRouteNames[sel.Sel.Name] {
				hits = append(hits, goHit{tag: "chi"})
			}
		case *ast.TypeSpec:
			st, ok := x.Type.(*ast.StructType)
			if !ok || x.Name == nil {
				return true
			}
			name := x.Name.Name
			if isDTOStruct(name, st) {
				hits = append(hits, goHit{tag: "dto", name: name})
				hits = append(hits, unconstrainedHits(name, st)...)
			}
		}
		return true
	})
	return hits
}

func registerOK(slashPath string) bool {
	if isDtoFile(slashPath) {
		return false
	}
	if isHttpapi(slashPath) {
		return true
	}
	if underPipeline(slashPath) || underStore(slashPath) {
		return false
	}
	if underAPIDir(slashPath) {
		return true
	}
	base := filepath.Base(slashPath)
	return base == "api.go" || base == "api_test.go"
}

func isHumaPath(pkg string) bool {
	return strings.Contains(pkg, "huma")
}

func isSSEPath(pkg string) bool {
	return strings.Contains(pkg, "sse") && strings.Contains(pkg, "huma")
}

func isChiPath(pkg string) bool {
	return strings.Contains(pkg, "go-chi/chi")
}

func hasChi(aliases map[string]string) bool {
	for _, p := range aliases {
		if isChiPath(p) {
			return true
		}
	}
	return false
}

func isDTOStruct(name string, st *ast.StructType) bool {
	if strings.HasSuffix(name, "Read") || strings.HasSuffix(name, "Create") || strings.HasSuffix(name, "Update") {
		return true
	}
	if st.Fields == nil {
		return false
	}
	for _, field := range st.Fields.List {
		if field.Tag == nil {
			continue
		}
		tag := field.Tag.Value
		for _, bit := range dtoTagBits {
			if strings.Contains(tag, bit) {
				return true
			}
		}
	}
	return false
}

func unconstrainedHits(typeName string, st *ast.StructType) []goHit {
	if st.Fields == nil {
		return nil
	}
	var hits []goHit
	for _, field := range st.Fields.List {
		fname := typeName
		if len(field.Names) > 0 {
			fname = typeName + "." + field.Names[0].Name
		}
		if isRawMessage(field.Type) {
			hits = append(hits, goHit{tag: "unconstrained", name: fname, detail: "json.RawMessage"})
		}
		if isStringAnyMap(field.Type) {
			hits = append(hits, goHit{tag: "unconstrained", name: fname, detail: "map[string]any"})
		}
		if field.Tag != nil {
			tag := field.Tag.Value
			if strings.Contains(tag, "additionalProperties") {
				hits = append(hits, goHit{tag: "unconstrained", name: fname, detail: "additionalProperties"})
			}
			if isIdentNamed(field.Type, "string") && (strings.Contains(tag, "JSON.parse") || strings.Contains(strings.ToLower(tag), "as json")) {
				hits = append(hits, goHit{tag: "unconstrained", name: fname, detail: "string documented as JSON"})
			}
		}
	}
	return hits
}

func isRawMessage(expr ast.Expr) bool {
	sel, ok := expr.(*ast.SelectorExpr)
	if !ok || sel.Sel == nil || sel.Sel.Name != "RawMessage" {
		return false
	}
	ident, ok := sel.X.(*ast.Ident)
	return ok && ident.Name == "json"
}

func isStringAnyMap(expr ast.Expr) bool {
	m, ok := expr.(*ast.MapType)
	if !ok {
		return false
	}
	key, ok := m.Key.(*ast.Ident)
	if !ok || key.Name != "string" {
		return false
	}
	switch v := m.Value.(type) {
	case *ast.Ident:
		return v.Name == "any"
	case *ast.InterfaceType:
		return v.Methods == nil || len(v.Methods.List) == 0
	default:
		return false
	}
}

func isIdentNamed(expr ast.Expr, name string) bool {
	ident, ok := expr.(*ast.Ident)
	return ok && ident.Name == name
}
