package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func writeTree(t *testing.T, files map[string]string) string {
	t.Helper()
	dir := t.TempDir()
	for rel, body := range files {
		path := filepath.Join(dir, rel)
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	return dir
}

const healthSpec = `{
  "openapi": "3.1.0",
  "paths": {
    "/v1/health": { "get": { "operationId": "health" } },
    "/internal/website-render": { "post": { "operationId": "render" } }
  }
}`

const healthTest = `package foo

import "testing"

func TestHappyPathHealth(t *testing.T) {
	_ = "GET /v1/health"
}
`

const renderTest = `package foo

import "testing"

func TestHappyPathInternalWebsiteRender(t *testing.T) {
	api.Post("/internal/website-render")
}

type apiClient struct{}

func (apiClient) Post(path string) {}

var api apiClient
`

const flowTest = `package foo

import "testing"

func TestHappyPathWebsiteEditorFlow(t *testing.T) {
	_ = "GET /v1/health"
	_ = "GET /v1/website/editor/pages"
}
`

func emptyDocs(t *testing.T) string {
	t.Helper()
	return t.TempDir()
}

func TestPublicCoversHealthIgnoresInternal(t *testing.T) {
	dir := writeTree(t, map[string]string{
		"openapi.json":             healthSpec,
		"internal/foo/foo_test.go": healthTest,
	})
	err := run([]string{
		"--public",
		"--docs", emptyDocs(t),
		"--openapi", filepath.Join(dir, "openapi.json"),
		"--internal", filepath.Join(dir, "internal"),
	})
	if err != nil {
		t.Fatalf("public: %v", err)
	}
}

func TestPublicMissingFails(t *testing.T) {
	dir := writeTree(t, map[string]string{
		"openapi.json": healthSpec,
	})
	err := run([]string{
		"--public",
		"--docs", emptyDocs(t),
		"--openapi", filepath.Join(dir, "openapi.json"),
		"--internal", filepath.Join(dir, "internal"),
	})
	if err == nil || !strings.Contains(err.Error(), "check-happy-path error") {
		t.Fatalf("want missing, got %v", err)
	}
}

func TestFlowDoesNotFillOneToOne(t *testing.T) {
	dir := writeTree(t, map[string]string{
		"openapi.json":             healthSpec,
		"internal/foo/foo_test.go": flowTest,
	})
	err := run([]string{
		"--public",
		"--docs", emptyDocs(t),
		"--openapi", filepath.Join(dir, "openapi.json"),
		"--internal", filepath.Join(dir, "internal"),
	})
	if err == nil {
		t.Fatal("flow must not cover health")
	}
}

func TestWorkerMode(t *testing.T) {
	dir := writeTree(t, map[string]string{
		"worker.json":              healthSpec,
		"internal/foo/foo_test.go": renderTest,
	})
	err := run([]string{
		"--worker",
		"--worker-openapi", filepath.Join(dir, "worker.json"),
		"--internal", filepath.Join(dir, "internal"),
	})
	if err != nil {
		t.Fatalf("worker: %v", err)
	}
}

func TestMissingSpecNoops(t *testing.T) {
	dir := t.TempDir()
	err := run([]string{
		"--public",
		"--docs", emptyDocs(t),
		"--openapi", filepath.Join(dir, "missing.json"),
		"--internal", filepath.Join(dir, "internal"),
	})
	if err != nil {
		t.Fatalf("noop: %v", err)
	}
}

func TestPipelineNameIsNotHappyPath(t *testing.T) {
	dir := writeTree(t, map[string]string{
		"openapi.json": healthSpec,
		"internal/foo/foo_test.go": `package foo
import "testing"
func TestPipelineHappyPathWebsiteFull(t *testing.T) {
	_ = "GET /v1/health"
}
`,
	})
	err := run([]string{
		"--public",
		"--docs", emptyDocs(t),
		"--openapi", filepath.Join(dir, "openapi.json"),
		"--internal", filepath.Join(dir, "internal"),
	})
	if err == nil {
		t.Fatal("pipeline name must not fill OpenAPI 1:1")
	}
}
