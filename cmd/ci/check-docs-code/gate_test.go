package main

import (
	"strings"
	"testing"

	"placis/cmd/ci/docnames"
)

func emptyCode() Code {
	return Code{
		PublicOps:   map[string]bool{},
		PublicDTOs:  map[string]bool{},
		WorkerOps:   map[string]bool{},
		WorkerDTOs:  map[string]bool{},
		JobNames:    map[string]bool{},
		Tables:      map[string]bool{},
		TableFiles:  map[string][]string{},
		GoNameFiles: map[string][]string{},
	}
}

func TestGateADocsOnly(t *testing.T) {
	d := docnames.Docs{
		Tables:   map[string]bool{"website_pages": true},
		DTOs:     map[string]bool{"WebsitePageRead": true},
		Paths:    map[string]bool{"GET /v1/website/editor/pages": true},
		JobNames: map[string]bool{"website_copy_generation": true},
		ByFile:   map[string]*docnames.FileAPI{},
	}
	if errs := gateA(d, emptyCode()); len(errs) != 0 {
		t.Fatalf("docs-only: %v", errs)
	}
	if errs := gateB(d, emptyCode(), nil); len(errs) != 0 {
		t.Fatalf("gate B skipped: %v", errs)
	}
}

func TestGateAInventedPath(t *testing.T) {
	d := docnames.Docs{
		Paths: map[string]bool{"GET /v1/health": true},
		DTOs:  map[string]bool{},
	}
	c := emptyCode()
	c.PublicFile = "openapi.json"
	c.PublicOps["GET /v1/invented"] = true
	errs := gateA(d, c)
	if len(errs) != 1 || !strings.Contains(errs[0], "GET /v1/invented") {
		t.Fatalf("errs: %v", errs)
	}
}

func TestGateADoNotCreate(t *testing.T) {
	d := docnames.Docs{
		Paths:  map[string]bool{"GET /v1/health": true},
		Banned: []string{"/v1/public/site"},
	}
	c := emptyCode()
	c.PublicFile = "openapi.json"
	c.PublicOps["GET /v1/public/site/resolve"] = true
	errs := gateA(d, c)
	if len(errs) < 1 {
		t.Fatal("want ban")
	}
	found := false
	for _, e := range errs {
		if strings.Contains(e, "Do not create") {
			found = true
		}
	}
	if !found {
		t.Fatalf("errs: %v", errs)
	}
}

func TestGateAPublicInternal(t *testing.T) {
	d := docnames.Docs{
		Paths: map[string]bool{"POST /internal/website-render": true},
		DTOs:  map[string]bool{"WebsiteRenderRequest": true},
	}
	c := emptyCode()
	c.PublicFile = "openapi.json"
	c.PublicOps["POST /internal/website-render"] = true
	c.PublicDTOs["WebsiteRenderRequest"] = true
	errs := gateA(d, c)
	if len(errs) != 1 || !strings.Contains(errs[0], "must not be on public OpenAPI") {
		t.Fatalf("errs: %v", errs)
	}
}

func TestGateAKnownRiverAndSQL(t *testing.T) {
	d := docnames.Docs{
		JobNames: map[string]bool{"website_copy_generation": true},
		Tables:   map[string]bool{"website_pages": true},
	}
	c := emptyCode()
	c.GoNameFiles["website_copy_generation"] = []string{"internal/jobs/copy.go"}
	c.TableFiles["website_pages"] = []string{"migrations/001.sql"}
	if errs := gateA(d, c); len(errs) != 0 {
		t.Fatalf("known: %v", errs)
	}
	c.GoNameFiles["invented_job"] = []string{"internal/jobs/bad.go"}
	c.TableFiles["invented"] = []string{"migrations/002.sql"}
	errs := gateA(d, c)
	if len(errs) != 2 {
		t.Fatalf("want 2, got %v", errs)
	}
}

func TestGateBLeftoverShrink(t *testing.T) {
	f := &docnames.FileAPI{
		Rel:         "website/api.md",
		PublicPaths: map[string]bool{"GET /v1/website/editor/pages": true, "GET /v1/website/editor/urls": true},
		PublicDTOs:  map[string]bool{"WebsitePageRead": true},
	}
	d := docnames.Docs{ByFile: map[string]*docnames.FileAPI{"website/api.md": f}}
	c := emptyCode()
	c.PublicFile = "openapi.json"
	c.PublicOps["GET /v1/website/editor/pages"] = true
	c.PublicDTOs["WebsitePageRead"] = true
	leftover := map[string][]string{
		"website/api.md": {"GET /v1/website/editor/urls"},
	}
	if errs := gateB(d, c, leftover); len(errs) != 0 {
		t.Fatalf("leftover ok: %v", errs)
	}
	errs := gateB(d, c, nil)
	if len(errs) != 1 || !strings.Contains(errs[0], "GET /v1/website/editor/urls") {
		t.Fatalf("missing leftover: %v", errs)
	}
	c.PublicOps["GET /v1/website/editor/urls"] = true
	errs = gateB(d, c, leftover)
	if len(errs) != 1 || !strings.Contains(errs[0], "remove it from the leftover list") {
		t.Fatalf("stale leftover: %v", errs)
	}
}

func TestGateBWorkerSplit(t *testing.T) {
	f := &docnames.FileAPI{
		Rel:           "website/api.md",
		PublicPaths:   map[string]bool{"GET /v1/website/editor/pages": true},
		InternalPaths: map[string]bool{"POST /internal/website-render": true},
		InternalDTOs:  map[string]bool{"WebsiteRenderRequest": true},
	}
	d := docnames.Docs{ByFile: map[string]*docnames.FileAPI{"website/api.md": f}}
	c := emptyCode()
	c.PublicFile = "openapi.json"
	c.PublicOps["GET /v1/website/editor/pages"] = true
	c.WorkerFile = "apps/contractor-website/openapi.json"
	c.WorkerOps["POST /internal/website-render"] = true
	c.WorkerDTOs["WebsiteRenderRequest"] = true
	if errs := gateB(d, c, nil); len(errs) != 0 {
		t.Fatalf("split: %v", errs)
	}
}

func TestGateBBillingUntilDTOs(t *testing.T) {
	f := &docnames.FileAPI{
		Rel:         "billing/api.md",
		PublicPaths: map[string]bool{"GET /v1/billing/usage": true},
	}
	d := docnames.Docs{ByFile: map[string]*docnames.FileAPI{"billing/api.md": f}}
	c := emptyCode()
	c.PublicFile = "openapi.json"
	c.PublicOps["GET /v1/billing/usage"] = true
	if errs := gateB(d, c, nil); len(errs) != 0 {
		t.Fatalf("billing skipped: %v", errs)
	}
}

func TestGateBGeneralHealth(t *testing.T) {
	f := &docnames.FileAPI{
		Rel:         "general-architecture/api.md",
		PublicPaths: map[string]bool{"GET /v1/health": true, "GET /openapi.json": true},
	}
	d := docnames.Docs{ByFile: map[string]*docnames.FileAPI{"general-architecture/api.md": f}}
	c := emptyCode()
	c.PublicFile = "openapi.json"
	c.PublicOps["GET /v1/health"] = true
	errs := gateB(d, c, nil)
	if len(errs) != 1 || !strings.Contains(errs[0], "GET /openapi.json") {
		t.Fatalf("health: %v", errs)
	}
}
