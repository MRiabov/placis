package main

import (
	"fmt"
	"regexp"
)

var testingClosedH2 = map[string]bool{
	"E2E":         true,
	"Integration": true,
}

var testingClosedH4 = map[string]bool{
	"Setup":  true,
	"Invoke": true,
	"Assert": true,
	"Fail":   true,
	"Mocked": true,
}

var testingMethodHeadRe = regexp.MustCompile(`^(GET|POST|PATCH|PUT|DELETE)\s+/`)

func checkTestingHeadings(r report) []string {
	var errs []string
	for _, f := range r.testingFiles {
		errs = append(errs, checkOneTesting(f)...)
	}
	return errs
}

func checkOneTesting(f headingFile) []string {
	var errs []string
	if len(f.atx) == 0 {
		return []string{fmt.Sprintf("%s: missing ## E2E or ## Integration", f.path)}
	}

	seenH2 := map[string]bool{}
	h2 := ""
	h3 := ""
	h2HasTest := false
	var h4 []string

	flushTest := func() {
		if h3 == "" {
			return
		}
		errs = append(errs, checkTestingH4(f.path, h3, h4)...)
		h3 = ""
		h4 = nil
	}
	flushH2 := func() {
		flushTest()
		if h2 != "" && !h2HasTest {
			errs = append(errs, fmt.Sprintf("%s: missing ### under ## %s", f.path, h2))
		}
		h2HasTest = false
	}

	hasClosedH2 := false
	for _, h := range f.atx {
		switch h.level {
		case 2:
			flushH2()
			if !testingClosedH2[h.title] {
				errs = append(errs, fmt.Sprintf("%s: extra heading ## %s", f.path, h.title))
			} else if seenH2[h.title] {
				errs = append(errs, fmt.Sprintf("%s: extra heading ## %s", f.path, h.title))
			} else {
				hasClosedH2 = true
			}
			seenH2[h.title] = true
			h2 = h.title
			h3 = ""
			h4 = nil
			h2HasTest = false
		case 3:
			flushTest()
			if h2 == "" || !testingClosedH2[h2] {
				errs = append(errs, fmt.Sprintf("%s: ### %s is not under ## E2E or ## Integration", f.path, h.title))
			}
			if testingMethodHeadRe.MatchString(h.title) {
				errs = append(errs, fmt.Sprintf("%s: extra heading ### %s", f.path, h.title))
			}
			h3 = h.title
			h4 = nil
			h2HasTest = true
		case 4:
			if h3 == "" {
				errs = append(errs, fmt.Sprintf("%s: extra heading #### %s", f.path, h.title))
				continue
			}
			if !testingClosedH4[h.title] {
				errs = append(errs, fmt.Sprintf("%s: extra heading #### %s", f.path, h.title))
			}
			h4 = append(h4, h.title)
		}
	}
	flushH2()
	if !hasClosedH2 {
		errs = append(errs, fmt.Sprintf("%s: missing ## E2E or ## Integration", f.path))
	}
	return errs
}

func checkTestingH4(path, test string, h4 []string) []string {
	need := []string{"Setup", "Invoke", "Assert"}
	if len(h4) < 3 {
		return []string{fmt.Sprintf("%s: ### %s missing #### Setup / Invoke / Assert", path, test)}
	}
	var errs []string
	for i, n := range need {
		if h4[i] != n {
			errs = append(errs, fmt.Sprintf("%s: ### %s expected #### %s, got #### %s", path, test, n, h4[i]))
			return errs
		}
	}
	seenFail, seenMocked := false, false
	for _, t := range h4[3:] {
		switch t {
		case "Fail":
			if seenFail || seenMocked {
				errs = append(errs, fmt.Sprintf("%s: ### %s #### Fail out of order", path, test))
			}
			seenFail = true
		case "Mocked":
			if seenMocked {
				errs = append(errs, fmt.Sprintf("%s: ### %s extra heading #### Mocked", path, test))
			}
			seenMocked = true
		default:
			errs = append(errs, fmt.Sprintf("%s: extra heading #### %s", path, t))
		}
	}
	return errs
}
