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

func TestEmpty(t *testing.T) {
	if err := run([]string{"--root", t.TempDir(), "--all"}); err != nil {
		t.Fatal(err)
	}
}

func TestGlossaryExcepted(t *testing.T) {
	body := strings.Repeat("x\n", 1300)
	root := writeTree(t, map[string]string{
		"docs/glossary.md":                    body,
		"docs/features/onboarding/testing.md": strings.Repeat("y\n", 900),
	})
	if err := run([]string{"--root", root, "--all"}); err != nil {
		t.Fatal(err)
	}
}

func TestDocsOver1200Fails(t *testing.T) {
	root := writeTree(t, map[string]string{
		"docs/too-long.md": strings.Repeat("x\n", 1201),
	})
	if err := run([]string{"--root", root, "--all"}); err == nil {
		t.Fatal("want fail")
	}
}

func TestDemoOver800Fails(t *testing.T) {
	root := writeTree(t, map[string]string{
		"apps/demo/src/Big.tsx": strings.Repeat("x\n", 801),
	})
	if err := run([]string{"--root", root, "--all"}); err == nil {
		t.Fatal("want fail")
	}
}

func TestFanoutNestedFails(t *testing.T) {
	files := map[string]string{}
	for i := 0; i < 10; i++ {
		files[filepath.Join("internal", "website", "f"+string(rune('a'+i))+".go")] = "package website\n"
	}
	root := writeTree(t, files)
	if err := run([]string{"--root", root, "--all"}); err == nil {
		t.Fatal("want fail")
	}
}

func TestFanoutOK(t *testing.T) {
	root := writeTree(t, map[string]string{
		"internal/website/a.go": "package website\n",
		"internal/website/b.go": "package website\n",
	})
	if err := run([]string{"--root", root, "--all"}); err != nil {
		t.Fatal(err)
	}
}
