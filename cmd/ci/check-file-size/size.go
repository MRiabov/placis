package main

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

const (
	warnLines = 800
	hardLines = 1200
	demoHard  = 800
)

var sizeTrees = []string{
	"docs", "internal", "cmd", "catalog/", "frontend-3",
}

func slash(path string) string { return filepath.ToSlash(path) }

func relSlash(root, path string) string {
	rel, err := filepath.Rel(root, path)
	if err != nil {
		return slash(path)
	}
	return slash(rel)
}

func skipSize(rel string) bool {
	if strings.Contains(rel, "/testdata/") || strings.HasPrefix(rel, "testdata/") {
		return true
	}
	if strings.Contains(rel, "/.agents/") || strings.HasPrefix(rel, ".agents/") {
		return true
	}
	if strings.Contains(rel, "/node_modules/") || strings.Contains(rel, "/.git/") {
		return true
	}
	switch rel {
	case "docs/glossary.md", "docs/features/onboarding/testing.md":
		return true
	}
	return false
}

func sizeExt(rel string) bool {
	switch filepath.Ext(rel) {
	case ".go", ".md", ".ts", ".tsx", ".js", ".mjs", ".css", ".sql", ".yaml", ".yml", ".json", ".html", ".astro":
		return true
	default:
		return false
	}
}

func checkSizes(root string) (warns, errs []string) {
	walk := func(tree string, hard int, warn int) {
		dir := filepath.Join(root, tree)
		if _, err := os.Stat(dir); err != nil {
			return
		}
		_ = filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
			if err != nil {
				return nil
			}
			rel := relSlash(root, path)
			if d.IsDir() {
				if d.Name() == ".git" || d.Name() == "node_modules" || d.Name() == "testdata" {
					return fs.SkipDir
				}
				return nil
			}
			if skipSize(rel) || !sizeExt(rel) {
				return nil
			}
			src, err := os.ReadFile(path)
			if err != nil {
				return nil
			}
			n := lineCount(src)
			if n > hard {
				errs = append(errs, fmt.Sprintf("%s: %d lines (max %d)", rel, n, hard))
			} else if warn > 0 && n > warn {
				warns = append(warns, fmt.Sprintf("%s: %d lines (max %d)", rel, n, warn))
			}
			return nil
		})
	}
	for _, tree := range sizeTrees {
		walk(tree, hardLines, warnLines)
	}
	walk("apps/demo/src", demoHard, 0)
	return warns, errs
}

func lineCount(src []byte) int {
	if len(src) == 0 {
		return 0
	}
	n := 1
	for _, b := range src {
		if b == '\n' {
			n++
		}
	}
	if src[len(src)-1] == '\n' {
		n--
	}
	if n < 1 {
		return 1
	}
	return n
}
