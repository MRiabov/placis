package main

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var (
	createTableRe = regexp.MustCompile(`(?i)\bCREATE\s+TABLE\b`)
	sqlLiteralRe  = regexp.MustCompile("(?is)`[^`]*(?:SELECT\\s+.+\\s+FROM|INSERT\\s+INTO|UPDATE\\s+\\S+\\s+SET|DELETE\\s+FROM)")
)

func checkSQL(root string, files []string) []string {
	var errs []string
	for _, path := range files {
		rel := relSlash(root, path)
		if skipWalk(rel) {
			continue
		}
		switch {
		case strings.HasSuffix(rel, ".sql"):
			src, err := os.ReadFile(path)
			if err != nil {
				errs = append(errs, fmt.Sprintf("%s: %v", rel, err))
				continue
			}
			if createTableRe.Match(src) && !underGoose(rel) {
				errs = append(errs, fmt.Sprintf("%s: CREATE TABLE only in internal/infrastructure/store/migrations/", rel))
			}
			if filepath.Base(rel) == "queries.sql" && !underStore(rel) {
				errs = append(errs, fmt.Sprintf("%s: queries.sql only under store/", rel))
			}
		case strings.HasSuffix(rel, ".go") && underPipeline(rel):
			src, err := os.ReadFile(path)
			if err != nil {
				errs = append(errs, fmt.Sprintf("%s: %v", rel, err))
				continue
			}
			if sqlInGo(path, src) {
				errs = append(errs, fmt.Sprintf("%s: SQL string literals are not allowed in pipeline/", rel))
			}
		}
	}
	return errs
}

func underGoose(rel string) bool {
	return strings.Contains(rel, "internal/infrastructure/store/migrations/") ||
		strings.HasPrefix(rel, "internal/infrastructure/store/migrations/")
}

func sqlInGo(path string, src []byte) bool {
	if sqlLiteralRe.Match(src) {
		return true
	}
	fset := token.NewFileSet()
	f, err := parser.ParseFile(fset, path, src, 0)
	if err != nil {
		return false
	}
	found := false
	ast.Inspect(f, func(n ast.Node) bool {
		lit, ok := n.(*ast.BasicLit)
		if !ok || !isGoStringLit(lit.Value) {
			return true
		}
		if sqlLiteralRe.MatchString(lit.Value) {
			found = true
			return false
		}
		return true
	})
	return found
}

func isGoStringLit(v string) bool {
	if v == "" {
		return false
	}
	return v[0] == '"' || v[0] == '`'
}
