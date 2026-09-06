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
		p := filepath.Join(dir, rel)
		if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(p, []byte(body), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	return dir
}

func runRoot(t *testing.T, root string) error {
	t.Helper()
	return run([]string{"--root", root, "--all"})
}

const humaReg = `package api
import "github.com/danielgtaylor/huma/v2"
func F(api huma.API) { huma.Register(api, huma.Operation{}, func() {}) }
`

const dtoOK = `package api
type WidgetRead struct {
	Name string ` + "`json:\"name\" minLength:\"1\"`" + `
}
`

func TestEmptyTree(t *testing.T) {
	root := writeTree(t, map[string]string{})
	if err := runRoot(t, root); err != nil {
		t.Fatal(err)
	}
}

func TestRegisterInAPIDirOK(t *testing.T) {
	root := writeTree(t, map[string]string{
		"internal/website/api/websites.go": humaReg,
		"internal/website/api/dto.go":      dtoOK,
	})
	if err := runRoot(t, root); err != nil {
		t.Fatal(err)
	}
}

func TestUnsplitAPIOK(t *testing.T) {
	root := writeTree(t, map[string]string{
		"internal/billing/api.go": humaReg,
		"internal/billing/dto.go": dtoOK,
	})
	if err := runRoot(t, root); err != nil {
		t.Fatal(err)
	}
}

func TestRegisterInPipelineFails(t *testing.T) {
	root := writeTree(t, map[string]string{
		"internal/website/pipeline/01.go": humaReg,
	})
	err := runRoot(t, root)
	if err == nil || !strings.Contains(err.Error(), "check-api-dirs") {
		t.Fatalf("got %v", err)
	}
}

func TestRegisterInEditorFails(t *testing.T) {
	root := writeTree(t, map[string]string{
		"internal/website/editor.go": humaReg,
	})
	if err := runRoot(t, root); err == nil {
		t.Fatal("want fail")
	}
}

func TestDTOInAPIFileFails(t *testing.T) {
	root := writeTree(t, map[string]string{
		"internal/website/api/websites.go": `package api
type WidgetRead struct {
	Name string ` + "`json:\"name\" minLength:\"1\"`" + `
}
`,
	})
	if err := runRoot(t, root); err == nil {
		t.Fatal("want fail")
	}
}

func TestRegisterInDTOFails(t *testing.T) {
	root := writeTree(t, map[string]string{
		"internal/website/api/dto.go": humaReg,
	})
	if err := runRoot(t, root); err == nil {
		t.Fatal("want fail")
	}
}

func TestUnconstrainedDTOFails(t *testing.T) {
	root := writeTree(t, map[string]string{
		"internal/billing/dto.go": `package billing
type WidgetRead struct {
	Raw map[string]any ` + "`json:\"raw\"`" + `
}
`,
	})
	if err := runRoot(t, root); err == nil {
		t.Fatal("want fail")
	}
}

func TestSQLInPipelineFails(t *testing.T) {
	root := writeTree(t, map[string]string{
		"internal/website/pipeline/01.go": "package pipeline\nvar q = `INSERT INTO website.pages (id) VALUES (1)`\n",
	})
	if err := runRoot(t, root); err == nil {
		t.Fatal("want fail")
	}
}

func TestCreateTableOutsideGooseFails(t *testing.T) {
	root := writeTree(t, map[string]string{
		"migrations/001.sql": "CREATE TABLE foo (id int);\n",
	})
	if err := runRoot(t, root); err == nil {
		t.Fatal("want fail")
	}
}

func TestQueriesSQLHome(t *testing.T) {
	root := writeTree(t, map[string]string{
		"internal/website/store/queries.sql": "SELECT 1;\n",
	})
	if err := runRoot(t, root); err != nil {
		t.Fatal(err)
	}
	root = writeTree(t, map[string]string{
		"internal/website/pipeline/queries.sql": "SELECT 1;\n",
	})
	if err := runRoot(t, root); err == nil {
		t.Fatal("want fail")
	}
}

func TestTSRoutesImportFails(t *testing.T) {
	root := writeTree(t, map[string]string{
		"frontend-3/src/routes/index.ts": `import { api } from "../shared/api";\n`,
	})
	if err := runRoot(t, root); err == nil {
		t.Fatal("want fail")
	}
}

func TestTSFeatureCallOK(t *testing.T) {
	root := writeTree(t, map[string]string{
		"frontend-3/src/shared/api.ts":             "import createClient from \"openapi-fetch\";\nexport const api = createClient();\n",
		"frontend-3/src/features/cms/ads/list.tsx": `import { api } from "../../shared/api";\n`,
	})
	if err := runRoot(t, root); err != nil {
		t.Fatal(err)
	}
}

func TestDemoV1Fails(t *testing.T) {
	root := writeTree(t, map[string]string{
		"apps/demo/src/foo.ts": "fetch(\"/v1/health\");\n",
	})
	if err := runRoot(t, root); err == nil {
		t.Fatal("want fail")
	}
}
