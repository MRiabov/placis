package docnames

import (
	"fmt"
	"os"
	"regexp"
)

var jobsRowNameRe = regexp.MustCompile(`(?m)^\s*\|\s*` + "`" + `([a-z][a-z0-9_]*)` + "`")

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

// JobsFileNames loads River job kind names from a jobs.md path.
func JobsFileNames(path string) (map[string]bool, error) {
	src, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return JobsTableNames(string(src))
}
