package main

import (
	"fmt"
	"go/parser"
	"go/token"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

func slash(path string) string { return filepath.ToSlash(path) }

func relSlash(root, path string) string {
	rel, err := filepath.Rel(root, path)
	if err != nil {
		return slash(path)
	}
	return slash(rel)
}

func skip(rel string) bool {
	if strings.Contains(rel, "/testdata/") || strings.HasPrefix(rel, "testdata/") {
		return true
	}
	if strings.Contains(rel, "/cmd/ci/") || strings.HasPrefix(rel, "cmd/ci/") {
		return true
	}
	if strings.Contains(rel, "/node_modules/") {
		return true
	}
	base := filepath.Base(rel)
	if strings.HasSuffix(base, "_test.go") || strings.Contains(base, ".test.") || strings.Contains(base, ".spec.") {
		return true
	}
	return false
}

func collect(root string) ([]string, error) {
	var files []string
	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel := relSlash(root, path)
		if d.IsDir() {
			if d.Name() == ".git" || d.Name() == "node_modules" || d.Name() == "testdata" {
				return fs.SkipDir
			}
			if d.Name() == "ci" && (rel == "cmd/ci" || strings.HasSuffix(rel, "/cmd/ci")) {
				return fs.SkipDir
			}
			return nil
		}
		if skip(rel) {
			return nil
		}
		switch {
		case strings.HasSuffix(rel, ".go"),
			strings.HasSuffix(rel, ".ts"),
			strings.HasSuffix(rel, ".tsx"):
			files = append(files, path)
		}
		return nil
	})
	return files, err
}

func checkGoImports(root string, files []string) []string {
	var errs []string
	fset := token.NewFileSet()
	for _, path := range files {
		rel := relSlash(root, path)
		if !strings.HasSuffix(rel, ".go") || skip(rel) {
			continue
		}
		src, err := os.ReadFile(path)
		if err != nil {
			errs = append(errs, fmt.Sprintf("%s: %v", rel, err))
			continue
		}
		f, err := parser.ParseFile(fset, path, src, parser.ImportsOnly)
		if err != nil {
			errs = append(errs, fmt.Sprintf("%s: parse: %v", rel, err))
			continue
		}
		for _, imp := range f.Imports {
			ip := strings.Trim(imp.Path.Value, `"`)
			if msg := forbiddenGo(rel, ip); msg != "" {
				errs = append(errs, fmt.Sprintf("%s: import %s: %s", rel, ip, msg))
			}
		}
	}
	return errs
}

func forbiddenGo(file, ip string) string {
	seg := strings.TrimPrefix(ip, "placis/")
	if strings.Contains(file, "/pipeline/") && (hasSeg(seg, "httpapi") || importIsAPI(seg)) {
		return "pipeline/ must not import api/ or httpapi"
	}
	if hasSeg(seg, "httpapi") && !strings.HasPrefix(file, "cmd/api/") {
		return "only cmd/api may import httpapi"
	}
	if storeRoot, ok := storeParent(seg); ok {
		if !pathUnder(file, storeRoot) {
			return "do not import another package's store/"
		}
	}
	if strings.HasPrefix(file, "internal/profile/") {
		if strings.Contains(seg, "internal/onboarding") || strings.Contains(seg, "internal/website") || strings.Contains(seg, "internal/ads") {
			return "profile must not import onboarding, website, or ads"
		}
	}
	if strings.HasPrefix(file, "internal/etl/") && strings.Contains(seg, "internal/onboarding") {
		return "etl must not import onboarding"
	}
	if strings.HasPrefix(file, "internal/billing/") && strings.Contains(seg, "infrastructure/ai") {
		return "billing must not import ai"
	}
	if isWebsiteEditorDo(file) && strings.Contains(seg, "website/assistant") {
		return "website editor Dos must not import website/assistant"
	}
	if strings.Contains(file, "internal/onboarding/assistant/") && strings.HasPrefix(seg, "internal/assistant") {
		return "onboarding/assistant must not import internal/assistant"
	}
	if isOnboarding07(file) && strings.Contains(seg, "onboarding/websiteeditor") {
		return "Contractor copy improvement must not import websiteeditor"
	}
	if strings.Contains(file, "internal/onboarding/websiteeditor/") && strings.Contains(seg, "onboarding/pipeline") {
		return "websiteeditor must not import pipeline/"
	}
	return ""
}

func hasSeg(path, name string) bool {
	return strings.Contains(path, "/"+name+"/") || strings.HasSuffix(path, "/"+name) || strings.Contains(path, "/"+name)
}

func importIsAPI(seg string) bool {
	if !strings.Contains(seg, "internal/") {
		return false
	}
	return strings.Contains(seg, "/api/") || strings.HasSuffix(seg, "/api")
}

func storeParent(ip string) (string, bool) {
	const suf = "/store"
	if !strings.Contains(ip, suf) {
		return "", false
	}
	i := strings.Index(ip, "/internal/")
	rest := ip
	if i >= 0 {
		rest = ip[i+1:]
	}
	if !strings.HasSuffix(rest, "/store") && !strings.Contains(rest, "/store/") {
		return "", false
	}
	parent := strings.TrimSuffix(rest, "/store")
	if j := strings.Index(parent, "/store/"); j >= 0 {
		parent = parent[:j]
	}
	parent = strings.TrimSuffix(parent, "/store")
	if !strings.HasPrefix(parent, "internal/") {
		return "", false
	}
	return parent, true
}

func pathUnder(file, dir string) bool {
	file = strings.TrimPrefix(file, "./")
	return file == dir || strings.HasPrefix(file, dir+"/")
}

func isWebsiteEditorDo(file string) bool {
	return file == "internal/website/editor.go" ||
		strings.HasSuffix(file, "/internal/website/editor.go") ||
		file == "internal/website/editor.go"
}

func isOnboarding07(file string) bool {
	return strings.Contains(file, "internal/onboarding/pipeline/") && strings.Contains(filepath.Base(file), "07_")
}
