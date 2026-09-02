package main

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"placis/cmd/ci/docnames"
)

// Unstructured leftover extra-## api.md files. Duplicate of
// check-pipeline-tables apiHeadingLeftover keys. Do not import that package.
var docsRouteSkipRel = map[string]bool{
	"business-profile/details/api.md":  true,
	"business-profile/projects/api.md": true,
	"other/leads/api.md":               true,
}

// docsTestingRel maps ParseAPIFile rel to a path under docsRoot.
// Duplicate of the owning-file convention; do not import
// check-pipeline-tables.
var docsTestingRel = map[string]string{
	"website/api.md":              "features/website/testing.md",
	"ads/api.md":                  "features/ads/ad-generation/testing.md",
	"billing/api.md":              "features/billing/testing.md",
	"assistant/api.md":            "features/assistant/testing.md",
	"onboarding/api.md":           "features/onboarding/testing.md",
	"other/auth/api.md":           "features/other/auth/testing.md",
	"other/media/api.md":          "features/other/media/testing.md",
	"general-architecture/api.md": "general-architecture/testing.md",
}

func structuredDocsOps(d docnames.Docs) map[string]bool {
	out := map[string]bool{}
	for rel, f := range d.ByFile {
		if docsRouteSkipRel[rel] || f == nil {
			continue
		}
		for op := range f.Paths {
			out[op] = true
		}
	}
	return out
}

func oneToOneCovered(tests []happyPathTest) map[string]bool {
	covered := map[string]bool{}
	for _, t := range tests {
		if len(t.ops) != 1 {
			continue
		}
		for op := range t.ops {
			covered[op] = true
		}
	}
	return covered
}

func checkDocsHappyPath(docsRoot string, tests []happyPathTest, leftover []string) []string {
	d, errs, need := loadStructuredDocs(docsRoot)
	if d == nil {
		return errs
	}
	covered := oneToOneCovered(tests)
	return append(errs, leftoverCoverage(need, covered, leftover, leftoverMsgs{
		list:    "leftover_tests.go",
		missing: "docs: missing 1:1 TestHappyPath* for %s",
	})...)
}

func checkTestingHappyPath(docsRoot string, leftover []string) []string {
	d, errs, need := loadStructuredDocs(docsRoot)
	if d == nil {
		return errs
	}
	covered, mapErrs := testingOneToOneCovered(docsRoot, d)
	errs = append(errs, mapErrs...)
	return append(errs, leftoverCoverage(need, covered, leftover, leftoverMsgs{
		list:    "leftover_docs.go",
		missing: "docs: missing ### TestHappyPath* Exercise 1:1 for %s",
	})...)
}

func loadStructuredDocs(docsRoot string) (*docnames.Docs, []string, map[string]bool) {
	st, err := os.Stat(docsRoot)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil, nil
		}
		return nil, []string{err.Error()}, nil
	}
	if !st.IsDir() {
		return nil, nil, nil
	}
	d, err := docnames.ParseDocs(docsRoot, "")
	if err != nil {
		return nil, []string{err.Error()}, nil
	}
	need := structuredDocsOps(d)
	return &d, nil, need
}

type leftoverMsgs struct {
	list    string
	missing string
}

func leftoverCoverage(need, covered map[string]bool, leftover []string, msgs leftoverMsgs) []string {
	allowed := leftoverSet(leftover)
	var errs []string
	var ops []string
	for op := range need {
		ops = append(ops, op)
	}
	sort.Strings(ops)
	for _, op := range ops {
		ok := covered[op]
		switch {
		case ok && allowed[op]:
			errs = append(errs, fmt.Sprintf("leftover %s is gone; remove it from %s", op, msgs.list))
		case !ok && !allowed[op]:
			errs = append(errs, fmt.Sprintf(msgs.missing, op))
		}
	}
	if len(need) == 0 {
		sort.Strings(errs)
		return errs
	}
	var extra []string
	for op := range allowed {
		if !need[op] {
			extra = append(extra, op)
		}
	}
	sort.Strings(extra)
	for _, op := range extra {
		errs = append(errs, fmt.Sprintf("leftover %s is not a structured Routes Method+path; remove it from %s", op, msgs.list))
	}
	sort.Strings(errs)
	return errs
}

func testingOneToOneCovered(docsRoot string, d *docnames.Docs) (map[string]bool, []string) {
	covered := map[string]bool{}
	var errs []string
	var rels []string
	for rel := range d.ByFile {
		rels = append(rels, rel)
	}
	sort.Strings(rels)
	for _, rel := range rels {
		f := d.ByFile[rel]
		if docsRouteSkipRel[rel] || f == nil {
			continue
		}
		if len(f.Paths) == 0 {
			continue
		}
		testingRel, ok := docsTestingRel[rel]
		if !ok {
			errs = append(errs, fmt.Sprintf("no owning testing.md for %s", rel))
			continue
		}
		path := filepath.Join(docsRoot, filepath.FromSlash(testingRel))
		src, err := os.ReadFile(path)
		if err != nil {
			if os.IsNotExist(err) {
				continue
			}
			errs = append(errs, err.Error())
			continue
		}
		for _, t := range parseTestingHappyPath(filepath.ToSlash(path), string(src)) {
			if len(t.ops) != 1 {
				continue
			}
			for op := range t.ops {
				if f.Paths[op] {
					covered[op] = true
				}
			}
		}
	}
	return covered, errs
}

func leftoverSet(leftover []string) map[string]bool {
	out := map[string]bool{}
	for _, n := range leftover {
		out[n] = true
	}
	return out
}

func inSpecSet(op string, set specSet) bool {
	internal := strings.Contains(op, " /internal/")
	switch set {
	case specPublic:
		return !internal
	case specWorker:
		return internal
	default:
		return false
	}
}
