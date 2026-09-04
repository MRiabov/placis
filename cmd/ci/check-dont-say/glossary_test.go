package main

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestParseDontSayTableFixture(t *testing.T) {
	src := mustRead(t, "testdata/glossary.md")
	tokens, err := parseDontSayTable(src)
	if err != nil {
		t.Fatal(err)
	}
	got := map[string]tokenClass{}
	for _, tok := range tokens {
		got[tok.phrase] = tok.class
	}
	want := map[string]tokenClass{
		"marketing claim": classAlways,
		"menu":            classHome,
		"header":          classAlways,
		"navigation":      classAlways,
		"page":            classHome,
		"posting":         classHome,
		"interview":       classHome,
		"slug":            classAlways,
		"website claim":   classAlways,
		"source_refs":     classProductDocsOnly,
		"CMS":             classProductDocsOnly,
		"phone":           classAlways,
	}
	for phrase, class := range want {
		if got[phrase] != class {
			t.Errorf("%q: class %v, want %v", phrase, got[phrase], class)
		}
	}
	if got["menu"] == classHome {
		var menu token
		for _, tok := range tokens {
			if tok.phrase == "menu" {
				menu = tok
				break
			}
		}
		if len(menu.homes) != 1 || menu.homes[0] != "website" {
			t.Errorf("menu homes %v, want [website]", menu.homes)
		}
	}
	if _, ok := got["Demo-prefixed ops"]; ok {
		t.Fatal("ops row should be skipped")
	}
}

func TestParseDontSayTableMissingHeading(t *testing.T) {
	_, err := parseDontSayTable("# Glossary\n\nNo table here.\n")
	if err == nil {
		t.Fatal("expected missing heading to fail")
	}
}

func TestParseDontSayTableMissingHeader(t *testing.T) {
	src := "## Don't say\n\n| left | right |\n| --- | --- |\n| foo | bar |\n\n## Internal\n"
	_, err := parseDontSayTable(src)
	if err == nil {
		t.Fatal("expected missing Don't say | Say header to fail")
	}
}

func TestParseDontSayTableMissingSeparator(t *testing.T) {
	src := "## Don't say\n\n| Don't say | Say |\n| foo | bar |\n\n## Internal\n"
	_, err := parseDontSayTable(src)
	if err == nil {
		t.Fatal("expected missing separator to fail")
	}
}

func TestParseDontSayTableNoRows(t *testing.T) {
	src := "## Don't say\n\n| Don't say | Say |\n| --- | --- |\n\n## Internal\n"
	_, err := parseDontSayTable(src)
	if err == nil {
		t.Fatal("expected empty table to fail")
	}
}

func TestParseDontSayTableMissingSectionEnd(t *testing.T) {
	src := "## Don't say\n\n| Don't say | Say |\n| --- | --- |\n| foo | bar |\n"
	_, err := parseDontSayTable(src)
	if err == nil {
		t.Fatal("expected missing ## end to fail")
	}
}

func TestParseRealGlossary(t *testing.T) {
	src := mustRead(t, filepath.Join(repoRoot(t), "docs", "glossary.md"))
	tokens, err := parseDontSayTable(src)
	if err != nil {
		t.Fatal(err)
	}
	if len(tokens) < 20 {
		t.Fatalf("too few tokens: %d", len(tokens))
	}
}

func TestLeftoverBareIsAlwaysBan(t *testing.T) {
	tok := classifyToken("slug (bare)", "website address")
	if tok.class != classAlways || tok.phrase != "slug" {
		t.Fatalf("got class %v phrase %q", tok.class, tok.phrase)
	}
	tok = classifyToken("page (bare, website)", "website page")
	if tok.class != classHome || len(tok.homes) != 1 || tok.homes[0] != "website" {
		t.Fatalf("bare+home: class %v homes %v", tok.class, tok.homes)
	}
	tok = classifyToken("form (website, ads, leads)", "website form or ad lead form")
	if tok.class != classHome || strings.Join(tok.homes, ",") != "website,ads,leads" {
		t.Fatalf("dual home: class %v homes %v", tok.class, tok.homes)
	}
}

func TestIdentifierVariants(t *testing.T) {
	got := identifierVariants("marketing claim")
	want := []string{"marketing_claim", "marketing-claim", "MarketingClaim", "marketingClaim"}
	if strings.Join(got, ",") != strings.Join(want, ",") {
		t.Fatalf("got %v want %v", got, want)
	}
	if identifierVariants("user") != nil {
		t.Fatal("single words must not inflect")
	}
}

func repoRoot(t *testing.T) string {
	t.Helper()
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("runtime.Caller failed")
	}
	return filepath.Join(filepath.Dir(file), "..", "..", "..")
}

func mustRead(t *testing.T, path string) string {
	t.Helper()
	b, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	return string(b)
}
