package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestScanAppliesTiers(t *testing.T) {
	src := mustRead(t, "testdata/glossary.md")
	tokens, err := parseDontSayTable(src)
	if err != nil {
		t.Fatal(err)
	}
	compiled, err := compileTokens(tokens)
	if err != nil {
		t.Fatal(err)
	}

	prd := filepath.Join("testdata", "prd.md")
	arch := filepath.Join("testdata", "architecture.md")
	if err := os.WriteFile(prd, []byte("A marketing claim and a menu and header.\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(arch, []byte("A marketing claim and a menu and header.\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		_ = os.Remove(prd)
		_ = os.Remove(arch)
	})

	prdHits, err := scanFile(prd, compiled)
	if err != nil {
		t.Fatal(err)
	}
	archHits, err := scanFile(arch, compiled)
	if err != nil {
		t.Fatal(err)
	}

	prdPhrases := hitPhrases(prdHits)
	archPhrases := hitPhrases(archHits)
	if !prdPhrases["marketing claim"] || !prdPhrases["menu"] || !prdPhrases["header"] {
		t.Fatalf("prd hits %v", prdPhrases)
	}
	if !archPhrases["marketing claim"] || !archPhrases["header"] || !archPhrases["menu"] {
		t.Fatalf("architecture outside website home should ban menu, got %v", archPhrases)
	}
}

func TestScanInflectedIdentifier(t *testing.T) {
	tokens := []token{{phrase: "marketing claim", class: classAlways}}
	compiled, err := compileTokens(tokens)
	if err != nil {
		t.Fatal(err)
	}
	path := filepath.Join("testdata", "sample.go")
	if err := os.WriteFile(path, []byte("type MarketingClaim struct {}\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Remove(path) })
	hits, err := scanFile(path, compiled)
	if err != nil {
		t.Fatal(err)
	}
	if len(hits) == 0 {
		t.Fatal("expected MarketingClaim hit")
	}
}

func TestAllowedClerkClaim(t *testing.T) {
	tokens := []token{{phrase: "claim", class: classAlways}}
	compiled, err := compileTokens(tokens)
	if err != nil {
		t.Fatal(err)
	}
	path := filepath.Join("testdata", "jwt.md")
	if err := os.WriteFile(path, []byte("The Clerk JWT organization claim is not a marketing statement.\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Remove(path) })
	hits, err := scanFile(path, compiled)
	if err != nil {
		t.Fatal(err)
	}
	if len(hits) != 0 {
		t.Fatalf("JWT organization claim should be allowed, got %v", hits)
	}
}

func TestAllowedAboveTheFold(t *testing.T) {
	tokens := []token{{phrase: "fold", class: classAlways}}
	compiled, err := compileTokens(tokens)
	if err != nil {
		t.Fatal(err)
	}
	path := filepath.Join("testdata", "hero.md")
	if err := os.WriteFile(path, []byte("Keep conversion copy above the fold.\nDo not write the fold.\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Remove(path) })
	hits, err := scanFile(path, compiled)
	if err != nil {
		t.Fatal(err)
	}
	phrases := hitPhrases(hits)
	if len(hits) != 1 || !phrases["fold"] {
		t.Fatalf("expected only the bare fold line, got %v", hits)
	}
}

func TestCoveredSayPhrase(t *testing.T) {
	tokens := []token{classifyToken("page (website)", "website page")}
	compiled, err := compileTokens(tokens)
	if err != nil {
		t.Fatal(err)
	}
	path := filepath.Join("testdata", "prd.md")
	if err := os.WriteFile(path, []byte("Keep ads separate from website page editing.\nBare page leftover.\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Remove(path) })
	hits, err := scanFile(path, compiled)
	if err != nil {
		t.Fatal(err)
	}
	phrases := hitPhrases(hits)
	if len(hits) != 1 || !phrases["page"] {
		t.Fatalf("expected only the bare page line, got %v", hits)
	}
}

func TestMarkdownDoesNotUseIdentifierInflection(t *testing.T) {
	tokens := []token{classifyToken("public site", "contractor website")}
	compiled, err := compileTokens(tokens)
	if err != nil {
		t.Fatal(err)
	}
	path := filepath.Join("testdata", "architecture.md")
	if err := os.WriteFile(path, []byte("Serve from `apps/contractor-website` and store a website_manifest.\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Remove(path) })
	hits, err := scanFile(path, compiled)
	if err != nil {
		t.Fatal(err)
	}
	if len(hits) != 0 {
		t.Fatalf("path and snake names should not match in markdown, got %v", hits)
	}
}

func TestBackticksDoNotHideBannedPhrases(t *testing.T) {
	tokens := []token{{phrase: "marketing claim", class: classAlways}}
	compiled, err := compileTokens(tokens)
	if err != nil {
		t.Fatal(err)
	}
	path := filepath.Join("testdata", "prd.md")
	if err := os.WriteFile(path, []byte("Do not name a type `MarketingClaim`.\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Remove(path) })
	hits, err := scanFile(path, compiled)
	if err != nil {
		t.Fatal(err)
	}
	if len(hits) == 0 {
		t.Fatal("backticks must not hide identifier inflections")
	}
}

func TestBareTokenInRoutePath(t *testing.T) {
	tokens := []token{classifyToken("interview (onboarding)", "client interview")}
	compiled, err := compileTokens(tokens)
	if err != nil {
		t.Fatal(err)
	}
	path := filepath.Join("testdata", "prd.md")
	if err := os.WriteFile(path, []byte("Client interview lives at `/onboarding/interview`.\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Remove(path) })
	hits, err := scanFile(path, compiled)
	if err != nil {
		t.Fatal(err)
	}
	if len(hits) != 0 {
		t.Fatalf("bare tokens in URL paths should be skipped, got %v", hits)
	}
}

func TestAlwaysBanIdentifierInDocsPath(t *testing.T) {
	tokens := []token{classifyToken("public site", "contractor website")}
	compiled, err := compileTokens(tokens)
	if err != nil {
		t.Fatal(err)
	}
	path := filepath.Join("testdata", "architecture.md")
	if err := os.WriteFile(path, []byte("Do not keep `packages/public-site-components/` as the name.\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Remove(path) })
	hits, err := scanFile(path, compiled)
	if err != nil {
		t.Fatal(err)
	}
	if len(hits) == 0 {
		t.Fatal("always-ban inflections in paths must still fail")
	}
}

func TestHomeScopedPage(t *testing.T) {
	tokens := []token{classifyToken("page (website)", "website page")}
	compiled, err := compileTokens(tokens)
	if err != nil {
		t.Fatal(err)
	}
	write := func(path, body string) {
		t.Helper()
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
			t.Fatal(err)
		}
		t.Cleanup(func() { _ = os.Remove(path) })
	}
	cases := []struct {
		path    string
		body    string
		wantHit bool
	}{
		{"testdata/docs/features/website/architecture.md", "each page has sections\n", false},
		{"testdata/docs/features/website/prd.md", "each page has sections\n", true},
		{"testdata/docs/features/website/frontend.md", "each page has sections\n", true},
		{"testdata/docs/features/onboarding/pipeline/04.md", "create the page\n", true},
		{"testdata/docs/features/ads/ad-generation/technical-implementation.md", "landing page\n", true},
		{"testdata/docs/features/ads/ad-generation/technical-implementation.md", "website page\n", false},
		{"testdata/docs/features/website/architecture.md", "route `/preview/page`\n", false},
		{"testdata/internal/website/page.go", "type Page struct {}\n", false},
		{"testdata/internal/ads/page.go", "type Page struct {}\n", true},
		{"testdata/apps/contractor-website/src/page.go", "each page has sections\n", false},
		{"testdata/apps/placis-website/README.md", "each page has sections\n", true},
	}
	seen := map[string]int{}
	for _, tc := range cases {
		seen[tc.path]++
		path := tc.path
		if seen[path] > 1 {
			path = filepath.Join(filepath.Dir(tc.path), fmt.Sprintf("extra-%d%s", seen[path], filepath.Ext(tc.path)))
			write(path, tc.body)
		} else {
			write(path, tc.body)
		}
		hits, err := scanFile(path, compiled)
		if err != nil {
			t.Fatal(err)
		}
		got := len(hits) > 0
		if got != tc.wantHit {
			t.Errorf("%s %q: hit=%v want %v (%v)", tc.path, strings.TrimSpace(tc.body), got, tc.wantHit, hits)
		}
	}
}

func TestSlugAlwaysBanInHome(t *testing.T) {
	tokens := []token{classifyToken("slug", "website address")}
	compiled, err := compileTokens(tokens)
	if err != nil {
		t.Fatal(err)
	}
	path := filepath.Join("testdata", "docs", "features", "website", "slug.md")
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte("store the slug and a `Slug` type\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Remove(path) })
	hits, err := scanFile(path, compiled)
	if err != nil {
		t.Fatal(err)
	}
	if len(hits) == 0 {
		t.Fatal("slug must fail even in website technical docs")
	}
}

func TestHomeScopedPostingAndInterview(t *testing.T) {
	posting := classifyToken("posting (ads)", "ad posting")
	interview := classifyToken("interview (onboarding)", "client interview")
	compiled, err := compileTokens([]token{posting, interview})
	if err != nil {
		t.Fatal(err)
	}
	writeScan := func(path, body string) []hit {
		t.Helper()
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
			t.Fatal(err)
		}
		t.Cleanup(func() { _ = os.Remove(path) })
		hits, err := scanFile(path, compiled)
		if err != nil {
			t.Fatal(err)
		}
		return hits
	}
	if hits := writeScan("testdata/docs/features/ads/ad-generation/technical-implementation.md", "move the posting\n"); len(hits) != 0 {
		t.Fatalf("ads technical posting should pass, got %v", hits)
	}
	if hits := writeScan("testdata/docs/features/website/architecture.md", "the posting\n"); len(hits) == 0 {
		t.Fatal("website architecture posting should fail")
	}
	if hits := writeScan("testdata/docs/features/ads/ad-generation/prd.md", "the posting\n"); len(hits) == 0 {
		t.Fatal("ads PRD posting should fail")
	}
	if hits := writeScan("testdata/docs/features/onboarding/pipeline/01a.md", "after the interview\n"); len(hits) != 0 {
		t.Fatalf("onboarding interview should pass, got %v", hits)
	}
	if hits := writeScan("testdata/docs/features/website/editing.md", "after the interview\n"); len(hits) == 0 {
		t.Fatal("website editing interview should fail")
	}
	if hits := writeScan("testdata/docs/README.md", "interview\n"); len(hits) == 0 {
		t.Fatal("docs README interview should fail")
	}
}

func TestAdApplicationIsScanned(t *testing.T) {
	if shouldSkipPath("docs/features/ads/ad-application/meta/00-index.md", false) {
		t.Fatal("ad-application investigation notes should be scanned")
	}
	if shouldSkipPath("docs/features/ads/ad-generation/prd.md", false) {
		t.Fatal("ads product spec should still be scanned")
	}
}

func TestEnabledTrees(t *testing.T) {
	if !inEnabledTree("docs/features/ads/ad-generation/prd.md", false) {
		t.Fatal("docs should be enabled")
	}
	if !inEnabledTree("apps/contractor-website/README.md", false) {
		t.Fatal("contractor website should be enabled")
	}
	if !inEnabledTree("apps/placis-website/README.md", false) {
		t.Fatal("Placis website should be enabled")
	}
	if !inEnabledTree("scripts/deploy_contractor_website_cloudflare.mjs", false) {
		t.Fatal("scripts should be enabled")
	}
	if !scanExt("scripts/deploy_contractor_website_cloudflare.mjs", false) {
		t.Fatal("scripts .mjs should be scanned")
	}
	if inEnabledTree("packages/website-components/src/registry/hero/type_first/docs.md", false) {
		t.Fatal("packages markdown is outside enabled trees")
	}
	if inEnabledTree("frontend-2/src/x.md", false) {
		t.Fatal("frontend-2 stays off until --frontend")
	}
	if !inEnabledTree("frontend-2/src/x.md", true) {
		t.Fatal("frontend-2 should be enabled with --frontend")
	}
	if !shouldSkipPath("packages/website-components/src/registry/hero/type_first/docs.md", false) {
		t.Fatal("packages markdown should be skipped")
	}
	got := filterEnabledFiles([]string{
		"packages/website-components/src/x.md",
		"apps/contractor-website/README.md",
		"frontend-2/src/x.md",
	}, false)
	if len(got) != 1 || got[0] != "apps/contractor-website/README.md" {
		t.Fatalf("explicit filenames must stay in enabled trees, got %v", got)
	}
}

func TestGlossaryStagedSuffix(t *testing.T) {
	if !glossaryStaged([]string{"/tmp/repo/docs/glossary.md"}, "docs/glossary.md") {
		t.Fatal("absolute glossary path should count as staged")
	}
}

func TestSetupAllowedInTestingDocs(t *testing.T) {
	compiled, err := compileTokens([]token{classifyToken("setup", "onboarding")})
	if err != nil {
		t.Fatal(err)
	}
	writeScan := func(path, body string) []hit {
		t.Helper()
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
			t.Fatal(err)
		}
		t.Cleanup(func() { _ = os.Remove(path) })
		hits, err := scanFile(path, compiled)
		if err != nil {
			t.Fatal(err)
		}
		return hits
	}
	if hits := writeScan("testdata/docs/features/onboarding/pipeline/testing/01a.md", "- **Setup**: no Clerk sign-in.\n"); len(hits) != 0 {
		t.Fatalf("pipeline testing Setup should pass, got %v", hits)
	}
	if hits := writeScan("testdata/docs/features/onboarding/testing.md", "Setup the fixtures.\n"); len(hits) != 0 {
		t.Fatalf("feature testing.md setup should pass, got %v", hits)
	}
	if hits := writeScan("testdata/docs/features/onboarding/technical-implementation.md", "after setup\n"); len(hits) == 0 {
		t.Fatal("non-testing setup should fail")
	}
}

func hitPhrases(hits []hit) map[string]bool {
	out := map[string]bool{}
	for _, h := range hits {
		out[h.tok.phrase] = true
	}
	return out
}
