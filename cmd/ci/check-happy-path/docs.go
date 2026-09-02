package main

import (
	"fmt"
	"os"
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
	st, err := os.Stat(docsRoot)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return []string{err.Error()}
	}
	if !st.IsDir() {
		return nil
	}
	d, err := docnames.ParseDocs(docsRoot, "")
	if err != nil {
		return []string{err.Error()}
	}
	need := structuredDocsOps(d)
	covered := oneToOneCovered(tests)
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
			errs = append(errs, fmt.Sprintf("leftover %s is gone; remove it from the leftover list", op))
		case !ok && !allowed[op]:
			errs = append(errs, fmt.Sprintf("docs: missing 1:1 TestHappyPath* for %s", op))
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
		errs = append(errs, fmt.Sprintf("leftover %s is not a structured Routes Method+path; remove it from the leftover list", op))
	}
	sort.Strings(errs)
	return errs
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
