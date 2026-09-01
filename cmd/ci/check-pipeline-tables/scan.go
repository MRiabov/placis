package main

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

var (
	backtickRe    = regexp.MustCompile("`([^`]+)`")
	tableDefRe    = regexp.MustCompile("(?m)^(?:#{2,3}\\s+|[-*]\\s+)`([a-z][a-z0-9_]*(?:\\.[a-z][a-z0-9_]*)?)`")
	qualifiedRe   = regexp.MustCompile("qualified\\s+`([a-z][a-z0-9_]*\\.[a-z][a-z0-9_]*)`")
	schemaRe      = regexp.MustCompile("Postgres schema `([a-z][a-z0-9_]*)`")
	headingRe     = regexp.MustCompile(`(?m)^## (.+)$`)
	tableTokenRe  = regexp.MustCompile(`^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)?$`)
	requiredHeads = []string{"Trigger", "Pre", "Must not", "Do", "Persist", "Fail", "Out", "Invariants"}
	optionalHeads = map[string]bool{"Reads": true, "Loads": true, "Sends": true, "Calls": true}
	adsTestingRel = filepath.ToSlash(filepath.Join("ads", "ad-generation", "testing.md"))
)

type persistFile struct {
	path        string
	featureDir  string
	tables      []string
	testingPath string
	pipeTestDir string
}

type stepFile struct {
	path     string
	testPath string
	tables   []string
}

type report struct {
	known        map[string]bool
	persistFiles []persistFile
	steps        []stepFile
}

func inspect(root string) (report, error) {
	var r report
	r.known = map[string]bool{}
	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		slash := filepath.ToSlash(path)
		switch {
		case strings.HasSuffix(slash, "/persistence.md"):
			p, err := parsePersistence(path)
			if err != nil {
				return err
			}
			r.persistFiles = append(r.persistFiles, p)
			for _, t := range p.tables {
				r.known[t] = true
			}
		case isPipelineStep(slash):
			s, err := parseStep(path)
			if err != nil {
				return err
			}
			r.steps = append(r.steps, s)
		}
		return nil
	})
	if err != nil {
		return r, err
	}
	sort.Slice(r.persistFiles, func(i, j int) bool { return r.persistFiles[i].path < r.persistFiles[j].path })
	sort.Slice(r.steps, func(i, j int) bool { return r.steps[i].path < r.steps[j].path })
	return r, nil
}

func isPipelineStep(slash string) bool {
	if !strings.Contains(slash, "/pipeline/") || !strings.HasSuffix(slash, ".md") {
		return false
	}
	if strings.Contains(slash, "/pipeline/testing/") {
		return false
	}
	base := filepath.Base(slash)
	return base != "README.md"
}

func parsePersistence(path string) (persistFile, error) {
	src, err := os.ReadFile(path)
	if err != nil {
		return persistFile{}, err
	}
	text := string(src)
	p := persistFile{path: filepath.ToSlash(path)}
	p.featureDir = filepath.ToSlash(filepath.Dir(path))
	seen := map[string]bool{}
	add := func(name string) {
		if name == "" || seen[name] {
			return
		}
		seen[name] = true
		p.tables = append(p.tables, name)
	}
	for _, m := range tableDefRe.FindAllStringSubmatch(text, -1) {
		if isTableName(m[1]) {
			add(m[1])
		}
	}
	for _, m := range qualifiedRe.FindAllStringSubmatch(text, -1) {
		add(m[1])
	}
	schema := ""
	if m := schemaRe.FindStringSubmatch(text); len(m) == 2 {
		schema = m[1]
	}
	if schema != "" {
		for _, t := range append([]string(nil), p.tables...) {
			if !strings.Contains(t, ".") {
				add(schema + "." + t)
			}
		}
	}
	sort.Strings(p.tables)
	p.testingPath = testingPathFor(p.featureDir)
	p.pipeTestDir = filepath.ToSlash(filepath.Join(p.featureDir, "pipeline", "testing"))
	if p.featureDir == filepath.ToSlash(filepath.Join("docs", "features", "ads")) {
		p.pipeTestDir = filepath.ToSlash(filepath.Join("docs", "features", "ads", "ad-generation", "pipeline", "testing"))
	}
	return p, nil
}

func testingPathFor(featureDir string) string {
	direct := filepath.ToSlash(filepath.Join(featureDir, "testing.md"))
	if fileExists(direct) {
		return direct
	}
	if featureDir == filepath.ToSlash(filepath.Join("docs", "features", "ads")) {
		alt := filepath.ToSlash(filepath.Join("docs", "features", adsTestingRel))
		if fileExists(alt) {
			return alt
		}
	}
	return ""
}

func parseStep(path string) (stepFile, error) {
	s := stepFile{path: filepath.ToSlash(path)}
	dir := filepath.Dir(path)
	s.testPath = filepath.ToSlash(filepath.Join(dir, "testing", filepath.Base(path)))
	return s, nil
}

func stepTables(src string, known map[string]bool) []string {
	seen := map[string]bool{}
	var out []string
	for _, m := range backtickRe.FindAllStringSubmatch(src, -1) {
		tok := m[1]
		if !tableTokenRe.MatchString(tok) {
			continue
		}
		if !known[tok] {
			continue
		}
		if seen[tok] {
			continue
		}
		seen[tok] = true
		out = append(out, tok)
	}
	sort.Strings(out)
	return out
}

func docMentions(src string, table string) bool {
	if strings.Contains(src, "`"+table+"`") {
		return true
	}
	if i := strings.LastIndex(table, "."); i >= 0 {
		return strings.Contains(src, "`"+table[i+1:]+"`")
	}
	re := regexp.MustCompile("`[a-z][a-z0-9_]*\\." + regexp.QuoteMeta(table) + "`")
	return re.MatchString(src)
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func checkPipelinePairing(r report) []string {
	var errs []string
	for _, s := range r.steps {
		if !fileExists(s.testPath) {
			errs = append(errs, fmt.Sprintf("%s: missing %s", s.path, s.testPath))
			continue
		}
		stepSrc, err := os.ReadFile(s.path)
		if err != nil {
			errs = append(errs, err.Error())
			continue
		}
		testSrc, err := os.ReadFile(s.testPath)
		if err != nil {
			errs = append(errs, err.Error())
			continue
		}
		testText := string(testSrc)
		for _, t := range stepTables(string(stepSrc), r.known) {
			if !docMentions(testText, t) {
				errs = append(errs, fmt.Sprintf("%s: table %s missing from %s", s.path, t, s.testPath))
			}
		}
	}
	return errs
}

func checkCoverage(r report) []string {
	var errs []string
	for _, p := range r.persistFiles {
		if p.testingPath == "" {
			continue
		}
		union, err := readUnion(p.testingPath, p.pipeTestDir)
		if err != nil {
			errs = append(errs, err.Error())
			continue
		}
		for _, t := range p.tables {
			if strings.Contains(t, ".") {
				// schema-qualified alias of an unqualified bullet; skip if the
				// local name is already required.
				local := t[strings.LastIndex(t, ".")+1:]
				if containsString(p.tables, local) {
					continue
				}
			}
			if !docMentions(union, t) {
				errs = append(errs, fmt.Sprintf("%s: table %s missing from %s and %s", p.path, t, p.testingPath, p.pipeTestDir))
			}
		}
	}
	return errs
}

func readUnion(testingPath, pipeTestDir string) (string, error) {
	b, err := os.ReadFile(testingPath)
	if err != nil {
		return "", err
	}
	var sb strings.Builder
	sb.Write(b)
	entries, err := os.ReadDir(pipeTestDir)
	if err != nil {
		if os.IsNotExist(err) {
			return sb.String(), nil
		}
		return "", err
	}
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".md") {
			continue
		}
		p := filepath.Join(pipeTestDir, e.Name())
		part, err := os.ReadFile(p)
		if err != nil {
			return "", err
		}
		sb.Write(part)
	}
	return sb.String(), nil
}

func containsString(ss []string, want string) bool {
	for _, s := range ss {
		if s == want {
			return true
		}
	}
	return false
}

func isTableName(name string) bool {
	if strings.Contains(name, ".") || strings.Contains(name, "_") {
		return true
	}
	switch name {
	case "runs", "sources", "menus", "ads", "leads", "files", "tenants", "projects":
		return true
	default:
		return false
	}
}

func checkHeadings(r report) []string {
	var errs []string
	for _, s := range r.steps {
		src, err := os.ReadFile(s.path)
		if err != nil {
			errs = append(errs, err.Error())
			continue
		}
		heads := headingRe.FindAllStringSubmatch(string(src), -1)
		have := map[string]bool{}
		for _, m := range heads {
			title := strings.TrimSpace(m[1])
			if !allowedHeading(title) {
				errs = append(errs, fmt.Sprintf("%s: extra heading ## %s", s.path, title))
				continue
			}
			have[headingKey(title)] = true
		}
		for _, req := range requiredHeads {
			if req == "Do" {
				if !have["Do"] {
					errs = append(errs, fmt.Sprintf("%s: missing ## Do", s.path))
				}
				continue
			}
			if !have[req] {
				errs = append(errs, fmt.Sprintf("%s: missing ## %s", s.path, req))
			}
		}
	}
	return errs
}

func allowedHeading(title string) bool {
	if optionalHeads[title] {
		return true
	}
	for _, req := range requiredHeads {
		if title == req {
			return true
		}
	}
	return strings.HasPrefix(title, "Do — ")
}

func headingKey(title string) string {
	if strings.HasPrefix(title, "Do — ") {
		return "Do"
	}
	return title
}
