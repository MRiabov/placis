package main

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	"placis/cmd/ci/docnames"
)

var (
	jobsClosedHeads = map[string]bool{
		"Workflows": true,
		"Jobs":      true,
	}
	// River job kind `foo`
	qualifiedRiverJobRe = regexp.MustCompile("River job kind `" + `([a-z][a-z0-9_]*)` + "`")
	bareRiverJobRe      = regexp.MustCompile("River job `" + `([a-z][a-z0-9_]*)` + "`")
	insertsJobRe        = regexp.MustCompile(`\*\*inserts\*\* ` + "`" + `([a-z][a-z0-9_]*)` + "`")
)

type jobsCatalog struct {
	path  string
	heads []string
	names map[string]bool
}

func parseJobsCatalog(path string) (jobsCatalog, error) {
	src, err := os.ReadFile(path)
	if err != nil {
		return jobsCatalog{}, err
	}
	text := string(src)
	c := jobsCatalog{
		path:  filepath.ToSlash(path),
		heads: headingTitles(text),
		names: map[string]bool{},
	}
	if docnames.IsJobsIndex(path) {
		return c, nil
	}
	names, err := docnames.JobsTableNames(text)
	if err != nil {
		return c, fmt.Errorf("%s: %w", c.path, err)
	}
	c.names = names
	return c, nil
}

func checkJobsHeadings(c jobsCatalog) []string {
	if docnames.IsJobsIndex(c.path) {
		return nil
	}
	return leftoverHeadingErrs(c.path, filepath.Base(c.path), c.heads, jobsClosedHeads, nil)
}

func collectJobNames(r report) (map[string]bool, []string) {
	names := map[string]bool{}
	seen := map[string]string{}
	var errs []string
	for _, c := range r.jobsFiles {
		errs = append(errs, checkJobsHeadings(c)...)
		for n := range c.names {
			if prev, ok := seen[n]; ok {
				errs = append(errs, fmt.Sprintf("%s: River job kind `%s` already listed in %s", c.path, n, prev))
				continue
			}
			seen[n] = c.path
			names[n] = true
		}
	}
	return names, errs
}

func checkKnownRiverJobs(docsRoot string, names map[string]bool) []string {
	var errs []string
	err := filepath.WalkDir(docsRoot, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		if !strings.HasSuffix(path, ".md") {
			return nil
		}
		src, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		slash := filepath.ToSlash(path)
		text := string(src)
		seen := map[string]bool{}
		add := func(name string) {
			key := slash + ":" + name
			if seen[key] {
				return
			}
			seen[key] = true
			if names[name] {
				return
			}
			errs = append(errs, fmt.Sprintf("%s: unknown River job kind `%s`", slash, name))
		}
		for _, m := range qualifiedRiverJobRe.FindAllStringSubmatch(text, -1) {
			add(m[1])
		}
		for _, m := range bareRiverJobRe.FindAllStringSubmatch(text, -1) {
			add(m[1])
		}
		for _, m := range insertsJobRe.FindAllStringSubmatch(text, -1) {
			add(m[1])
		}
		return nil
	})
	if err != nil {
		return []string{err.Error()}
	}
	sort.Strings(errs)
	return errs
}
