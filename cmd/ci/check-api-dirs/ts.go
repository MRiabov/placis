package main

import (
	"fmt"
	"os"
	"regexp"
	"strings"
)

var (
	openapiFetchRe = regexp.MustCompile(`from\s+['"]openapi-fetch['"]|require\(\s*['"]openapi-fetch['"]\s*\)`)
	createClientRe = regexp.MustCompile(`\bcreateClient\b`)
	sharedAPIRe    = regexp.MustCompile(`from\s+['"][^'"]*shared/api(?:\.ts)?['"]|from\s+['"]@/shared/api['"]`)
	v1URLRe        = regexp.MustCompile("`[^`]*\\$\\{[^}]*\\}/v1/|[\"'`]\\/v1/")
	httpCallRe     = regexp.MustCompile(`\b(fetch|EventSource|WebSocket)\s*\(`)
)

func checkTS(root string, files []string) []string {
	var errs []string
	for _, path := range files {
		rel := relSlash(root, path)
		if skipWalk(rel) || isTestFile(rel) {
			continue
		}
		if !strings.HasSuffix(rel, ".ts") && !strings.HasSuffix(rel, ".tsx") {
			continue
		}
		if !strings.HasPrefix(rel, "frontend-3/") && !strings.HasPrefix(rel, "apps/demo/") {
			continue
		}
		src, err := os.ReadFile(path)
		if err != nil {
			errs = append(errs, fmt.Sprintf("%s: %v", rel, err))
			continue
		}
		text := string(src)
		if openapiFetchRe.MatchString(text) || (createClientRe.MatchString(text) && openapiFetchRe.MatchString(text)) {
			if !isSharedAPIClient(rel) {
				errs = append(errs, fmt.Sprintf("%s: openapi-fetch client only in frontend-3/src/shared/api.ts", rel))
			}
		}
		if sharedAPIRe.MatchString(text) && !isFeatureCallSite(rel) {
			errs = append(errs, fmt.Sprintf("%s: shared/api import only from frontend-3/src/features/", rel))
		}
		if httpCallRe.MatchString(text) && v1URLRe.MatchString(text) {
			if strings.HasPrefix(rel, "apps/demo/") || !isFeatureCallSite(rel) && !isSharedAPIClient(rel) {
				errs = append(errs, fmt.Sprintf("%s: /v1/ HTTP only from frontend-3/src/features/ or shared/api.ts", rel))
			}
		}
	}
	return errs
}

func isSharedAPIClient(rel string) bool {
	return rel == "frontend-3/src/shared/api.ts" ||
		strings.HasPrefix(rel, "frontend-3/src/shared/api/")
}

func isFeatureCallSite(rel string) bool {
	return strings.HasPrefix(rel, "frontend-3/src/features/")
}
