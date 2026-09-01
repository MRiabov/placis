package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestHeadingsAllowDoPhase(t *testing.T) {
	root := filepath.Join("testdata", "ok")
	rep, err := inspect(root)
	if err != nil {
		t.Fatal(err)
	}
	if errs := checkHeadings(rep); len(errs) != 0 {
		t.Fatalf("headings: %v", errs)
	}
}

func TestHeadingsRejectExtra(t *testing.T) {
	root := filepath.Join("testdata", "bad-heading")
	rep, err := inspect(root)
	if err != nil {
		t.Fatal(err)
	}
	errs := checkHeadings(rep)
	if len(errs) == 0 {
		t.Fatal("expected extra heading")
	}
}

func TestPipelinePairing(t *testing.T) {
	root := filepath.Join("testdata", "ok")
	rep, err := inspect(root)
	if err != nil {
		t.Fatal(err)
	}
	if errs := checkPipelinePairing(rep); len(errs) != 0 {
		t.Fatalf("pairing: %v", errs)
	}
}

func TestPipelinePairingMissingTable(t *testing.T) {
	root := filepath.Join("testdata", "missing-table")
	rep, err := inspect(root)
	if err != nil {
		t.Fatal(err)
	}
	errs := checkPipelinePairing(rep)
	if len(errs) == 0 {
		t.Fatal("expected missing table")
	}
}

func TestCoverageUnion(t *testing.T) {
	root := filepath.Join("testdata", "ok")
	rep, err := inspect(root)
	if err != nil {
		t.Fatal(err)
	}
	if errs := checkCoverage(rep); len(errs) != 0 {
		t.Fatalf("coverage: %v", errs)
	}
}

func TestWarnOnChangedPersistence(t *testing.T) {
	root := filepath.Join("testdata", "no-testing")
	rep, err := inspect(root)
	if err != nil {
		t.Fatal(err)
	}
	if len(rep.persistFiles) != 1 {
		t.Fatalf("persist files: %+v", rep.persistFiles)
	}
	if rep.persistFiles[0].testingPath != "" {
		t.Fatalf("expected no testing.md, got %s", rep.persistFiles[0].testingPath)
	}
	if msgs := warnMissingTesting(rep, nil); len(msgs) != 0 {
		t.Fatalf("no changed files: %v", msgs)
	}
	if msgs := warnMissingTesting(rep, []string{rep.persistFiles[0].path}); len(msgs) != 1 {
		t.Fatalf("changed persist: %v", msgs)
	}
	if err := run([]string{"--all", "--root", root}); err != nil {
		t.Fatal(err)
	}
}

func TestHeadingsMissingRequired(t *testing.T) {
	root := filepath.Join("testdata", "missing-persist")
	rep, err := inspect(root)
	if err != nil {
		t.Fatal(err)
	}
	errs := checkHeadings(rep)
	if len(errs) == 0 {
		t.Fatal("expected missing ## Persist")
	}
}

func TestRunAllOK(t *testing.T) {
	wd, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	root := filepath.Join(wd, "testdata", "ok")
	if err := run([]string{"--all", "--root", root}); err != nil {
		t.Fatal(err)
	}
}

func TestDocMentionsQualified(t *testing.T) {
	if !docMentions("assert `etl.runs`", "etl.runs") {
		t.Fatal("qualified")
	}
	if !docMentions("assert `runs`", "etl.runs") {
		t.Fatal("unqualified alias")
	}
	if docMentions("no tables", "runs") {
		t.Fatal("false positive")
	}
}

func TestStepTablesIgnoresColumns(t *testing.T) {
	cat := map[string]bool{"website_pages": true}
	got := stepTables("reads `website_pages` and `tenant_id`", cat)
	if strings.Join(got, ",") != "website_pages" {
		t.Fatalf("got %v", got)
	}
}
