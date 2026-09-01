package main

import (
	"fmt"
	"regexp"
)

var testingBannedHeads = map[string]bool{
	"Routes":        true,
	"DTOs":          true,
	"Tables":        true,
	"Do not create": true,
}

// Banned api.md / persistence.md ## that still exist on a testing.md. Empty
// today; extras may only shrink.
var testingHeadingLeftover = map[string][]string{}

var testingMethodHeadRe = regexp.MustCompile(`^(GET|POST|PATCH|PUT|DELETE)\s+/`)

func checkTestingHeadings(r report) []string {
	var errs []string
	for _, f := range r.testingFiles {
		allowed := map[string]bool{}
		for _, t := range testingHeadingLeftover[f.rel] {
			allowed[t] = true
		}
		have := map[string]bool{}
		for _, h := range f.heads {
			have[h] = true
			if testingBannedHeads[h] && !allowed[h] {
				errs = append(errs, fmt.Sprintf("%s: extra heading ## %s", f.path, h))
			}
		}
		for _, t := range testingHeadingLeftover[f.rel] {
			if !have[t] {
				errs = append(errs, fmt.Sprintf("%s: leftover heading ## %s is gone; remove it from the leftover list", f.path, t))
			}
		}
		for _, h := range f.h3 {
			if testingMethodHeadRe.MatchString(h) {
				errs = append(errs, fmt.Sprintf("%s: extra heading ### %s", f.path, h))
			}
		}
	}
	return errs
}
