package main

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"unicode"
)

var defaultRoots = []string{
	"docs",
	"internal",
	"cmd",
	"migrations",
	"catalog",
	"apps/contractor-website",
	"apps/placis-website",
	"scripts",
	"apps/demo",
	"src",
}

type compiledToken struct {
	token
	re     *regexp.Regexp
	needle string
}

type hit struct {
	path string
	line int
	tok  compiledToken
	text string
}

func compileTokens(tokens []token) ([]compiledToken, error) {
	out := make([]compiledToken, 0, len(tokens)*2)
	for _, tok := range tokens {
		phrases := []string{tok.phrase}
		if strings.Contains(tok.raw, "(d)") && !strings.HasSuffix(strings.ToLower(tok.phrase), "d") {
			phrases = append(phrases, tok.phrase+"d")
		}
		var idents []string
		if tok.class == classAlways || tok.class == classHome {
			for _, p := range phrases {
				idents = append(idents, identifierVariants(p)...)
			}
		}
		seen := map[string]bool{}
		add := func(p string, identifier bool) error {
			key := strings.ToLower(p)
			if p == "" || seen[key] {
				return nil
			}
			seen[key] = true
			re, err := compilePhrase(p, identifier)
			if err != nil {
				return fmt.Errorf("%q: %w", p, err)
			}
			out = append(out, compiledToken{token: tok, re: re, needle: literalNeedle(p)})
			return nil
		}
		for _, p := range phrases {
			if err := add(p, false); err != nil {
				return nil, err
			}
		}
		for _, p := range idents {
			if err := add(p, true); err != nil {
				return nil, err
			}
		}
	}
	return out, nil
}

func literalNeedle(phrase string) string {
	lower := strings.ToLower(phrase)
	if i := strings.IndexAny(lower, " \t"); i > 0 {
		return lower[:i]
	}
	return lower
}

func compilePhrase(phrase string, identifier bool) (*regexp.Regexp, error) {
	if identifier || isIdentifier(phrase) {
		return regexp.Compile(`(?i)\b` + regexp.QuoteMeta(phrase) + `\b`)
	}
	parts := strings.Fields(phrase)
	quoted := make([]string, len(parts))
	for i, p := range parts {
		quoted[i] = regexp.QuoteMeta(p)
	}
	return regexp.Compile(`(?i)\b` + strings.Join(quoted, `[[:space:]]+`) + `\b`)
}

func isIdentifier(phrase string) bool {
	if strings.Contains(phrase, " ") {
		return false
	}
	hasUpper := false
	hasUnderscore := false
	for _, r := range phrase {
		switch {
		case r == '_' || r == '-':
			hasUnderscore = true
		case unicode.IsUpper(r):
			hasUpper = true
		}
	}
	return hasUpper || hasUnderscore
}

func isProductDoc(path string) bool {
	base := filepath.Base(path)
	slash := filepath.ToSlash(path)
	return base == "prd.md" || base == "frontend.md" || slash == "docs/README.md" || strings.HasSuffix(slash, "/docs/README.md")
}

func isPRDOrFrontend(path string) bool {
	base := filepath.Base(path)
	return base == "prd.md" || base == "frontend.md"
}

func homePrefixes(home string) []string {
	switch home {
	case "media":
		return []string{"docs/features/other/media", "internal/media"}
	case "details":
		return []string{"docs/features/business-profile/details", "internal/details"}
	case "website":
		return []string{"docs/features/website", "internal/website", "apps/contractor-website"}
	case "projects":
		return []string{"docs/features/business-profile/projects", "internal/projects"}
	case "assistant":
		return []string{"docs/features/assistant", "internal/assistant"}
	default:
		return []string{"docs/features/" + home, "internal/" + home}
	}
}

func isLookApp(slash string) bool {
	slash = strings.TrimPrefix(slash, "./")
	return slash == "apps/demo" || strings.HasPrefix(slash, "apps/demo/") ||
		slash == "src" || strings.HasPrefix(slash, "src/")
}

func pathUnder(slash, folder string) bool {
	return slash == folder || strings.HasPrefix(slash, folder+"/") || strings.Contains(slash, "/"+folder+"/")
}

func inHome(path string, homes []string) bool {
	if len(homes) == 0 || isPRDOrFrontend(path) {
		return false
	}
	slash := filepath.ToSlash(path)
	if isLookApp(slash) {
		return true
	}
	for _, home := range homes {
		for _, folder := range homePrefixes(home) {
			if pathUnder(slash, folder) {
				return true
			}
		}
	}
	return false
}

func isTestingDoc(path string) bool {
	slash := filepath.ToSlash(path)
	if !strings.HasSuffix(strings.ToLower(slash), ".md") {
		return false
	}
	base := filepath.Base(slash)
	return base == "testing.md" || strings.Contains(slash, "/testing/")
}

func appliesTo(tok compiledToken, path string) bool {
	if strings.EqualFold(tok.phrase, "setup") && isTestingDoc(path) {
		return false
	}
	switch tok.class {
	case classAlways:
		return true
	case classHome:
		return !inHome(path, tok.homes)
	case classProductDocsOnly:
		return isProductDoc(path)
	default:
		return false
	}
}

func enabledRoots(frontend bool) []string {
	roots := append([]string{}, defaultRoots...)
	if frontend {
		roots = append(roots, "frontend-2")
	}
	return roots
}

func inEnabledTree(path string, frontend bool) bool {
	slash := strings.TrimPrefix(filepath.ToSlash(path), "./")
	if filepath.IsAbs(path) {
		if wd, err := os.Getwd(); err == nil {
			if rel, err := filepath.Rel(wd, path); err == nil && !strings.HasPrefix(rel, "..") {
				slash = strings.TrimPrefix(filepath.ToSlash(rel), "./")
			}
		}
	}
	for _, root := range enabledRoots(frontend) {
		if slash == root || strings.HasPrefix(slash, root+"/") {
			return true
		}
	}
	return false
}

func scanExt(path string, frontend bool) bool {
	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".md", ".go", ".mjs", ".js":
		return true
	case ".ts", ".tsx":
		return frontend || isLookApp(filepath.ToSlash(path))
	default:
		return false
	}
}

func shouldSkipPath(path string, frontend bool) bool {
	if !inEnabledTree(path, frontend) {
		return true
	}
	slash := filepath.ToSlash(path)
	base := filepath.Base(slash)
	switch {
	case slash == "docs/glossary.md" || strings.HasSuffix(slash, "/docs/glossary.md"):
		return true
	case base == "glossary.md":
		return true
	case strings.Contains(slash, "/.agents/") || strings.HasPrefix(slash, ".agents/"):
		return true
	case strings.Contains(slash, "/dist/") || strings.HasPrefix(slash, "dist/"):
		return true
	case strings.Contains(slash, "/node_modules/") || strings.HasPrefix(slash, "node_modules/"):
		return true
	case strings.Contains(slash, "/.astro/") || strings.HasPrefix(slash, ".astro/"):
		return true
	case strings.Contains(slash, "cmd/ci/check-dont-say/") || strings.Contains(slash, "ci/check-dont-say/"):
		return true
	case strings.Contains(slash, "/testdata/") || strings.HasPrefix(slash, "testdata/"):
		return true
	case strings.HasSuffix(slash, "generated/api-types.ts"):
		return true
	default:
		return false
	}
}

var extraAllowed = []string{
	"the cms",
	"/cms",
	"ai use ledger",
	"usage credit",
	"usage credits",
	"extra usage credit",
	"extra usage credits",
	"enterprise add-on",
	"later, enterprise",
	"agency credit line",
	"account menu",
	"user icon",
	"placis pro plus plan",
	"placis pro max plan",
	"placis pro plan",
	"/v1/me/organization",
	"credit / finance",
	"apps/contractor-website",
	"/cms/proof",
	"site_manifest.v1",
	"site_page.v1",
	"clerk organization",
	"ideal customer profile",
	"ideal customer",
	"walking skeleton",
	"signed url",
	"signed urls",
	"signed-in",
	"signed-out",
	"signed in",
	"signed out",
	"facebook page",
	"facebook pages",
	"business portfolio",
	"system user",
	"system users",
	"user token",
	"user tokens",
	"user access token",
	"facebook user",
	"instagram user",
	"clerk user",
	"clerk users",
	"playwright page",
	"actions/setup-go",
	"preview.placis.com",
	"dashboard|preview|support|setup",
	"session: false",
	"http header",
	"request header",
	"response header",
	"idempotency-key header",
	"client interview",
	"empty state",
	"loading state",
	"user stories",
	"user story",
	"phone number",
	"media picker",
	"media caption",
	"media library",
	"media package",
	"media asset",
	"media assets",
	"media item",
	"media items",
	"ad states",
	"ad state",
	"state registry",
	"us state",
	"onboarding session",
	"preview website address",
	"preview website addresses",
	"online research consent",
	"research conflict",
	"research conflicts",
	"react-dom/client",
	"vite/client",
	"sessionstorage",
	"session storage",
	"go client",
	"http client",
	"api client",
	"sdk client",
	"llm client",
	"stripe client",
	"checkout session",
	"checkout sessions",
	"stripe session",
	"stripe sessions",
	"signed jwt",
	"signed jwts",
	"signed token",
	"signed tokens",
	"testing tokens",
	"clerk session",
	"jwt session",
	"org claim",
	"organization claim",
	"user-visible",
	"user visible",
	"(website)",
	"(ads)",
	"(onboarding)",
	"(media)",
	"(details)",
	"(billing)",
	"above the fold",
	"below the fold",
	`"bytes"`,
	"bytes.",
	"/blob/",
	"new blob",
	".blob(",
	"prompt catalog",
	"checkout.session",
	"openapi-fetch client",
	"google chrome",
	"**preview**",
	"desktop chrome",
	"chrome devtools",
	"headless chrome",
	"session.update",
	"company registry record",
	"company registry records",
}

func inheritsDontSayContext(line string) bool {
	trim := strings.TrimLeft(line, " \t")
	if trim == "" || strings.HasPrefix(trim, "#") {
		return false
	}
	if strings.HasPrefix(trim, "- ") || strings.HasPrefix(trim, "* ") || strings.HasPrefix(trim, "+ ") {
		return false
	}
	i := 0
	for i < len(trim) && trim[i] >= '0' && trim[i] <= '9' {
		i++
	}
	if i > 0 && i+1 < len(trim) && trim[i] == '.' && trim[i+1] == ' ' {
		return false
	}
	return true
}

func allowedOnLine(tok compiledToken, line string) bool {
	lower := strings.ToLower(line)
	if strings.Contains(lower, "never say") || strings.Contains(lower, "do not say") || strings.Contains(lower, "don't say") || strings.Contains(lower, "never \"") {
		return true
	}
	if tok.phrase == "claim" || strings.EqualFold(tok.phrase, "website claim") {
		if strings.Contains(lower, "organization claim") || strings.Contains(lower, "jwt") {
			return true
		}
	}
	if tok.phrase == "state" && strings.Contains(line, ".state") {
		return true
	}
	if tok.phrase == "provider" && strings.Contains(line, ".Provider") {
		return true
	}
	if tok.phrase == "shell" && (strings.Contains(lower, "unix") || strings.Contains(lower, "railway") || strings.Contains(lower, "database")) {
		return true
	}
	if tok.phrase == "client" && (strings.Contains(lower, "vite/client") || strings.Contains(lower, "react-dom/client")) {
		return true
	}
	if tok.phrase == "header" && (strings.Contains(lower, "<header") || strings.Contains(lower, "</header>")) {
		return true
	}
	if tok.phrase == "chrome" && (strings.Contains(lower, "google") || strings.Contains(lower, "devtools") || strings.Contains(lower, "playwright") || strings.Contains(lower, "desktop chrome")) {
		return true
	}
	if strings.EqualFold(tok.phrase, "OnCall") && (strings.Contains(lower, "predecessor") || strings.Contains(lower, "repo")) {
		return true
	}
	if tok.phrase == "header" && strings.Contains(lower, "header") && (strings.Contains(lower, "http") || strings.Contains(lower, "idempotency")) {
		return true
	}
	return false
}

func inSlashPath(line string, start, end int) bool {
	if start > 0 {
		switch line[start-1] {
		case '/', '{':
			return true
		}
	}
	if end < len(line) {
		switch line[end] {
		case '/', '}':
			return true
		}
	}
	return false
}

func coveredByAllowed(line string, start, end int, tok compiledToken) bool {
	allowed := append([]string{}, extraAllowed...)
	allowed = append(allowed, tok.covers...)
	var expanded []string
	for _, phrase := range allowed {
		expanded = append(expanded, phrase)
		if strings.Contains(phrase, " ") {
			expanded = append(expanded, strings.ReplaceAll(phrase, " ", "-"))
		}
	}
	lower := strings.ToLower(line)
	for _, phrase := range expanded {
		from := 0
		for {
			i := strings.Index(lower[from:], phrase)
			if i < 0 {
				break
			}
			i += from
			j := i + len(phrase)
			if i <= start && end <= j {
				return true
			}
			from = i + 1
		}
	}
	return false
}

func tokensForPath(path string, compiled []compiledToken) []compiledToken {
	out := make([]compiledToken, 0, len(compiled))
	for _, tok := range compiled {
		if appliesTo(tok, path) {
			out = append(out, tok)
		}
	}
	return out
}

func scanFile(path string, compiled []compiledToken) ([]hit, error) {
	applicable := tokensForPath(path, compiled)
	if len(applicable) == 0 {
		return nil, nil
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	lines := strings.Split(string(data), "\n")
	var hits []hit
	for i, line := range lines {
		lower := strings.ToLower(line)
		prev := ""
		if i > 0 {
			prev = lines[i-1]
		}
		var window string
		var mapSpan func(start, end int) (int, int, bool)
		windowReady := false
		for _, tok := range applicable {
			if tok.needle != "" && !strings.Contains(lower, tok.needle) {
				continue
			}
			if allowedOnLine(tok, line) || (inheritsDontSayContext(line) && allowedOnLine(tok, prev)) {
				continue
			}
			locs := tok.re.FindAllStringIndex(line, -1)
			if locs == nil {
				continue
			}
			if !windowReady {
				next := ""
				if i+1 < len(lines) {
					next = lines[i+1]
				}
				window, mapSpan = coveringWindow(prev, line, next)
				windowReady = true
			}
			hitLine := false
			for _, loc := range locs {
				if tok.class == classHome && inSlashPath(line, loc[0], loc[1]) {
					continue
				}
				wStart, wEnd, ok := mapSpan(loc[0], loc[1])
				if ok && coveredByAllowed(window, wStart, wEnd, tok) {
					continue
				}
				hitLine = true
				break
			}
			if hitLine {
				hits = append(hits, hit{path: path, line: i + 1, tok: tok, text: strings.TrimSpace(line)})
			}
		}
	}
	return hits, nil
}

// coveringWindow joins the previous, current, and next source lines with
// single spaces (list/continuation indent stripped) so a covering Say split by
// rumdl wrap still covers the Don't-say token.
func coveringWindow(prev, line, next string) (string, func(start, end int) (int, int, bool)) {
	lead := len(line) - len(strings.TrimLeft(line, " \t"))
	var b strings.Builder
	off := 0
	if p := strings.TrimSpace(prev); p != "" {
		b.WriteString(p)
		b.WriteByte(' ')
		off = b.Len()
	}
	b.WriteString(strings.TrimSpace(line))
	if n := strings.TrimSpace(next); n != "" {
		b.WriteByte(' ')
		b.WriteString(n)
	}
	return b.String(), func(start, end int) (int, int, bool) {
		if start < lead || end < lead {
			return 0, 0, false
		}
		return off + (start - lead), off + (end - lead), true
	}
}
