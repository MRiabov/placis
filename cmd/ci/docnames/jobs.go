package docnames

import (
	"fmt"
	"path/filepath"
	"regexp"
	"strings"
)

var jobsRowNameRe = regexp.MustCompile(`(?m)^\s*\|\s*` + "`" + `([a-z][a-z0-9_]*)` + "`")

// IsJobsIndex reports the River conventions file (not a named ## Jobs list).
func IsJobsIndex(path string) bool {
	return strings.HasSuffix(filepath.ToSlash(path), "/infrastructure/jobs.md")
}

// JobsTableNames reads ## Jobs first-column backticks from jobs.md text.
func JobsTableNames(text string) (map[string]bool, error) {
	rest, ok := SectionAfter(text, "Jobs")
	if !ok {
		return nil, fmt.Errorf("missing ## Jobs")
	}
	out := map[string]bool{}
	for _, m := range jobsRowNameRe.FindAllStringSubmatch(rest, -1) {
		addName(out, m[1])
	}
	if len(out) == 0 {
		return nil, fmt.Errorf("## Jobs has no River job kind rows")
	}
	return out, nil
}
