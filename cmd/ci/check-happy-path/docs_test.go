package main

import (
	"path/filepath"
	"strings"
	"testing"
)

const routesAPI = `# HTTP

## DTOs

| DTO | Fields |
| --- | --- |
| ` + "`HealthRead`" + ` | ` + "`ok`" + ` |

## Routes

| Method + path | Callers | Request | Response |
| --- | --- | --- | --- |
| ` + "`GET /v1/health`" + ` | | | |

## Do not create

- ` + "`/v1/nope`" + `
`

const detailsAPI = `# Details HTTP

## Serve only types on HTTP

### GET /v1/business-profile

Essay.

## Routes

No table.

## Do not create

- ` + "`/v1/old`" + `
`

func TestDocsLeftoverOK(t *testing.T) {
	dir := writeTree(t, map[string]string{
		"docs/features/website/api.md": routesAPI,
	})
	prev := docsHappyPathLeftover
	docsHappyPathLeftover = []string{"GET /v1/health"}
	t.Cleanup(func() { docsHappyPathLeftover = prev })
	err := run([]string{
		"--public",
		"--docs", filepath.Join(dir, "docs"),
		"--openapi", filepath.Join(dir, "missing.json"),
		"--internal", filepath.Join(dir, "internal"),
	})
	if err != nil {
		t.Fatalf("leftover ok: %v", err)
	}
}

func TestDocsMissingFails(t *testing.T) {
	dir := writeTree(t, map[string]string{
		"docs/features/website/api.md": routesAPI,
	})
	errs := checkDocsHappyPath(filepath.Join(dir, "docs"), nil, nil)
	joined := strings.Join(errs, "\n")
	if !strings.Contains(joined, "GET /v1/health") {
		t.Fatalf("want missing, got %v", errs)
	}
}

func TestDocsStaleLeftover(t *testing.T) {
	dir := writeTree(t, map[string]string{
		"docs/features/website/api.md": routesAPI,
	})
	errs := checkDocsHappyPath(filepath.Join(dir, "docs"), nil, []string{"GET /v1/health", "GET /v1/gone"})
	joined := strings.Join(errs, "\n")
	if !strings.Contains(joined, "GET /v1/gone") {
		t.Fatalf("stale leftover: %v", errs)
	}
}

func TestDocsSkipUnstructured(t *testing.T) {
	dir := writeTree(t, map[string]string{
		"docs/features/business-profile/details/api.md": detailsAPI,
	})
	if errs := checkDocsHappyPath(filepath.Join(dir, "docs"), nil, nil); len(errs) != 0 {
		t.Fatalf("skip details: %v", errs)
	}
}

func TestDocsLeftoverGone(t *testing.T) {
	dir := writeTree(t, map[string]string{
		"docs/features/website/api.md": routesAPI,
		"internal/foo/foo_test.go":     healthTest,
	})
	tests, err := collectHappyPathTests(filepath.Join(dir, "internal"))
	if err != nil {
		t.Fatal(err)
	}
	errs := checkDocsHappyPath(filepath.Join(dir, "docs"), tests, []string{"GET /v1/health"})
	joined := strings.Join(errs, "\n")
	if !strings.Contains(joined, "leftover") {
		t.Fatalf("leftover gone: %v", errs)
	}
}
