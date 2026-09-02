package main

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"unicode"
)

var (
	pipelineFuncRe = regexp.MustCompile(`(?m)^func (TestPipelineHappyPath[A-Za-z0-9]+)\(`)
	stepFileNameRe = regexp.MustCompile(`^(\d{2}[a-z]*)-(.+)$`)
	doNotRunMark   = "**Do not run.**"
)

func pipelineFeature(slash string) string {
	switch {
	case strings.Contains(slash, "/features/website/"):
		return "Website"
	case strings.Contains(slash, "/features/onboarding/"):
		return "Onboarding"
	case strings.Contains(slash, "/features/ads/"):
		return "Ads"
	case strings.Contains(slash, "/features/etl/"):
		return "Etl"
	default:
		return ""
	}
}

func kebabPascal(s string) string {
	var b strings.Builder
	for _, p := range strings.Split(s, "-") {
		if p == "" {
			continue
		}
		r := []rune(p)
		r[0] = unicode.ToUpper(r[0])
		b.WriteString(string(r))
	}
	return b.String()
}

func stepHappyPathName(slash string) (feature, token, canonical string) {
	feature = pipelineFeature(slash)
	if feature == "" {
		return "", "", ""
	}
	base := strings.TrimSuffix(filepath.Base(slash), ".md")
	var stem string
	if m := stepFileNameRe.FindStringSubmatch(base); m != nil {
		token = m[1]
		stem = m[2]
		canonical = "TestPipelineHappyPath" + feature + token + kebabPascal(stem)
		return feature, token, canonical
	}
	token = kebabPascal(base)
	canonical = "TestPipelineHappyPath" + feature + token
	return feature, token, canonical
}

func collectPipelineHappyPathFuncs(internalRoot string) (map[string]bool, error) {
	out := map[string]bool{}
	st, err := os.Stat(internalRoot)
	if err != nil {
		if os.IsNotExist(err) {
			return out, nil
		}
		return nil, err
	}
	if !st.IsDir() {
		return out, nil
	}
	err = filepath.WalkDir(internalRoot, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		if !strings.HasSuffix(path, "_test.go") {
			return nil
		}
		src, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		for _, m := range pipelineFuncRe.FindAllStringSubmatch(string(src), -1) {
			out[m[1]] = true
		}
		return nil
	})
	return out, err
}

func skipDoNotRun(testPath string) bool {
	src, err := os.ReadFile(testPath)
	if err != nil {
		return false
	}
	return strings.Contains(string(src), doNotRunMark)
}

func happyPathCovered(funcs map[string]bool, prefix string, exact bool) bool {
	if exact {
		return funcs[prefix]
	}
	if funcs[prefix] {
		return true
	}
	for name := range funcs {
		if !strings.HasPrefix(name, prefix) {
			continue
		}
		rest := name[len(prefix):]
		if rest == "" {
			return true
		}
		if unicode.IsUpper(rune(rest[0])) {
			return true
		}
	}
	return false
}

func leftoverSet(leftover []string) map[string]bool {
	out := map[string]bool{}
	for _, n := range leftover {
		out[n] = true
	}
	return out
}

func checkPipelineHappyPath(r report, funcs map[string]bool, leftover []string) []string {
	allowed := leftoverSet(leftover)
	need := map[string]bool{}
	features := map[string]bool{}
	var errs []string

	for _, s := range r.steps {
		feature, token, canonical := stepHappyPathName(s.path)
		if feature == "" || canonical == "" {
			continue
		}
		if skipDoNotRun(s.testPath) {
			continue
		}
		features[feature] = true
		need[canonical] = true
		prefix := "TestPipelineHappyPath" + feature + token
		ok := happyPathCovered(funcs, prefix, false)
		switch {
		case ok && allowed[canonical]:
			errs = append(errs, fmt.Sprintf("%s: leftover %s is gone; remove it from the leftover list", s.testPath, canonical))
		case !ok && !allowed[canonical]:
			errs = append(errs, fmt.Sprintf("%s: missing %s", s.testPath, canonical))
		}
	}

	var featList []string
	for f := range features {
		featList = append(featList, f)
	}
	sort.Strings(featList)
	for _, feature := range featList {
		canonical := "TestPipelineHappyPath" + feature + "Full"
		need[canonical] = true
		ok := happyPathCovered(funcs, canonical, true)
		switch {
		case ok && allowed[canonical]:
			errs = append(errs, fmt.Sprintf("pipeline %s: leftover %s is gone; remove it from the leftover list", feature, canonical))
		case !ok && !allowed[canonical]:
			errs = append(errs, fmt.Sprintf("pipeline %s: missing %s", feature, canonical))
		}
	}

	var extra []string
	if len(features) == 0 {
		sort.Strings(errs)
		return errs
	}
	for n := range allowed {
		if !need[n] {
			extra = append(extra, n)
		}
	}
	sort.Strings(extra)
	for _, n := range extra {
		errs = append(errs, fmt.Sprintf("leftover %s is not a required TestPipelineHappyPath; remove it from the leftover list", n))
	}
	sort.Strings(errs)
	return errs
}
