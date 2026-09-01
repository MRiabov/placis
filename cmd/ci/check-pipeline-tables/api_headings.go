package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

var apiClosedHeads = map[string]bool{
	"DTOs":          true,
	"Routes":        true,
	"Do not create": true,
}

// Leftover extra ## on undefined feature api.md files. Ceiling: a file may
// only keep a subset. Drop a title here in the same PR that removes it.
// Website and billing have none.
var apiHeadingLeftover = map[string][]string{
	"ads/api.md": {"Serve only types on HTTP"},
	"assistant/api.md": {
		"Serve only types on HTTP",
		"Routes — Go WebSocket (text chat only)",
		"Routes — HTTP",
		"Named codes (this feature)",
	},
	"business-profile/details/api.md": {
		"Serve only types on HTTP",
		"`update_details` (one governed tool)",
	},
	"business-profile/projects/api.md": {"Routes — projects"},
	"onboarding/api.md": {
		"Serve only types on HTTP",
		"Routes — onboarding assistant (guide)",
		"Listed",
	},
	"other/auth/api.md":  {"Serve only types on HTTP"},
	"other/leads/api.md": {"Serve only types on HTTP"},
	"other/media/api.md": {"Serve only types on HTTP"},
}

func parseAPIFile(root, path string) (apiFile, error) {
	src, err := os.ReadFile(path)
	if err != nil {
		return apiFile{}, err
	}
	rel, err := filepath.Rel(root, path)
	if err != nil {
		rel = path
	}
	a := apiFile{
		path: filepath.ToSlash(path),
		rel:  filepath.ToSlash(rel),
	}
	for _, m := range headingRe.FindAllStringSubmatch(string(src), -1) {
		a.heads = append(a.heads, strings.TrimSpace(m[1]))
	}
	return a, nil
}

func checkAPIHeadings(r report) []string {
	var errs []string
	for _, f := range r.apiFiles {
		errs = append(errs, checkOneAPI(f)...)
	}
	return errs
}

func checkOneAPI(f apiFile) []string {
	var errs []string
	allowed := map[string]bool{}
	for _, t := range apiHeadingLeftover[f.rel] {
		allowed[t] = true
	}
	have := map[string]bool{}
	hasRoutes := false
	hasDoNotCreate := false
	for _, h := range f.heads {
		have[h] = true
		if h == "Routes" || strings.HasPrefix(h, "Routes") {
			hasRoutes = true
		}
		if h == "Do not create" {
			hasDoNotCreate = true
		}
		if apiClosedHeads[h] {
			continue
		}
		if !allowed[h] {
			errs = append(errs, fmt.Sprintf("%s: extra heading ## %s", f.path, h))
		}
	}
	if !hasRoutes {
		errs = append(errs, fmt.Sprintf("%s: missing ## Routes", f.path))
	}
	if !hasDoNotCreate {
		errs = append(errs, fmt.Sprintf("%s: missing ## Do not create", f.path))
	}
	for _, t := range apiHeadingLeftover[f.rel] {
		if !have[t] {
			errs = append(errs, fmt.Sprintf("%s: leftover heading ## %s is gone; remove it from apiHeadingLeftover", f.path, t))
		}
	}
	return errs
}
