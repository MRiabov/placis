package main

import (
	"strings"
	"testing"
)

func TestPersistHeadingsClosed(t *testing.T) {
	p := persistFile{
		path:  "docs/features/website/persistence.md",
		rel:   "website/persistence.md",
		heads: []string{"Tables", "Indexes"},
	}
	if errs := checkPersistHeadings(report{persistFiles: []persistFile{p}}); len(errs) != 0 {
		t.Fatalf("closed: %v", errs)
	}
}

func TestPersistHeadingsEtlClosed(t *testing.T) {
	p := persistFile{
		path:  "docs/features/etl/persistence.md",
		rel:   "etl/persistence.md",
		heads: []string{"Tables", "Indexes"},
	}
	if errs := checkPersistHeadings(report{persistFiles: []persistFile{p}}); len(errs) != 0 {
		t.Fatalf("etl closed: %v", errs)
	}
}

func TestPersistHeadingsNewExtraFails(t *testing.T) {
	p := persistFile{
		path:  "docs/features/website/persistence.md",
		rel:   "website/persistence.md",
		heads: []string{"Tables", "Indexes", "Runs"},
	}
	errs := checkPersistHeadings(report{persistFiles: []persistFile{p}})
	if len(errs) != 1 || !strings.Contains(errs[0], "Runs") {
		t.Fatalf("new extra: %v", errs)
	}
}

func TestPersistHeadingsTablesNeedIndexes(t *testing.T) {
	p := persistFile{
		path:  "docs/features/sample/persistence.md",
		rel:   "sample/persistence.md",
		heads: []string{"Tables"},
	}
	errs := checkPersistHeadings(report{persistFiles: []persistFile{p}})
	if len(errs) != 1 || !strings.Contains(errs[0], "missing ## Indexes") {
		t.Fatalf("indexes: %v", errs)
	}
}
