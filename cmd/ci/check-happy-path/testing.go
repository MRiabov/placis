package main

import (
	"regexp"
	"strings"
)

var markdownOpRe = regexp.MustCompile(`(?:GET|POST|PUT|PATCH|DELETE) /[^\s` + "`" + `]+`)
var apiCallRe = regexp.MustCompile(`\.(Get|Post|Put|Patch|Delete|GET|POST|PUT|PATCH|DELETE)\("(/[^"]+)"\)`)

func isDocsHappyPathTitle(title string) bool {
	t := strings.TrimSpace(title)
	if strings.HasPrefix(t, "TestPipelineHappyPath") {
		return false
	}
	return strings.HasPrefix(t, "TestHappyPath")
}

func parseTestingHappyPath(path, text string) []happyPathTest {
	var out []happyPathTest
	h3 := ""
	h4 := ""
	var body strings.Builder
	var exercise string

	flushH4 := func() {
		if h3 == "" || h4 == "" {
			return
		}
		if isDocsHappyPathTitle(h3) && h4 == "Exercise" {
			exercise = body.String()
		}
		body.Reset()
	}
	flushH3 := func() {
		flushH4()
		if isDocsHappyPathTitle(h3) {
			out = append(out, happyPathTest{
				name: h3,
				file: path,
				ops:  collectMarkdownOps(exercise),
			})
		}
		exercise = ""
		h4 = ""
		body.Reset()
	}

	for _, line := range strings.Split(text, "\n") {
		if strings.HasPrefix(line, "#### ") {
			flushH4()
			h4 = strings.TrimSpace(strings.TrimPrefix(line, "#### "))
			continue
		}
		if strings.HasPrefix(line, "### ") {
			flushH3()
			h3 = strings.TrimSpace(strings.TrimPrefix(line, "### "))
			h4 = ""
			continue
		}
		if strings.HasPrefix(line, "## ") {
			flushH3()
			h3 = ""
			h4 = ""
			continue
		}
		if h4 != "" {
			body.WriteString(line)
			body.WriteByte('\n')
		}
	}
	flushH3()
	return out
}

func collectMarkdownOps(s string) map[string]bool {
	ops := map[string]bool{}
	for _, raw := range markdownOpRe.FindAllString(s, -1) {
		op := strings.TrimRight(raw, ".,);:")
		if methodPathRe.MatchString(op) {
			ops[op] = true
		}
	}
	for _, m := range apiCallRe.FindAllStringSubmatch(s, -1) {
		method := httpMethodName(m[1])
		if method == "" || !strings.HasPrefix(m[2], "/") {
			continue
		}
		ops[method+" "+m[2]] = true
	}
	return ops
}
