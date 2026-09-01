package main

import "fmt"

var persistClosedHeads = map[string]bool{
	"Tables":  true,
	"Indexes": true,
}

// Leftover grouping ## on undefined feature persistence.md files. Ceiling:
// extras may only shrink. Website and billing have none (## Tables + ## Indexes).
// Intro-only files (ads, media library, Details, Projects) have no ## yet.
var persistHeadingLeftover = map[string][]string{
	"assistant/persistence.md": {
		"Overlay items",
		"In-flight run",
		"Audit (owned by `ai`)",
	},
	"etl/persistence.md": {
		"Runs",
		"Sources (live extract identity)",
		"Fetches (append-only, one table per extract type)",
		"Website crawled URLs (live row, no `raw`)",
		"`imported_media`",
		"Google Maps listing (live row, no `raw`)",
		"Project verdict (skip)",
	},
	"onboarding/persistence.md": {
		"Onboarding assistant (guide)",
		"Onboarding sessions and client interview",
		"Business research",
		"Website activation",
	},
}

func checkPersistHeadings(r report) []string {
	var errs []string
	for _, p := range r.persistFiles {
		errs = append(errs, leftoverHeadingErrs(p.path, p.rel, p.heads, persistClosedHeads, persistHeadingLeftover)...)
		hasTables := false
		hasIndexes := false
		for _, h := range p.heads {
			if h == "Tables" {
				hasTables = true
			}
			if h == "Indexes" {
				hasIndexes = true
			}
		}
		if hasTables && !hasIndexes {
			errs = append(errs, fmt.Sprintf("%s: missing ## Indexes", p.path))
		}
	}
	return errs
}
