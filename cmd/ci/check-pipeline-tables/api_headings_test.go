package main

import (
	"path/filepath"
	"strings"
	"testing"
)

func TestAPIHeadingsClosed(t *testing.T) {
	f := headingFile{
		path:  "docs/features/website/api.md",
		rel:   "website/api.md",
		heads: []string{"DTOs", "Routes", "Do not create"},
	}
	if errs := checkOneAPI(f); len(errs) != 0 {
		t.Fatalf("closed: %v", errs)
	}
}

func TestAPIHeadingsLeftoverOK(t *testing.T) {
	f := headingFile{
		path: "docs/features/other/leads/api.md",
		rel:  "other/leads/api.md",
		heads: []string{
			"Serve only types on HTTP",
			"Routes",
			"Do not create",
		},
	}
	if errs := checkOneAPI(f); len(errs) != 0 {
		t.Fatalf("leftover: %v", errs)
	}
}

func TestAPIHeadingsNewExtraFails(t *testing.T) {
	f := headingFile{
		path: "docs/features/other/leads/api.md",
		rel:  "other/leads/api.md",
		heads: []string{
			"Serve only types on HTTP",
			"Routes",
			"Essay",
			"Do not create",
		},
	}
	errs := checkOneAPI(f)
	if len(errs) != 1 || !strings.Contains(errs[0], "Essay") {
		t.Fatalf("new extra: %v", errs)
	}
}

func TestAPIHeadingsStaleLeftoverFails(t *testing.T) {
	f := headingFile{
		path:  "docs/features/ads/api.md",
		rel:   "ads/api.md",
		heads: []string{"DTOs", "Routes", "Do not create"},
	}
	if errs := checkOneAPI(f); len(errs) != 0 {
		t.Fatalf("closed ads: %v", errs)
	}
	f = headingFile{
		path:  "docs/features/assistant/api.md",
		rel:   "assistant/api.md",
		heads: []string{"DTOs", "Routes", "Do not create"},
	}
	if errs := checkOneAPI(f); len(errs) != 0 {
		t.Fatalf("closed assistant: %v", errs)
	}
	f = headingFile{
		path:  "docs/features/onboarding/api.md",
		rel:   "onboarding/api.md",
		heads: []string{"DTOs", "Routes", "Do not create"},
	}
	if errs := checkOneAPI(f); len(errs) != 0 {
		t.Fatalf("closed onboarding: %v", errs)
	}
	f = headingFile{
		path:  "docs/features/other/auth/api.md",
		rel:   "other/auth/api.md",
		heads: []string{"DTOs", "Routes", "Do not create"},
	}
	if errs := checkOneAPI(f); len(errs) != 0 {
		t.Fatalf("closed auth: %v", errs)
	}
	f = headingFile{
		path:  "docs/features/business-profile/details/api.md",
		rel:   "business-profile/details/api.md",
		heads: []string{"DTOs", "Routes", "Do not create"},
	}
	if errs := checkOneAPI(f); len(errs) != 0 {
		t.Fatalf("closed details: %v", errs)
	}
	f = headingFile{
		path:  "docs/features/business-profile/projects/api.md",
		rel:   "business-profile/projects/api.md",
		heads: []string{"DTOs", "Routes", "Do not create"},
	}
	if errs := checkOneAPI(f); len(errs) != 0 {
		t.Fatalf("closed projects: %v", errs)
	}
}

func TestAPIHeadingsMissingRoutes(t *testing.T) {
	f := headingFile{
		path:  "docs/features/sample/api.md",
		rel:   "sample/api.md",
		heads: []string{"Do not create"},
	}
	errs := checkOneAPI(f)
	if len(errs) != 1 || !strings.Contains(errs[0], "missing ## Routes") {
		t.Fatalf("missing routes: %v", errs)
	}
}

func TestCatalogHeadingsCurrentTree(t *testing.T) {
	root := filepath.Join("..", "..", "..", "docs", "features")
	if err := run([]string{"--all", "--root", root}); err != nil {
		t.Fatal(err)
	}
}
