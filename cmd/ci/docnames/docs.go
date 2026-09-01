package docnames

import (
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var (
	dtoNameRe   = regexp.MustCompile("^" + "`" + `([A-Z][A-Za-z0-9]+)` + "`" + "$")
	routeCellRe = regexp.MustCompile("^" + "`" + `((?:GET|POST|PATCH|PUT|DELETE) /\S+)` + "`" + "$")
	h3RouteRe   = regexp.MustCompile(`(?m)^### (GET|POST|PATCH|PUT|DELETE) (/\S+)\s*$`)
	tickPathRe  = regexp.MustCompile("`((?:(?:GET|POST|PATCH|PUT|DELETE) )?/[^`]+)`")
	identTickRe = regexp.MustCompile("`([A-Z][A-Za-z0-9]+)`")
)

// FileAPI is Routes / DTOs from one api.md (or HTTP conventions).
type FileAPI struct {
	Rel           string
	Paths         map[string]bool
	PublicPaths   map[string]bool
	InternalPaths map[string]bool
	DTOs          map[string]bool
	PublicDTOs    map[string]bool
	InternalDTOs  map[string]bool
	Banned        []string
}

// HasDTOTable reports at least one ## DTOs first-column name.
func (f *FileAPI) HasDTOTable() bool {
	return f != nil && len(f.DTOs) > 0
}

// Docs is the named-identifier inventory from docs/.
type Docs struct {
	Tables   map[string]bool
	DTOs     map[string]bool
	Paths    map[string]bool
	JobNames map[string]bool
	Banned   []string
	ByFile   map[string]*FileAPI
}

// ParseDocs walks docsRoot for persistence.md, api.md, and jobs.md.
func ParseDocs(docsRoot, jobsPath string) (Docs, error) {
	d := Docs{
		Tables:   map[string]bool{},
		DTOs:     map[string]bool{},
		Paths:    map[string]bool{},
		JobNames: map[string]bool{},
		ByFile:   map[string]*FileAPI{},
	}
	err := filepath.WalkDir(docsRoot, func(path string, e fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if e.IsDir() {
			return nil
		}
		slash := filepath.ToSlash(path)
		switch {
		case strings.HasSuffix(slash, "/persistence.md"):
			src, err := os.ReadFile(path)
			if err != nil {
				return err
			}
			for _, t := range TablesFromPersistence(string(src)) {
				addName(d.Tables, t)
			}
		case strings.HasSuffix(slash, "/api.md"):
			src, err := os.ReadFile(path)
			if err != nil {
				return err
			}
			rel := apiRel(docsRoot, path)
			f := ParseAPIFile(rel, string(src))
			d.ByFile[rel] = f
			mergeAPI(&d, f)
		}
		return nil
	})
	if err != nil {
		return d, err
	}
	if jobsPath != "" {
		if st, err := os.Stat(jobsPath); err == nil && !st.IsDir() {
			names, err := JobsFileNames(jobsPath)
			if err != nil {
				return d, err
			}
			d.JobNames = names
		}
	}
	return d, nil
}

func apiRel(docsRoot, path string) string {
	slash := filepath.ToSlash(path)
	features := filepath.ToSlash(filepath.Join(docsRoot, "features"))
	if rel, err := filepath.Rel(features, slash); err == nil && !strings.HasPrefix(rel, "..") {
		return filepath.ToSlash(rel)
	}
	if rel, err := filepath.Rel(docsRoot, slash); err == nil {
		return filepath.ToSlash(rel)
	}
	return slash
}

func mergeAPI(d *Docs, f *FileAPI) {
	for p := range f.Paths {
		addName(d.Paths, p)
	}
	for n := range f.DTOs {
		addName(d.DTOs, n)
	}
	d.Banned = append(d.Banned, f.Banned...)
}

// ParseAPIFile extracts Routes, DTOs, and Do not create paths from api.md text.
func ParseAPIFile(rel, text string) *FileAPI {
	f := &FileAPI{
		Rel:           rel,
		Paths:         map[string]bool{},
		PublicPaths:   map[string]bool{},
		InternalPaths: map[string]bool{},
		DTOs:          map[string]bool{},
		PublicDTOs:    map[string]bool{},
		InternalDTOs:  map[string]bool{},
	}
	if rest, ok := SectionAfter(text, "DTOs"); ok {
		for _, row := range tableRows(rest) {
			if len(row) == 0 {
				continue
			}
			if m := dtoNameRe.FindStringSubmatch(strings.TrimSpace(row[0])); len(m) == 2 {
				addName(f.DTOs, m[1])
			}
		}
	}
	if rest, ok := SectionAfter(text, "Routes"); ok {
		for _, row := range tableRows(rest) {
			if len(row) == 0 {
				continue
			}
			cell := strings.TrimSpace(row[0])
			op := ""
			if m := routeCellRe.FindStringSubmatch(cell); len(m) == 2 {
				op = m[1]
				addPath(f, op)
			}
			internal := strings.Contains(op, "/internal/")
			if len(row) > 2 {
				addRouteDTO(f, row[2], internal)
			}
			if len(row) > 3 {
				addRouteDTO(f, row[3], internal)
			}
		}
		for _, m := range h3RouteRe.FindAllStringSubmatch(rest, -1) {
			addPath(f, m[1]+" "+m[2])
		}
	}
	for _, m := range h3RouteRe.FindAllStringSubmatch(text, -1) {
		addPath(f, m[1]+" "+m[2])
	}
	for _, rest := range doNotCreateBodies(text) {
		for _, m := range tickPathRe.FindAllStringSubmatch(rest, -1) {
			if p := bannedToken(m[1]); p != "" {
				f.Banned = append(f.Banned, p)
			}
		}
	}
	return f
}

func doNotCreateBodies(text string) []string {
	var out []string
	if rest, ok := SectionAfter(text, "Do not create"); ok {
		out = append(out, rest)
	}
	if rest, ok := H3After(text, "Do not create"); ok {
		out = append(out, rest)
	}
	return out
}

func bannedToken(raw string) string {
	p := strings.TrimSpace(raw)
	p = strings.TrimRight(p, ".,);")
	if strings.Contains(p, "…") && !strings.HasSuffix(strings.TrimRight(p, "/"), "…") && !strings.HasSuffix(p, "…") {
		if i := strings.LastIndex(p, "…"); i >= 0 {
			rest := strings.TrimSpace(p[i+len("…"):])
			if strings.HasPrefix(rest, "/") {
				p = rest
			} else {
				return ""
			}
		}
	}
	if strings.Contains(p, " ") {
		method, path, ok := strings.Cut(p, " ")
		if ok && isHTTPMethod(method) && strings.HasPrefix(path, "/") {
			return method + " " + trimEllipsis(path)
		}
		if _, path, ok := strings.Cut(p, " "); ok && strings.HasPrefix(path, "/") {
			p = path
		}
	}
	if strings.HasPrefix(p, "/") {
		return trimEllipsis(p)
	}
	return ""
}

func trimEllipsis(p string) string {
	p = strings.TrimSuffix(p, "...")
	p = strings.TrimSuffix(p, "…")
	return strings.TrimRight(p, "/")
}

func isHTTPMethod(s string) bool {
	switch s {
	case "GET", "POST", "PATCH", "PUT", "DELETE":
		return true
	default:
		return false
	}
}

func addPath(f *FileAPI, p string) {
	p = strings.TrimRight(p, ".,);")
	addName(f.Paths, p)
	if strings.Contains(p, "/internal/") {
		addName(f.InternalPaths, p)
		return
	}
	addName(f.PublicPaths, p)
}

func addRouteDTO(f *FileAPI, cell string, internal bool) {
	for _, m := range identTickRe.FindAllStringSubmatch(cell, -1) {
		addName(f.DTOs, m[1])
		if internal {
			addName(f.InternalDTOs, m[1])
			continue
		}
		addName(f.PublicDTOs, m[1])
	}
}

func tableRows(body string) [][]string {
	var rows [][]string
	for _, line := range strings.Split(body, "\n") {
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "|") {
			continue
		}
		cells := splitRow(line)
		if len(cells) == 0 {
			continue
		}
		if isSepRow(cells) || isHeaderRow(cells) {
			continue
		}
		rows = append(rows, cells)
	}
	return rows
}

func splitRow(line string) []string {
	line = strings.Trim(line, "|")
	raw := strings.Split(line, "|")
	out := make([]string, len(raw))
	for i, c := range raw {
		out[i] = strings.TrimSpace(c)
	}
	return out
}

func isSepRow(cells []string) bool {
	for _, c := range cells {
		s := strings.ReplaceAll(c, " ", "")
		s = strings.ReplaceAll(s, ":", "")
		if s != "" && strings.Trim(s, "-") != "" {
			return false
		}
	}
	return true
}

func isHeaderRow(cells []string) bool {
	if len(cells) == 0 {
		return false
	}
	h := strings.ToLower(strings.Trim(cells[0], "`"))
	switch h {
	case "dto", "method + path", "workflow", "river job kind":
		return true
	default:
		return false
	}
}
