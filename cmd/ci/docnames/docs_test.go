package docnames

import (
	"os"
	"path/filepath"
	"testing"
)

func TestParseAPIFileWebsite(t *testing.T) {
	src, err := os.ReadFile(filepath.Join("..", "..", "..", "docs", "features", "website", "api.md"))
	if err != nil {
		t.Fatal(err)
	}
	f := ParseAPIFile("website/api.md", string(src))
	wantPaths := []string{
		"GET /v1/websites/{website_prefix}/editor/pages",
		"PATCH /v1/websites/{website_prefix}/editor/pages/{page_id}",
		"POST /internal/website-render",
		"POST /internal/website-publication",
	}
	for _, p := range wantPaths {
		if !f.Paths[p] {
			t.Fatalf("missing path %s", p)
		}
	}
	if !f.PublicPaths["GET /v1/websites/{website_prefix}/editor/pages"] {
		t.Fatal("public path")
	}
	if !f.InternalPaths["POST /internal/website-render"] {
		t.Fatal("internal path")
	}
	if !f.DTOs["WebsitePageRead"] || !f.PublicDTOs["WebsitePageRead"] {
		t.Fatal("public DTO")
	}
	if !f.InternalDTOs["WebsiteRenderRequest"] {
		t.Fatal("internal DTO")
	}
	if f.PublicDTOs["WebsiteRenderRequest"] {
		t.Fatal("render DTO is not public")
	}
	banned := false
	for _, b := range f.Banned {
		if b == "/v1/public/site" || b == "/v1/public/site/…" {
			banned = true
		}
		if b == "/v1/public/site" {
			banned = true
		}
	}
	if !banned {
		t.Fatalf("banned: %v", f.Banned)
	}
}

func TestParseAPIFileBilling(t *testing.T) {
	src, err := os.ReadFile(filepath.Join("..", "..", "..", "docs", "features", "billing", "api.md"))
	if err != nil {
		t.Fatal(err)
	}
	f := ParseAPIFile("billing/api.md", string(src))
	wantPaths := []string{
		"GET /v1/billing/usage",
		"POST /v1/billing/extra-usage-credit/checkout",
		"POST /v1/billing/subscription/checkout",
		"POST /v1/billing/subscription/cancel",
		"POST /v1/billing/subscription/keep",
	}
	for _, p := range wantPaths {
		if !f.Paths[p] {
			t.Fatalf("missing path %s: %v", p, f.Paths)
		}
	}
	if !f.DTOs["BillingUsageRead"] || !f.HasDTOTable() {
		t.Fatalf("DTOs: %v", f.DTOs)
	}
	if !f.PublicDTOs["BillingUsageRead"] {
		t.Fatal("public DTO")
	}
}

func TestParseAPIFileHealth(t *testing.T) {
	src, err := os.ReadFile(filepath.Join("..", "..", "..", "docs", "general-architecture", "api.md"))
	if err != nil {
		t.Fatal(err)
	}
	f := ParseAPIFile("general-architecture/api.md", string(src))
	if !f.Paths["GET /v1/health"] || !f.Paths["GET /openapi.json"] {
		t.Fatalf("paths: %v", f.Paths)
	}
	if f.Paths["POST /internal/website-render"] {
		t.Fatal("worker ops live on website Routes")
	}
}

func TestJobsTableNames(t *testing.T) {
	src, err := os.ReadFile(filepath.Join("..", "..", "..", "docs", "infrastructure", "jobs.md"))
	if err != nil {
		t.Fatal(err)
	}
	names, err := JobsTableNames(string(src))
	if err != nil {
		t.Fatal(err)
	}
	if !names["website_copy_generation"] || !names["scheduled_etl"] {
		t.Fatalf("names: %v", names)
	}
	if names["website_generation"] {
		t.Fatal("workflow name is not a River job kind")
	}
}

func TestParseDocsTemp(t *testing.T) {
	root := t.TempDir()
	feat := filepath.Join(root, "features", "website")
	if err := os.MkdirAll(feat, 0o755); err != nil {
		t.Fatal(err)
	}
	persist := "# P\n\nPostgres schema `website`.\n\n## Tables\n\n### `website_pages`\n\n- **Columns:** `id`\n"
	if err := os.WriteFile(filepath.Join(feat, "persistence.md"), []byte(persist), 0o644); err != nil {
		t.Fatal(err)
	}
	api := "# HTTP\n\n## DTOs\n\n| DTO | Fields |\n| --- | --- |\n| `WebsitePageRead` | `id` |\n\n## Routes\n\n| Method + path | Callers | Request | Response |\n| --- | --- | --- | --- |\n| `GET /v1/website/editor/pages` | workspace | | `WebsitePageRead` |\n\n## Do not create\n\n- `/v1/public/site/…`\n"
	if err := os.WriteFile(filepath.Join(feat, "api.md"), []byte(api), 0o644); err != nil {
		t.Fatal(err)
	}
	jobs := "# Jobs\n\n## Workflows\n\n## Jobs\n\n| River job kind | Args |\n| --- | --- |\n| `website_copy_generation` | `tenant_id` |\n"
	jobsPath := filepath.Join(root, "jobs.md")
	if err := os.WriteFile(jobsPath, []byte(jobs), 0o644); err != nil {
		t.Fatal(err)
	}
	d, err := ParseDocs(root, jobsPath)
	if err != nil {
		t.Fatal(err)
	}
	if !d.Tables["website_pages"] || !d.Tables["website.website_pages"] {
		t.Fatalf("tables: %v", d.Tables)
	}
	if !d.Paths["GET /v1/website/editor/pages"] {
		t.Fatal("path")
	}
	if !d.JobNames["website_copy_generation"] {
		t.Fatal("job")
	}
	if !d.ByFile["website/api.md"].Paths["GET /v1/website/editor/pages"] {
		t.Fatal("rel")
	}
}
