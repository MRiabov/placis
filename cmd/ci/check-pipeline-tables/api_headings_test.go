package main

import (
	"path/filepath"
	"strings"
	"testing"
)

func TestAPIHeadingsClosed(t *testing.T) {
	f := apiFile{
		path:  "docs/features/website/api.md",
		rel:   "website/api.md",
		heads: []string{"DTOs", "Routes", "Do not create"},
	}
	if errs := checkOneAPI(f); len(errs) != 0 {
		t.Fatalf("closed: %v", errs)
	}
}

func TestAPIHeadingsLeftoverOK(t *testing.T) {
	f := apiFile{
		path:  "docs/features/ads/api.md",
		rel:   "ads/api.md",
		heads: []string{"Serve only types on HTTP", "Routes", "Do not create"},
	}
	if errs := checkOneAPI(f); len(errs) != 0 {
		t.Fatalf("leftover: %v", errs)
	}
}

func TestAPIHeadingsNewExtraFails(t *testing.T) {
	f := apiFile{
		path: "docs/features/ads/api.md",
		rel:  "ads/api.md",
		heads: []string{
			"Serve only types on HTTP",
			"Routes",
			"Listed",
			"Do not create",
		},
	}
	errs := checkOneAPI(f)
	if len(errs) != 1 || !strings.Contains(errs[0], "Listed") {
		t.Fatalf("new extra: %v", errs)
	}
}

func TestAPIHeadingsStaleLeftoverFails(t *testing.T) {
	f := apiFile{
		path:  "docs/features/ads/api.md",
		rel:   "ads/api.md",
		heads: []string{"Routes", "Do not create"},
	}
	errs := checkOneAPI(f)
	if len(errs) != 1 || !strings.Contains(errs[0], "apiHeadingLeftover") {
		t.Fatalf("stale leftover: %v", errs)
	}
}

func TestAPIHeadingsMissingRoutes(t *testing.T) {
	f := apiFile{
		path:  "docs/features/widget/api.md",
		rel:   "widget/api.md",
		heads: []string{"Do not create"},
	}
	errs := checkOneAPI(f)
	if len(errs) != 1 || !strings.Contains(errs[0], "missing ## Routes") {
		t.Fatalf("missing routes: %v", errs)
	}
}

func TestAPIHeadingsCurrentTree(t *testing.T) {
	root := filepath.Join("..", "..", "..", "docs", "features")
	rep, err := inspect(root)
	if err != nil {
		t.Fatal(err)
	}
	if len(rep.apiFiles) == 0 {
		t.Fatal("no api.md")
	}
	if errs := checkAPIHeadings(rep); len(errs) != 0 {
		t.Fatalf("current tree: %v", errs)
	}
}
