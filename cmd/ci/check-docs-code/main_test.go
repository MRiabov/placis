package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestRunDocsOnlyCurrentTree(t *testing.T) {
	root := filepath.Join("..", "..", "..")
	err := run([]string{
		"--all",
		"--docs", filepath.Join(root, "docs"),
		"--jobs", filepath.Join(root, "docs", "general-architecture", "jobs.md"),
		"--openapi", filepath.Join(root, "openapi.json"),
		"--worker-openapi", filepath.Join(root, "apps", "contractor-website", "openapi.json"),
		"--migrations", filepath.Join(root, "migrations"),
		"--internal", filepath.Join(root, "internal"),
		"--cmd", filepath.Join(root, "cmd"),
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestRunInventedOpenAPI(t *testing.T) {
	root := t.TempDir()
	docs := filepath.Join(root, "docs")
	feat := filepath.Join(docs, "features", "website")
	if err := os.MkdirAll(feat, 0o755); err != nil {
		t.Fatal(err)
	}
	api := "# HTTP\n\n## DTOs\n\n| DTO | Fields |\n| --- | --- |\n| `WebsitePageRead` | `id` |\n\n## Routes\n\n| Method + path | Callers | Request | Response |\n| --- | --- | --- | --- |\n| `GET /v1/website/editor/pages` | workspace | | `WebsitePageRead` |\n\n## Do not create\n\n- `/v1/public/site/…`\n"
	if err := os.WriteFile(filepath.Join(feat, "api.md"), []byte(api), 0o644); err != nil {
		t.Fatal(err)
	}
	jobs := "# Jobs\n\n## Workflows\n\n## Jobs\n\n| River job kind | Args |\n| --- | --- |\n| `website_copy_generation` | `tenant_id` |\n"
	jobsPath := filepath.Join(docs, "jobs.md")
	if err := os.WriteFile(jobsPath, []byte(jobs), 0o644); err != nil {
		t.Fatal(err)
	}
	spec := `{"paths":{"/v1/invented":{"get":{"responses":{"200":{"description":"x"}}}}}}`
	openapi := filepath.Join(root, "openapi.json")
	if err := os.WriteFile(openapi, []byte(spec), 0o644); err != nil {
		t.Fatal(err)
	}
	err := run([]string{
		"--docs", docs,
		"--jobs", jobsPath,
		"--openapi", openapi,
		"--worker-openapi", filepath.Join(root, "missing-worker.json"),
		"--migrations", filepath.Join(root, "migrations"),
		"--internal", filepath.Join(root, "internal"),
		"--cmd", filepath.Join(root, "cmd"),
	})
	if err == nil || !strings.Contains(err.Error(), "check-docs-code error") {
		t.Fatalf("want fail, got %v", err)
	}
}
