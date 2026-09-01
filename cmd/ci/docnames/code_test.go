package docnames

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestParseOpenAPIFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "openapi.json")
	src := `{
  "paths": {
    "/v1/website/editor/pages": {
      "get": {
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/WebsitePageRead" }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "WebsitePageRead": { "type": "object" },
      "UnusedWrapper": { "type": "object" }
    }
  }
}`
	if err := os.WriteFile(path, []byte(src), 0o644); err != nil {
		t.Fatal(err)
	}
	spec, err := ParseOpenAPIFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if !spec.Ops["GET /v1/website/editor/pages"] {
		t.Fatalf("ops: %v", spec.Ops)
	}
	if !spec.DTOs["WebsitePageRead"] {
		t.Fatal("DTO from $ref")
	}
	if spec.DTOs["UnusedWrapper"] {
		t.Fatal("unreferenced schema")
	}
}

func TestRiverFilesFromGo(t *testing.T) {
	root := t.TempDir()
	src := "package jobs\n\ntype Args struct{}\n\nfunc (Args) " + "K" + "ind() string {\n\treturn \"website_copy_generation\"\n}\n"
	if err := os.WriteFile(filepath.Join(root, "copy.go"), []byte(src), 0o644); err != nil {
		t.Fatal(err)
	}
	noise := "package jobs\n\nconst thread_kind = \"website_copy_generation\"\n"
	if err := os.WriteFile(filepath.Join(root, "thread.go"), []byte(noise), 0o644); err != nil {
		t.Fatal(err)
	}
	files, err := RiverFilesFromGo(root)
	if err != nil {
		t.Fatal(err)
	}
	if len(files["website_copy_generation"]) != 1 {
		t.Fatalf("files: %v", files)
	}
	if !strings.HasSuffix(files["website_copy_generation"][0], "copy.go") {
		t.Fatalf("owner: %v", files["website_copy_generation"])
	}
}

func TestRiverFilesSkipCI(t *testing.T) {
	root := t.TempDir()
	ci := filepath.Join(root, "cmd", "ci", "check")
	if err := os.MkdirAll(ci, 0o755); err != nil {
		t.Fatal(err)
	}
	src := "package main\nfunc (Args) " + "K" + "ind() string { return \"invented_job\" }\n"
	if err := os.WriteFile(filepath.Join(ci, "main.go"), []byte(src), 0o644); err != nil {
		t.Fatal(err)
	}
	files, err := RiverFilesFromGo(filepath.Join(root, "cmd"))
	if err != nil {
		t.Fatal(err)
	}
	if len(files) != 0 {
		t.Fatalf("ci must be skipped: %v", files)
	}
}

func TestSQLFilesFromDir(t *testing.T) {
	dir := t.TempDir()
	src := "-- +goose Up\nCREATE TABLE IF NOT EXISTS website.website_pages (\n  id uuid\n);\nCREATE TABLE widgets (\n  id uuid\n);\n"
	if err := os.WriteFile(filepath.Join(dir, "001.sql"), []byte(src), 0o644); err != nil {
		t.Fatal(err)
	}
	files, err := SQLFilesFromDir(dir)
	if err != nil {
		t.Fatal(err)
	}
	if len(files["website_pages"]) == 0 || len(files["website.website_pages"]) == 0 {
		t.Fatalf("tables: %v", files)
	}
	if len(files["widgets"]) == 0 {
		t.Fatal("widgets")
	}
}

func TestTableKnown(t *testing.T) {
	docs := map[string]bool{"website_pages": true, "website.menus": true}
	if !TableKnown("website_pages", docs) || !TableKnown("website.website_pages", docs) {
		t.Fatal("local")
	}
	if !TableKnown("menus", docs) {
		t.Fatal("qualified docs")
	}
	if TableKnown("invented", docs) {
		t.Fatal("invented")
	}
}
