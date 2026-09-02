package main

import (
	"strings"
	"testing"
)

func TestStepHappyPathNameNumbered(t *testing.T) {
	feature, token, canonical := stepHappyPathName("docs/features/website/pipeline/01-select-website-template.md")
	if feature != "Website" || token != "01" || canonical != "TestPipelineHappyPathWebsite01SelectWebsiteTemplate" {
		t.Fatalf("got %s %s %s", feature, token, canonical)
	}
}

func TestStepHappyPathName04a(t *testing.T) {
	feature, token, canonical := stepHappyPathName("docs/features/onboarding/pipeline/04a-text-client-interview.md")
	if feature != "Onboarding" || token != "04a" || canonical != "TestPipelineHappyPathOnboarding04aTextClientInterview" {
		t.Fatalf("got %s %s %s", feature, token, canonical)
	}
}

func TestStepHappyPathNameUnnumbered(t *testing.T) {
	feature, token, canonical := stepHappyPathName("docs/features/etl/pipeline/google-maps.md")
	if feature != "Etl" || token != "GoogleMaps" || canonical != "TestPipelineHappyPathEtlGoogleMaps" {
		t.Fatalf("got %s %s %s", feature, token, canonical)
	}
}

func TestPipelineHappyPathLeftoverOK(t *testing.T) {
	r := report{steps: []stepFile{{
		path:     "docs/features/website/pipeline/01-select-website-template.md",
		testPath: "docs/features/website/pipeline/testing/01-select-website-template.md",
	}}}
	need := "TestPipelineHappyPathWebsite01SelectWebsiteTemplate"
	full := "TestPipelineHappyPathWebsiteFull"
	errs := checkPipelineHappyPath(r, map[string]bool{}, []string{need, full})
	if len(errs) != 0 {
		t.Fatalf("leftover ok: %v", errs)
	}
}

func TestPipelineHappyPathMissingFails(t *testing.T) {
	r := report{steps: []stepFile{{
		path:     "docs/features/website/pipeline/01-select-website-template.md",
		testPath: "docs/features/website/pipeline/testing/01-select-website-template.md",
	}}}
	errs := checkPipelineHappyPath(r, map[string]bool{}, nil)
	joined := strings.Join(errs, "\n")
	if !strings.Contains(joined, "TestPipelineHappyPathWebsite01SelectWebsiteTemplate") {
		t.Fatalf("missing step: %v", errs)
	}
	if !strings.Contains(joined, "TestPipelineHappyPathWebsiteFull") {
		t.Fatalf("missing full: %v", errs)
	}
}

func TestPipelineHappyPathStaleLeftover(t *testing.T) {
	r := report{steps: []stepFile{{
		path:     "docs/features/website/pipeline/01-select-website-template.md",
		testPath: "docs/features/website/pipeline/testing/01-select-website-template.md",
	}}}
	funcs := map[string]bool{
		"TestPipelineHappyPathWebsite01SelectWebsiteTemplate": true,
		"TestPipelineHappyPathWebsiteFull":                    true,
	}
	need := "TestPipelineHappyPathWebsite01SelectWebsiteTemplate"
	full := "TestPipelineHappyPathWebsiteFull"
	errs := checkPipelineHappyPath(r, funcs, []string{need, full})
	joined := strings.Join(errs, "\n")
	if !strings.Contains(joined, "leftover") {
		t.Fatalf("stale leftover: %v", errs)
	}
}

func TestPipelineHappyPathLongerSuffixOK(t *testing.T) {
	r := report{steps: []stepFile{{
		path:     "docs/features/website/pipeline/01-select-website-template.md",
		testPath: "docs/features/website/pipeline/testing/01-select-website-template.md",
	}}}
	funcs := map[string]bool{
		"TestPipelineHappyPathWebsite01SelectWebsiteTemplateExtra": true,
		"TestPipelineHappyPathWebsiteFull":                         true,
	}
	if errs := checkPipelineHappyPath(r, funcs, nil); len(errs) != 0 {
		t.Fatalf("suffix: %v", errs)
	}
}

func TestSkipUnknownFeature(t *testing.T) {
	r := report{steps: []stepFile{{
		path:     "testdata/ok/sample/pipeline/01.md",
		testPath: "testdata/ok/sample/pipeline/testing/01.md",
	}}}
	if errs := checkPipelineHappyPath(r, map[string]bool{}, nil); len(errs) != 0 {
		t.Fatalf("sample: %v", errs)
	}
}
