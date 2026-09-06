package main

import (
	"os"
	"path/filepath"
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

func TestEmpty(t *testing.T) {
	if err := run([]string{"--root", writeTree(t, nil), "--all"}); err != nil {
		t.Fatal(err)
	}
}

func TestAllowedOnboardingAPIToPipeline(t *testing.T) {
	root := writeTree(t, map[string]string{
		"internal/onboarding/api/api.go": "package api\nimport _ \"placis/internal/onboarding/pipeline\"\n",
	})
	if err := run([]string{"--root", root, "--all"}); err != nil {
		t.Fatal(err)
	}
}

func TestPipelineImportsAPIFails(t *testing.T) {
	root := writeTree(t, map[string]string{
		"internal/onboarding/pipeline/01.go": "package pipeline\nimport _ \"placis/internal/onboarding/api\"\n",
	})
	if err := run([]string{"--root", root, "--all"}); err == nil {
		t.Fatal("want fail")
	}
}

func TestFeatureImportsHTTPAPIFails(t *testing.T) {
	root := writeTree(t, map[string]string{
		"internal/website/api/api.go": "package api\nimport _ \"placis/internal/infrastructure/httpapi\"\n",
	})
	if err := run([]string{"--root", root, "--all"}); err == nil {
		t.Fatal("want fail")
	}
}

func TestCmdAPIImportsHTTPAPIOK(t *testing.T) {
	root := writeTree(t, map[string]string{
		"cmd/api/main.go": "package main\nimport _ \"placis/internal/infrastructure/httpapi\"\n",
	})
	if err := run([]string{"--root", root, "--all"}); err != nil {
		t.Fatal(err)
	}
}

func TestCrossStoreFails(t *testing.T) {
	root := writeTree(t, map[string]string{
		"internal/onboarding/api/api.go": "package api\nimport _ \"placis/internal/profile/store\"\n",
	})
	if err := run([]string{"--root", root, "--all"}); err == nil {
		t.Fatal("want fail")
	}
}

func TestOwnStoreOK(t *testing.T) {
	root := writeTree(t, map[string]string{
		"internal/website/pipeline/01.go": "package pipeline\nimport _ \"placis/internal/website/store\"\n",
	})
	if err := run([]string{"--root", root, "--all"}); err != nil {
		t.Fatal(err)
	}
}

func TestProfileImportsWebsiteFails(t *testing.T) {
	root := writeTree(t, map[string]string{
		"internal/profile/service.go": "package profile\nimport _ \"placis/internal/website\"\n",
	})
	if err := run([]string{"--root", root, "--all"}); err == nil {
		t.Fatal("want fail")
	}
}

func TestCMSImportsOnboardingFails(t *testing.T) {
	root := writeTree(t, map[string]string{
		"frontend-3/src/features/cms/layout.tsx": "import x from \"../onboarding/find\";\n",
	})
	if err := run([]string{"--root", root, "--all"}); err == nil {
		t.Fatal("want fail")
	}
}

func TestFrontend3ImportsFrontend2Fails(t *testing.T) {
	root := writeTree(t, map[string]string{
		"frontend-3/src/routes/x.ts": "import x from \"../../../frontend-2/src/foo\";\n",
	})
	if err := run([]string{"--root", root, "--all"}); err == nil {
		t.Fatal("want fail")
	}
}

func TestOnboardingImportsCMSOK(t *testing.T) {
	root := writeTree(t, map[string]string{
		"frontend-3/src/features/onboarding/find/Find.tsx": "import x from \"../../cms/profile/details\";\n",
	})
	if err := run([]string{"--root", root, "--all"}); err != nil {
		t.Fatal(err)
	}
}
