package main

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

type specSet int

const (
	specPublic specSet = iota
	specWorker
)

type happyPathTest struct {
	name string
	file string
	ops  map[string]bool
}

var methodPathRe = regexp.MustCompile(`^(GET|POST|PUT|PATCH|DELETE) (/[^\s]+)$`)

func collectHappyPathTests(internalRoot string) ([]happyPathTest, error) {
	var out []happyPathTest
	st, err := os.Stat(internalRoot)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	if !st.IsDir() {
		return nil, nil
	}
	fset := token.NewFileSet()
	err = filepath.WalkDir(internalRoot, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		if !strings.HasSuffix(path, "_test.go") {
			return nil
		}
		src, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		f, err := parser.ParseFile(fset, path, src, 0)
		if err != nil {
			return fmt.Errorf("%s: %w", path, err)
		}
		for _, decl := range f.Decls {
			fn, ok := decl.(*ast.FuncDecl)
			if !ok || fn.Name == nil || fn.Body == nil {
				continue
			}
			name := fn.Name.Name
			if !strings.HasPrefix(name, "TestHappyPath") {
				continue
			}
			out = append(out, happyPathTest{
				name: name,
				file: filepath.ToSlash(path),
				ops:  collectOps(fn),
			})
		}
		return nil
	})
	return out, err
}

func collectOps(fn *ast.FuncDecl) map[string]bool {
	ops := map[string]bool{}
	ast.Inspect(fn.Body, func(n ast.Node) bool {
		switch x := n.(type) {
		case *ast.CallExpr:
			sel, ok := x.Fun.(*ast.SelectorExpr)
			if !ok || sel.Sel == nil || len(x.Args) == 0 {
				return true
			}
			method := httpMethodName(sel.Sel.Name)
			if method == "" {
				return true
			}
			lit, ok := x.Args[0].(*ast.BasicLit)
			if !ok || !isQuotedString(lit) {
				return true
			}
			path, err := strconv.Unquote(lit.Value)
			if err != nil || !strings.HasPrefix(path, "/") {
				return true
			}
			ops[method+" "+path] = true
		case *ast.BasicLit:
			if !isQuotedString(x) {
				return true
			}
			s, err := strconv.Unquote(x.Value)
			if err != nil {
				return true
			}
			if m := methodPathRe.FindStringSubmatch(s); len(m) == 3 {
				ops[m[1]+" "+m[2]] = true
			}
		}
		return true
	})
	return ops
}

func isQuotedString(lit *ast.BasicLit) bool {
	if lit == nil || lit.Value == "" {
		return false
	}
	q := lit.Value[0]
	return q == '"' || q == '`'
}

func httpMethodName(sel string) string {
	switch sel {
	case "Get", "GET":
		return "GET"
	case "Post", "POST":
		return "POST"
	case "Put", "PUT":
		return "PUT"
	case "Patch", "PATCH":
		return "PATCH"
	case "Delete", "DELETE":
		return "DELETE"
	default:
		return ""
	}
}

func inSpecSet(op string, set specSet) bool {
	internal := strings.Contains(op, " /internal/")
	switch set {
	case specPublic:
		return !internal
	case specWorker:
		return internal
	default:
		return false
	}
}

func checkHappyPath(specPath string, specOps map[string]bool, tests []happyPathTest, set specSet) []string {
	covered := map[string]bool{}
	for _, t := range tests {
		if len(t.ops) != 1 {
			continue
		}
		for op := range t.ops {
			if inSpecSet(op, set) {
				covered[op] = true
			}
		}
	}
	var missing []string
	for op := range specOps {
		if !inSpecSet(op, set) {
			continue
		}
		if !covered[op] {
			missing = append(missing, op)
		}
	}
	sort.Strings(missing)
	var errs []string
	for _, op := range missing {
		errs = append(errs, fmt.Sprintf("%s: missing 1:1 TestHappyPath* for %s", specPath, op))
	}
	return errs
}
