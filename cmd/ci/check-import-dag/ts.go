package main

import (
	"fmt"
	"os"
	"regexp"
	"strings"
)

var fromRe = regexp.MustCompile(`(?m)(?:from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\))`)

func checkTSImports(root string, files []string) []string {
	var errs []string
	for _, path := range files {
		rel := relSlash(root, path)
		if skip(rel) {
			continue
		}
		if !strings.HasPrefix(rel, "frontend-3/") {
			continue
		}
		if !strings.HasSuffix(rel, ".ts") && !strings.HasSuffix(rel, ".tsx") {
			continue
		}
		src, err := os.ReadFile(path)
		if err != nil {
			errs = append(errs, fmt.Sprintf("%s: %v", rel, err))
			continue
		}
		for _, m := range fromRe.FindAllStringSubmatch(string(src), -1) {
			spec := m[1]
			if spec == "" {
				spec = m[2]
			}
			if msg := forbiddenTS(rel, spec); msg != "" {
				errs = append(errs, fmt.Sprintf("%s: import %q: %s", rel, spec, msg))
			}
		}
	}
	return errs
}

func forbiddenTS(file, spec string) string {
	if strings.Contains(spec, "frontend-2") || strings.Contains(spec, "/frontend-2/") {
		return "frontend-3 must not import frontend-2"
	}
	if strings.Contains(file, "frontend-3/src/features/cms/") && looksLikeOnboarding(spec) {
		return "cms/ must not import onboarding"
	}
	return ""
}

func looksLikeOnboarding(spec string) bool {
	if strings.Contains(spec, "frontend-2") {
		return false
	}
	return strings.Contains(spec, "features/onboarding") ||
		strings.Contains(spec, "/onboarding/") ||
		strings.HasSuffix(spec, "/onboarding")
}
