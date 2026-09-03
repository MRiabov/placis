package main

import (
	"strings"
	"testing"
)

func okTesting(atx ...atxHead) headingFile {
	return headingFile{
		path: "docs/features/sample/testing.md",
		rel:  "sample/testing.md",
		atx:  atx,
	}
}

func TestTestingHeadingsClosedOK(t *testing.T) {
	f := okTesting(
		atxHead{2, "E2E"},
		atxHead{3, "Sample"},
		atxHead{4, "Setup"},
		atxHead{4, "Exercise"},
		atxHead{4, "Verify"},
		atxHead{4, "Fail"},
		atxHead{4, "Mocked"},
		atxHead{4, "Teardown"},
		atxHead{2, "Integration"},
		atxHead{3, "Two-tenant isolation"},
		atxHead{4, "Setup"},
		atxHead{4, "Exercise"},
		atxHead{4, "Verify"},
	)
	if errs := checkTestingHeadings(report{testingFiles: []headingFile{f}}); len(errs) != 0 {
		t.Fatalf("closed: %v", errs)
	}
}

func TestTestingHeadingsTeardownOnly(t *testing.T) {
	f := okTesting(
		atxHead{2, "Integration"},
		atxHead{3, "Sample"},
		atxHead{4, "Setup"},
		atxHead{4, "Exercise"},
		atxHead{4, "Verify"},
		atxHead{4, "Teardown"},
	)
	if errs := checkTestingHeadings(report{testingFiles: []headingFile{f}}); len(errs) != 0 {
		t.Fatalf("teardown only: %v", errs)
	}
}

func TestTestingHeadingsBanRoutes(t *testing.T) {
	f := okTesting(atxHead{2, "Routes"})
	errs := checkTestingHeadings(report{testingFiles: []headingFile{f}})
	if len(errs) == 0 {
		t.Fatal("expected extra heading")
	}
	joined := strings.Join(errs, "\n")
	if !strings.Contains(joined, "Routes") {
		t.Fatalf("ban routes: %v", errs)
	}
}

func TestTestingHeadingsBanJourneyH2(t *testing.T) {
	f := okTesting(
		atxHead{2, "CMS"},
		atxHead{3, "Hydrate"},
		atxHead{4, "Setup"},
		atxHead{4, "Exercise"},
		atxHead{4, "Verify"},
	)
	errs := checkTestingHeadings(report{testingFiles: []headingFile{f}})
	if len(errs) == 0 || !strings.Contains(strings.Join(errs, "\n"), "## CMS") {
		t.Fatalf("journey h2: %v", errs)
	}
}

func TestTestingHeadingsBanMethodH3(t *testing.T) {
	f := okTesting(
		atxHead{2, "E2E"},
		atxHead{3, "GET /v1/website/editor/pages"},
		atxHead{4, "Setup"},
		atxHead{4, "Exercise"},
		atxHead{4, "Verify"},
	)
	errs := checkTestingHeadings(report{testingFiles: []headingFile{f}})
	if len(errs) != 1 || !strings.Contains(errs[0], "### GET") {
		t.Fatalf("method h3: %v", errs)
	}
}

func TestTestingHeadingsBanExtraH4(t *testing.T) {
	f := okTesting(
		atxHead{2, "E2E"},
		atxHead{3, "Sample"},
		atxHead{4, "Setup"},
		atxHead{4, "Exercise"},
		atxHead{4, "Verify"},
		atxHead{4, "Find"},
	)
	errs := checkTestingHeadings(report{testingFiles: []headingFile{f}})
	if len(errs) == 0 || !strings.Contains(strings.Join(errs, "\n"), "#### Find") {
		t.Fatalf("extra h4: %v", errs)
	}
}

func TestTestingHeadingsRequireSetupExerciseVerify(t *testing.T) {
	f := okTesting(
		atxHead{2, "E2E"},
		atxHead{3, "Sample"},
		atxHead{4, "Setup"},
		atxHead{4, "Verify"},
	)
	errs := checkTestingHeadings(report{testingFiles: []headingFile{f}})
	if len(errs) == 0 || !strings.Contains(strings.Join(errs, "\n"), "Setup / Exercise / Verify") {
		t.Fatalf("required h4: %v", errs)
	}
}

func TestTestingHeadingsMissingH2(t *testing.T) {
	f := okTesting()
	errs := checkTestingHeadings(report{testingFiles: []headingFile{f}})
	if len(errs) != 1 || !strings.Contains(errs[0], "missing ## E2E") {
		t.Fatalf("missing h2: %v", errs)
	}
}

func TestTestingHeadingsH4Order(t *testing.T) {
	f := okTesting(
		atxHead{2, "E2E"},
		atxHead{3, "Sample"},
		atxHead{4, "Setup"},
		atxHead{4, "Exercise"},
		atxHead{4, "Verify"},
		atxHead{4, "Mocked"},
		atxHead{4, "Fail"},
	)
	errs := checkTestingHeadings(report{testingFiles: []headingFile{f}})
	if len(errs) == 0 || !strings.Contains(strings.Join(errs, "\n"), "Fail out of order") {
		t.Fatalf("h4 order: %v", errs)
	}
}

func TestTestingHeadingsTeardownBeforeMocked(t *testing.T) {
	f := okTesting(
		atxHead{2, "E2E"},
		atxHead{3, "Sample"},
		atxHead{4, "Setup"},
		atxHead{4, "Exercise"},
		atxHead{4, "Verify"},
		atxHead{4, "Teardown"},
		atxHead{4, "Mocked"},
	)
	errs := checkTestingHeadings(report{testingFiles: []headingFile{f}})
	if len(errs) == 0 || !strings.Contains(strings.Join(errs, "\n"), "Mocked out of order") {
		t.Fatalf("teardown order: %v", errs)
	}
}

func TestTestingHeadingsTitleSuffixOK(t *testing.T) {
	f := okTesting(
		atxHead{2, "Integration"},
		atxHead{3, "TestHappyPathV1Me — Route"},
		atxHead{4, "Setup"},
		atxHead{4, "Exercise"},
		atxHead{4, "Verify"},
		atxHead{3, "TestPipelineHappyPathAdsFull — pipeline Full"},
		atxHead{4, "Setup"},
		atxHead{4, "Exercise"},
		atxHead{4, "Verify"},
		atxHead{3, "HappyPathAdsFull — frontend Full"},
		atxHead{4, "Setup"},
		atxHead{4, "Exercise"},
		atxHead{4, "Verify"},
	)
	if errs := checkTestingHeadings(report{testingFiles: []headingFile{f}}); len(errs) != 0 {
		t.Fatalf("title suffix ok: %v", errs)
	}
}

func TestTestingHeadingsTitleSuffixMissing(t *testing.T) {
	f := okTesting(
		atxHead{2, "Integration"},
		atxHead{3, "TestHappyPathV1Me"},
		atxHead{4, "Setup"},
		atxHead{4, "Exercise"},
		atxHead{4, "Verify"},
	)
	errs := checkTestingHeadings(report{testingFiles: []headingFile{f}})
	if len(errs) == 0 || !strings.Contains(strings.Join(errs, "\n"), "missing — Route") {
		t.Fatalf("missing suffix: %v", errs)
	}
}

func TestTestingHeadingsTitleSuffixWrong(t *testing.T) {
	f := okTesting(
		atxHead{2, "Integration"},
		atxHead{3, "TestPipelineHappyPathAdsFull — Route"},
		atxHead{4, "Setup"},
		atxHead{4, "Exercise"},
		atxHead{4, "Verify"},
	)
	errs := checkTestingHeadings(report{testingFiles: []headingFile{f}})
	if len(errs) == 0 || !strings.Contains(strings.Join(errs, "\n"), "expected — pipeline Full") {
		t.Fatalf("wrong suffix: %v", errs)
	}
}
