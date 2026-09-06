package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestParseJobsCatalogIndex(t *testing.T) {
	path := filepath.Join("..", "..", "..", "docs", "infrastructure", "jobs.md")
	c, err := parseJobsCatalog(path)
	if err != nil {
		t.Fatal(err)
	}
	if len(c.names) != 0 {
		t.Fatalf("index must not list River job kinds: %v", c.names)
	}
	if errs := checkJobsHeadings(c); len(errs) != 0 {
		t.Fatalf("index headings: %v", errs)
	}
}

func TestCollectJobNames(t *testing.T) {
	dir := t.TempDir()
	website := filepath.Join(dir, "website", "jobs.md")
	if err := os.MkdirAll(filepath.Dir(website), 0o755); err != nil {
		t.Fatal(err)
	}
	src := "# Jobs\n\n## Jobs\n\n| River job kind | Args |\n| --- | --- |\n| `website_copy_generation` | `tenant_id` |\n"
	if err := os.WriteFile(website, []byte(src), 0o644); err != nil {
		t.Fatal(err)
	}
	c, err := parseJobsCatalog(website)
	if err != nil {
		t.Fatal(err)
	}
	names, errs := collectJobNames(report{jobsFiles: []jobsCatalog{c}})
	if len(errs) != 0 {
		t.Fatalf("errs: %v", errs)
	}
	if !names["website_copy_generation"] {
		t.Fatalf("names: %v", names)
	}
}

func TestParseJobsCatalog(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "jobs.md")
	src := "# Background jobs\n\n## Workflows\n\n| Workflow | Steps |\n| --- | --- |\n| `website_generation` | `select_and_copy_website_template` |\n\n## Jobs\n\n| River job kind | Args | Unique key | Do |\n| --- | --- | --- | --- |\n| `website_copy_generation` | `tenant_id` | `tenant_id` | `GenerateWebsiteCopy` |\n| `google_maps_listing_extract` | `run_id` | `run_id` | **calls** `extract/googlemaps.Run` |\n\n### `website_copy_generation`\n\nOverflow.\n"
	if err := os.WriteFile(path, []byte(src), 0o644); err != nil {
		t.Fatal(err)
	}
	c, err := parseJobsCatalog(path)
	if err != nil {
		t.Fatal(err)
	}
	if !c.names["website_copy_generation"] || !c.names["google_maps_listing_extract"] {
		t.Fatalf("names: %v", c.names)
	}
	if c.names["website_generation"] {
		t.Fatal("workflow name is not a River job kind")
	}
	if c.names["extract"] || c.names["googlemaps"] {
		t.Fatalf("Do-column tokens leaked: %v", c.names)
	}
	if errs := checkJobsHeadings(c); len(errs) != 0 {
		t.Fatalf("headings: %v", errs)
	}
}

func TestJobsExtraHeading(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "jobs.md")
	src := "# Jobs\n\n## Workflows\n\n## Jobs\n\n| River job kind | Args |\n| --- | --- |\n| `website_copy_generation` | `tenant_id` |\n\n## Automatic website copy generation\n"
	if err := os.WriteFile(path, []byte(src), 0o644); err != nil {
		t.Fatal(err)
	}
	c, err := parseJobsCatalog(path)
	if err != nil {
		t.Fatal(err)
	}
	errs := checkJobsHeadings(c)
	if len(errs) != 1 || !strings.Contains(errs[0], "Automatic website copy generation") {
		t.Fatalf("errs: %v", errs)
	}
}

func TestKnownRiverJobs(t *testing.T) {
	dir := t.TempDir()
	docs := filepath.Join(dir, "docs")
	if err := os.MkdirAll(filepath.Join(docs, "features"), 0o755); err != nil {
		t.Fatal(err)
	}
	ok := "River job kind `website_copy_generation` and **inserts** `google_maps_listing_extract`.\n`thread_kind=website_copy_generation` is not a River job kind.\nSitemap parse inserts `discovered`.\n"
	if err := os.WriteFile(filepath.Join(docs, "ok.md"), []byte(ok), 0o644); err != nil {
		t.Fatal(err)
	}
	names := map[string]bool{
		"website_copy_generation":     true,
		"google_maps_listing_extract": true,
	}
	if errs := checkKnownRiverJobs(docs, names); len(errs) != 0 {
		t.Fatalf("ok: %v", errs)
	}
	bad := "River job `not_a_real_kind` and **inserts** `also_fake`.\n"
	if err := os.WriteFile(filepath.Join(docs, "bad.md"), []byte(bad), 0o644); err != nil {
		t.Fatal(err)
	}
	errs := checkKnownRiverJobs(docs, names)
	if len(errs) != 2 {
		t.Fatalf("want 2 unknown, got %v", errs)
	}
}

func TestInsertsHeadingAllowed(t *testing.T) {
	if !allowedHeading("Inserts") {
		t.Fatal("Inserts")
	}
}
