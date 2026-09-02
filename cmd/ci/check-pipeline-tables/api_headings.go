package main

import (
	"fmt"
	"strings"
)

var apiClosedHeads = map[string]bool{
	"DTOs":          true,
	"Routes":        true,
	"Do not create": true,
}

// Leftover extra ## on undefined feature api.md files. Ceiling: a file may
// only keep a subset. Drop a title here in the same PR that removes it.
// Website, billing, ads, assistant, onboarding, and auth have none.
var apiHeadingLeftover = map[string][]string{
	"business-profile/details/api.md": {
		"Serve only types on HTTP",
		"`update_details` (one governed tool)",
	},
	"business-profile/projects/api.md": {"Routes — projects"},
	"other/leads/api.md": {"Serve only types on HTTP"},
	"other/media/api.md": {"Serve only types on HTTP"},
}

func checkAPIHeadings(r report) []string {
	var errs []string
	for _, f := range r.apiFiles {
		errs = append(errs, checkOneAPI(f)...)
	}
	return errs
}

func checkOneAPI(f headingFile) []string {
	errs := leftoverHeadingErrs(f.path, f.rel, f.heads, apiClosedHeads, apiHeadingLeftover)
	hasRoutes := false
	hasDoNotCreate := false
	for _, h := range f.heads {
		if h == "Routes" || strings.HasPrefix(h, "Routes") {
			hasRoutes = true
		}
		if h == "Do not create" {
			hasDoNotCreate = true
		}
	}
	if !hasRoutes {
		errs = append(errs, fmt.Sprintf("%s: missing ## Routes", f.path))
	}
	if !hasDoNotCreate {
		errs = append(errs, fmt.Sprintf("%s: missing ## Do not create", f.path))
	}
	return errs
}
