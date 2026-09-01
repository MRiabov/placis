package docnames

import (
	"regexp"
	"sort"
	"strings"
)

var (
	tableDefRe    = regexp.MustCompile("(?m)^(?:#{2,3}\\s+|[-*]\\s+)`([a-z][a-z0-9_]*(?:\\.[a-z][a-z0-9_]*)?)`")
	qualifiedRe   = regexp.MustCompile("qualified\\s+`([a-z][a-z0-9_]*\\.[a-z][a-z0-9_]*)`")
	schemaRe      = regexp.MustCompile("Postgres schema `([a-z][a-z0-9_]*)`")
	createTableRe = regexp.MustCompile(`(?i)CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:ONLY\s+)?(?:"?([a-z][a-z0-9_]*)"?\.)?"?([a-z][a-z0-9_]*)"?`)
)

func isTableName(name string) bool {
	if strings.Contains(name, ".") || strings.Contains(name, "_") {
		return true
	}
	switch name {
	case "runs", "sources", "menus", "ads", "leads", "files", "tenants", "projects", "subscriptions":
		return true
	default:
		return false
	}
}

// TablesFromPersistence extracts table names from a persistence.md body.
func TablesFromPersistence(text string) []string {
	seen := map[string]bool{}
	add := func(name string) {
		if name == "" || seen[name] {
			return
		}
		seen[name] = true
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
		for _, t := range sortedKeys(seen) {
			if !strings.Contains(t, ".") {
				add(schema + "." + t)
			}
		}
	}
	out := sortedKeys(seen)
	sort.Strings(out)
	return out
}

// TablesFromSQL collects CREATE TABLE names from a goose SQL file.
func TablesFromSQL(text string) []string {
	seen := map[string]bool{}
	for _, m := range createTableRe.FindAllStringSubmatch(text, -1) {
		local := strings.ToLower(m[2])
		if m[1] != "" {
			addName(seen, strings.ToLower(m[1])+"."+local)
		}
		addName(seen, local)
	}
	out := sortedKeys(seen)
	sort.Strings(out)
	return out
}

// TableKnown reports whether a SQL table is in the docs table set
// (local or schema-qualified).
func TableKnown(name string, docs map[string]bool) bool {
	if docs[name] {
		return true
	}
	if i := strings.LastIndex(name, "."); i >= 0 {
		return docs[name[i+1:]]
	}
	for d := range docs {
		if strings.HasSuffix(d, "."+name) {
			return true
		}
	}
	return false
}
