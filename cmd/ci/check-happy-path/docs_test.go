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

const adsWriteAPI = `# Ads HTTP

## DTOs

| DTO | Fields |
| --- | --- |
| ` + "`AdRead`" + ` | ` + "`id`" + ` |

## Routes

| Method + path | Callers | Request | Response |
| --- | --- | --- | --- |
| ` + "`GET /v1/ads`" + ` | | | |
| ` + "`POST /v1/ads`" + ` | | | |

## Do not create

- ` + "`/v1/nope`" + `
`

const leadsAPI = `# Leads HTTP

## Serve only types on HTTP

### POST /v1/website-forms/{form_id}/submissions

Essay.

## Routes

No table.

## Do not create

- ` + "`/v1/old`" + `
`

const detailsAPI = `# Details HTTP

## DTOs

| DTO | Fields |
| --- | --- |
| ` + "`BusinessProfileRead`" + ` | ` + "`trade`" + ` |

## Routes

| Method + path | Callers | Request | Response |
| --- | --- | --- | --- |
| ` + "`GET /v1/business-profile`" + ` | | | |

## Do not create

- ` + "`/v1/old`" + `
`

const detailsHeading = `## Integration

### TestHappyPathV1BusinessProfile — Route

#### Setup

Backend.

#### Exercise

` + "`GET /v1/business-profile`" + `

#### Verify

The HTTP body is BusinessProfileRead.
`

const projectsAPI = `# Projects HTTP

## DTOs

| DTO | Fields |
| --- | --- |
| ` + "`ProjectRead`" + ` | ` + "`id`" + ` |

## Routes

| Method + path | Callers | Request | Response |
| --- | --- | --- | --- |
| ` + "`GET /v1/projects`" + ` | | | |

## Do not create

- ` + "`/v1/old`" + `
`

const projectsHeading = `## Integration

### TestHappyPathV1Projects — Route

#### Setup

Backend.

#### Exercise

` + "`GET /v1/projects`" + `

#### Verify

The HTTP body lists projects.
`

const healthHeading = `## Integration

### TestHappyPathHealth — Route

#### Setup

Backend.

#### Exercise

` + "`GET /v1/health`" + `

#### Verify

The HTTP body has ok.
`

const healthHeadingNoSuffix = `## Integration

### TestHappyPathHealth

#### Setup

Backend.

#### Exercise

` + "`GET /v1/health`" + `

#### Verify

The HTTP body has ok.
`

const flowHeading = `## Integration

### TestHappyPathFlow — Route

#### Setup

Backend.

#### Exercise

` + "`GET /v1/health`" + `
` + "`GET /v1/website/editor/pages`" + `

#### Verify

Both returned.
`

const verifyHTTPHeading = `## Integration

### TestHappyPathCreateAd — Route

#### Setup

Backend.

#### Exercise

` + "`POST /v1/ads`" + `

#### Verify

` + "`GET /v1/ads`" + ` lists the created ad.
`

func withLeftover(t *testing.T, docs, tests []string) {
	t.Helper()
	prevDocs := leftoverDocs
	prevTests := leftoverTests
	leftoverDocs = docs
	leftoverTests = tests
	t.Cleanup(func() {
		leftoverDocs = prevDocs
		leftoverTests = prevTests
	})
}

func TestDocsLeftoverOK(t *testing.T) {
	dir := writeTree(t, map[string]string{
		"docs/features/website/api.md": routesAPI,
	})
	withLeftover(t, []string{"GET /v1/health"}, []string{"GET /v1/health"})
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
		"docs/features/other/leads/api.md": leadsAPI,
	})
	if errs := checkDocsHappyPath(filepath.Join(dir, "docs"), nil, nil); len(errs) != 0 {
		t.Fatalf("skip leads: %v", errs)
	}
	if errs := checkTestingHappyPath(filepath.Join(dir, "docs"), nil); len(errs) != 0 {
		t.Fatalf("skip leads testing: %v", errs)
	}
}

func TestDetailsOwnsTesting(t *testing.T) {
	wrong := writeTree(t, map[string]string{
		"docs/features/business-profile/details/api.md": detailsAPI,
		"docs/features/business-profile/certifications-and-reviews/testing.md": `## Integration

### TestHappyPathV1BusinessProfile — Route

#### Setup

Backend.

#### Exercise

` + "`GET /v1/business-profile`" + `

#### Verify

Wrong owner.
`,
	})
	errs := checkTestingHappyPath(filepath.Join(wrong, "docs"), nil)
	joined := strings.Join(errs, "\n")
	if !strings.Contains(joined, "GET /v1/business-profile") {
		t.Fatalf("certifications testing.md must not own details Routes: %v", errs)
	}
	ok := writeTree(t, map[string]string{
		"docs/features/business-profile/details/api.md":     detailsAPI,
		"docs/features/business-profile/details/testing.md": detailsHeading,
	})
	if errs := checkTestingHappyPath(filepath.Join(ok, "docs"), nil); len(errs) != 0 {
		t.Fatalf("details/testing.md should own details Routes: %v", errs)
	}
}

func TestProjectsOwnsTesting(t *testing.T) {
	dir := writeTree(t, map[string]string{
		"docs/features/business-profile/projects/api.md":     projectsAPI,
		"docs/features/business-profile/projects/testing.md": projectsHeading,
	})
	if errs := checkTestingHappyPath(filepath.Join(dir, "docs"), nil); len(errs) != 0 {
		t.Fatalf("projects/testing.md should own projects Routes: %v", errs)
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
	if !strings.Contains(joined, "leftover_tests.go") {
		t.Fatalf("leftover gone: %v", errs)
	}
}

func TestTestingHeadingCovers(t *testing.T) {
	dir := writeTree(t, map[string]string{
		"docs/features/website/api.md":     routesAPI,
		"docs/features/website/testing.md": healthHeading,
	})
	if errs := checkTestingHappyPath(filepath.Join(dir, "docs"), nil); len(errs) != 0 {
		t.Fatalf("heading covers: %v", errs)
	}
}

func TestTestingHeadingWithoutSuffixDoesNotCover(t *testing.T) {
	dir := writeTree(t, map[string]string{
		"docs/features/website/api.md":     routesAPI,
		"docs/features/website/testing.md": healthHeadingNoSuffix,
	})
	errs := checkTestingHappyPath(filepath.Join(dir, "docs"), nil)
	joined := strings.Join(errs, "\n")
	if !strings.Contains(joined, "GET /v1/health") {
		t.Fatalf("missing — Route must not cover: %v", errs)
	}
}

func TestTestingFlowDoesNotCover(t *testing.T) {
	dir := writeTree(t, map[string]string{
		"docs/features/website/api.md":     routesAPI,
		"docs/features/website/testing.md": flowHeading,
	})
	errs := checkTestingHappyPath(filepath.Join(dir, "docs"), nil)
	joined := strings.Join(errs, "\n")
	if !strings.Contains(joined, "GET /v1/health") {
		t.Fatalf("flow must not cover: %v", errs)
	}
}

func TestTestingVerifyDoesNotCover(t *testing.T) {
	dir := writeTree(t, map[string]string{
		"docs/features/ads/api.md":                   adsWriteAPI,
		"docs/features/ads/ad-generation/testing.md": verifyHTTPHeading,
	})
	errs := checkTestingHappyPath(filepath.Join(dir, "docs"), nil)
	joined := strings.Join(errs, "\n")
	if strings.Contains(joined, "POST /v1/ads") {
		t.Fatalf("POST should be covered: %v", errs)
	}
	if !strings.Contains(joined, "GET /v1/ads") {
		t.Fatalf("Verify GET must not cover: %v", errs)
	}
}

func TestTestingLeftoverOK(t *testing.T) {
	dir := writeTree(t, map[string]string{
		"docs/features/website/api.md": routesAPI,
	})
	if errs := checkTestingHappyPath(filepath.Join(dir, "docs"), []string{"GET /v1/health"}); len(errs) != 0 {
		t.Fatalf("leftover ok: %v", errs)
	}
}

func TestTestingLeftoverGone(t *testing.T) {
	dir := writeTree(t, map[string]string{
		"docs/features/website/api.md":     routesAPI,
		"docs/features/website/testing.md": healthHeading,
	})
	errs := checkTestingHappyPath(filepath.Join(dir, "docs"), []string{"GET /v1/health"})
	joined := strings.Join(errs, "\n")
	if !strings.Contains(joined, "leftover_docs.go") {
		t.Fatalf("leftover gone: %v", errs)
	}
}

func TestTestingHeadingDoesNotShrinkGoLeftover(t *testing.T) {
	dir := writeTree(t, map[string]string{
		"docs/features/website/api.md":     routesAPI,
		"docs/features/website/testing.md": healthHeading,
	})
	if errs := checkDocsHappyPath(filepath.Join(dir, "docs"), nil, []string{"GET /v1/health"}); len(errs) != 0 {
		t.Fatalf("heading must not shrink tests leftover: %v", errs)
	}
}

func TestGoFuncDoesNotShrinkDocsLeftover(t *testing.T) {
	dir := writeTree(t, map[string]string{
		"docs/features/website/api.md": routesAPI,
		"internal/foo/foo_test.go":     healthTest,
	})
	tests, err := collectHappyPathTests(filepath.Join(dir, "internal"))
	if err != nil {
		t.Fatal(err)
	}
	if errs := checkDocsHappyPath(filepath.Join(dir, "docs"), tests, nil); len(errs) != 0 {
		t.Fatalf("func covers tests leftover: %v", errs)
	}
	if errs := checkTestingHappyPath(filepath.Join(dir, "docs"), []string{"GET /v1/health"}); len(errs) != 0 {
		t.Fatalf("func must not shrink docs leftover: %v", errs)
	}
}

func TestAdsOwnsAdGenerationTesting(t *testing.T) {
	wrong := writeTree(t, map[string]string{
		"docs/features/ads/api.md": adsWriteAPI,
		"docs/features/ads/testing.md": `## Integration

### TestHappyPathAds — Route

#### Setup

Backend.

#### Exercise

` + "`GET /v1/ads`" + `

#### Verify

The HTTP body lists ads.
`,
	})
	errs := checkTestingHappyPath(filepath.Join(wrong, "docs"), nil)
	joined := strings.Join(errs, "\n")
	if !strings.Contains(joined, "GET /v1/ads") {
		t.Fatalf("ads/testing.md must not own ads Routes: %v", errs)
	}
	ok := writeTree(t, map[string]string{
		"docs/features/ads/api.md": adsWriteAPI,
		"docs/features/ads/ad-generation/testing.md": `## Integration

### TestHappyPathAdsGet — Route

#### Setup

Backend.

#### Exercise

` + "`GET /v1/ads`" + `

#### Verify

The HTTP body lists ads.

### TestHappyPathAdsCreate — Route

#### Setup

Backend.

#### Exercise

` + "`POST /v1/ads`" + `

#### Verify

` + "`GET /v1/ads`" + ` lists the created ad.
`,
	})
	if errs := checkTestingHappyPath(filepath.Join(ok, "docs"), nil); len(errs) != 0 {
		t.Fatalf("ad-generation/testing.md should own ads Routes: %v", errs)
	}
}

func TestPipelineHeadingDoesNotCover(t *testing.T) {
	dir := writeTree(t, map[string]string{
		"docs/features/website/api.md": routesAPI,
		"docs/features/website/testing.md": `## Integration

### TestPipelineHappyPathWebsiteFull — pipeline Full

#### Setup

Backend.

#### Exercise

` + "`GET /v1/health`" + `

#### Verify

Postgres.
`,
	})
	errs := checkTestingHappyPath(filepath.Join(dir, "docs"), nil)
	joined := strings.Join(errs, "\n")
	if !strings.Contains(joined, "GET /v1/health") {
		t.Fatalf("pipeline heading must not cover: %v", errs)
	}
}
