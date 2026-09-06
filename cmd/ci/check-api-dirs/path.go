package main

import (
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

func slash(path string) string {
	return filepath.ToSlash(path)
}

func relSlash(root, path string) string {
	rel, err := filepath.Rel(root, path)
	if err != nil {
		return slash(path)
	}
	return slash(rel)
}

func dirExists(path string) bool {
	st, err := os.Stat(path)
	return err == nil && st.IsDir()
}

func skipWalk(slashPath string) bool {
	if strings.Contains(slashPath, "/testdata/") || strings.HasPrefix(slashPath, "testdata/") {
		return true
	}
	if strings.Contains(slashPath, "/.git/") || strings.HasPrefix(slashPath, ".git/") {
		return true
	}
	if strings.Contains(slashPath, "/node_modules/") {
		return true
	}
	if strings.Contains(slashPath, "/cmd/ci/") || strings.HasPrefix(slashPath, "cmd/ci/") {
		return true
	}
	return false
}

func isTestFile(slashPath string) bool {
	base := filepath.Base(slashPath)
	if strings.HasSuffix(base, "_test.go") {
		return true
	}
	if strings.Contains(base, ".test.") || strings.Contains(base, ".spec.") {
		return true
	}
	if strings.Contains(slashPath, "/e2e/") || strings.HasPrefix(slashPath, "e2e/") {
		return true
	}
	if strings.Contains(slashPath, "/generated/") {
		return true
	}
	return false
}

func isDtoFile(slashPath string) bool {
	base := filepath.Base(slashPath)
	if base == "dto.go" {
		return true
	}
	return strings.Contains(slashPath, "/dto/")
}

func isHttpapi(slashPath string) bool {
	return strings.Contains(slashPath, "/infrastructure/httpapi/") ||
		strings.HasPrefix(slashPath, "internal/infrastructure/httpapi/")
}

func underPipeline(slashPath string) bool {
	return strings.Contains(slashPath, "/pipeline/")
}

func underStore(slashPath string) bool {
	return strings.Contains(slashPath, "/store/")
}

func underAPIDir(slashPath string) bool {
	return strings.Contains(slashPath, "/api/")
}

func isAllowedDTOFile(slashPath string) bool {
	if !strings.HasSuffix(slashPath, ".go") {
		return false
	}
	if skipWalk(slashPath) {
		return false
	}
	if isHttpapi(slashPath) {
		return true
	}
	if !isDtoFile(slashPath) {
		return false
	}
	if underPipeline(slashPath) || underStore(slashPath) {
		return false
	}
	if underAPIDir(slashPath) {
		return true
	}
	return filepath.Base(slashPath) == "dto.go"
}

func collectFiles(root string) ([]string, error) {
	var files []string
	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel := relSlash(root, path)
		if d.IsDir() {
			name := d.Name()
			if name == ".git" || name == "node_modules" || name == "testdata" {
				return fs.SkipDir
			}
			if name == "ci" && (rel == "cmd/ci" || strings.HasSuffix(rel, "/cmd/ci")) {
				return fs.SkipDir
			}
			return nil
		}
		if skipWalk(rel) {
			return nil
		}
		switch {
		case strings.HasSuffix(rel, ".go"),
			strings.HasSuffix(rel, ".sql"),
			strings.HasSuffix(rel, ".ts"),
			strings.HasSuffix(rel, ".tsx"):
			files = append(files, path)
		}
		return nil
	})
	return files, err
}

func filterEnabled(root string, files []string) []string {
	var out []string
	for _, f := range files {
		p := f
		if !filepath.IsAbs(p) {
			p = filepath.Join(root, f)
		}
		rel := relSlash(root, p)
		if skipWalk(rel) {
			continue
		}
		out = append(out, p)
	}
	return out
}
