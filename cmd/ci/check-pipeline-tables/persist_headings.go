package main

import "fmt"

var persistClosedHeads = map[string]bool{
	"Tables":  true,
	"Indexes": true,
}

// Leftover grouping ## on undefined feature persistence.md files. Ceiling:
// extras may only shrink. Website, billing, ads, assistant, onboarding,
// auth, the media library, ETL, Details, and Projects have none
// (## Tables + ## Indexes).
var persistHeadingLeftover = map[string][]string{}

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
