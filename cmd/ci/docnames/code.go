package docnames

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var riverNameReturnRe = regexp.MustCompile(
	`func\s+\([^)]+\)\s+` + "K" + `ind\(\)\s+string\s*\{[^}]*return\s+"([a-z][a-z0-9_]*)"`,
)

// OpenAPI is paths and operation-linked schema names from one spec file.
type OpenAPI struct {
	Path string
	Ops  map[string]bool
	DTOs map[string]bool
}

// ParseOpenAPIFile reads an OpenAPI 3 JSON document. Missing path is not an
// error: callers skip the file.
func ParseOpenAPIFile(path string) (OpenAPI, error) {
	out := OpenAPI{Path: filepath.ToSlash(path), Ops: map[string]bool{}, DTOs: map[string]bool{}}
	src, err := os.ReadFile(path)
	if err != nil {
		return out, err
	}
	var root any
	if err := json.Unmarshal(src, &root); err != nil {
		return out, fmt.Errorf("%s: %w", out.Path, err)
	}
	obj, _ := root.(map[string]any)
	if obj == nil {
		return out, fmt.Errorf("%s: OpenAPI root must be an object", out.Path)
	}
	paths, _ := obj["paths"].(map[string]any)
	for p, item := range paths {
		ops, _ := item.(map[string]any)
		if ops == nil {
			continue
		}
		for method, body := range ops {
			upper := strings.ToUpper(method)
			if !isHTTPMethod(upper) {
				continue
			}
			token := upper + " " + p
			addName(out.Ops, token)
			collectSchemaRefs(body, out.DTOs)
		}
	}
	return out, nil
}

func collectSchemaRefs(v any, dst map[string]bool) {
	switch t := v.(type) {
	case map[string]any:
		if ref, ok := t["$ref"].(string); ok {
			if name, ok := schemaRefName(ref); ok {
				addName(dst, name)
			}
		}
		for _, child := range t {
			collectSchemaRefs(child, dst)
		}
	case []any:
		for _, child := range t {
			collectSchemaRefs(child, dst)
		}
	}
}

func schemaRefName(ref string) (string, bool) {
	const prefix = "#/components/schemas/"
	if !strings.HasPrefix(ref, prefix) {
		return "", false
	}
	name := strings.TrimPrefix(ref, prefix)
	if name == "" || strings.Contains(name, "/") {
		return "", false
	}
	return name, true
}

// RiverFilesFromGo maps River job kind name() return strings to Go files
// under roots. cmd/ci is skipped so this checker is not a source of those names.
func RiverFilesFromGo(roots ...string) (map[string][]string, error) {
	out := map[string][]string{}
	seen := map[string]bool{}
	for _, root := range roots {
		st, err := os.Stat(root)
		if err != nil {
			if os.IsNotExist(err) {
				continue
			}
			return nil, err
		}
		if !st.IsDir() {
			continue
		}
		err = filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
			if err != nil {
				return err
			}
			if d.IsDir() {
				if skipGoDir(root, path, d.Name()) {
					return fs.SkipDir
				}
				return nil
			}
			if !strings.HasSuffix(path, ".go") {
				return nil
			}
			src, err := os.ReadFile(path)
			if err != nil {
				return err
			}
			slash := filepath.ToSlash(path)
			for _, m := range riverNameReturnRe.FindAllStringSubmatch(string(src), -1) {
				key := slash + "\x00" + m[1]
				if seen[key] {
					continue
				}
				seen[key] = true
				out[m[1]] = append(out[m[1]], slash)
			}
			return nil
		})
		if err != nil {
			return nil, err
		}
	}
	return out, nil
}

func skipGoDir(root, path, name string) bool {
	if name == "testdata" {
		return true
	}
	slash := filepath.ToSlash(path)
	rootSlash := filepath.ToSlash(root)
	if filepath.Base(rootSlash) == "cmd" && name == "ci" {
		return true
	}
	if strings.HasSuffix(slash, "/cmd/ci") {
		return true
	}
	return false
}

// SQLFilesFromDir maps CREATE TABLE names to goose SQL files.
func SQLFilesFromDir(dir string) (map[string][]string, error) {
	out := map[string][]string{}
	st, err := os.Stat(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return out, nil
		}
		return nil, err
	}
	if !st.IsDir() {
		return out, nil
	}
	err = filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() || !strings.HasSuffix(strings.ToLower(d.Name()), ".sql") {
			return nil
		}
		src, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		slash := filepath.ToSlash(path)
		seen := map[string]bool{}
		for _, t := range TablesFromSQL(string(src)) {
			if seen[t] {
				continue
			}
			seen[t] = true
			out[t] = append(out[t], slash)
		}
		return nil
	})
	return out, err
}
