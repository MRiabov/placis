package main

import (
	"fmt"
	"strings"
	"unicode"
)

const (
	dontSayHeading = "### Don't say"
	headerDontSay  = "don't say"
	headerSay      = "say"
)

type tokenClass int

const (
	classAlways tokenClass = iota
	classHome
	classProductDocsOnly
	classSkip
)

var knownHomes = []string{"website", "ads", "onboarding", "media", "details"}

type token struct {
	raw    string
	phrase string
	class  tokenClass
	homes  []string
	say    string
	covers []string
}

func parseDontSayTable(src string) ([]token, error) {
	start := strings.Index(src, dontSayHeading)
	if start < 0 {
		return nil, fmt.Errorf("glossary is missing %q", dontSayHeading)
	}
	rest := src[start+len(dontSayHeading):]
	endRel := strings.Index(rest, "\n## ")
	if endRel < 0 {
		return nil, fmt.Errorf("glossary Don't-say section does not end at a ## heading")
	}
	section := strings.TrimSpace(rest[:endRel])

	lines := strings.Split(section, "\n")
	headerIdx := -1
	for i, line := range lines {
		if isDontSayHeader(line) {
			headerIdx = i
			break
		}
	}
	if headerIdx < 0 {
		return nil, fmt.Errorf("Don't-say table is missing a %q | %q header", "Don't say", "Say")
	}
	if headerIdx+1 >= len(lines) || !isSeparatorRow(lines[headerIdx+1]) {
		return nil, fmt.Errorf("Don't-say table is missing a separator row")
	}

	var tokens []token
	for _, line := range lines[headerIdx+2:] {
		line = strings.TrimSpace(line)
		if line == "" || !strings.HasPrefix(line, "|") {
			continue
		}
		left, right, ok := splitTableRow(line)
		if !ok {
			return nil, fmt.Errorf("Don't-say table row is not parseable: %s", line)
		}
		if isOpsRow(left) {
			continue
		}
		for _, part := range strings.Split(left, " / ") {
			tok := classifyToken(strings.TrimSpace(part), right)
			if tok.class == classSkip || tok.phrase == "" {
				continue
			}
			tokens = append(tokens, tok)
		}
	}
	if len(tokens) == 0 {
		return nil, fmt.Errorf("Don't-say table has no data rows")
	}
	return tokens, nil
}

func isDontSayHeader(line string) bool {
	left, right, ok := splitTableRow(line)
	if !ok {
		return false
	}
	return strings.EqualFold(left, headerDontSay) && strings.EqualFold(right, headerSay)
}

func isSeparatorRow(line string) bool {
	line = strings.TrimSpace(line)
	if !strings.HasPrefix(line, "|") {
		return false
	}
	for _, cell := range strings.Split(strings.Trim(line, "|"), "|") {
		cell = strings.TrimSpace(cell)
		if cell == "" {
			continue
		}
		for _, r := range cell {
			if r != '-' && r != ':' && r != ' ' {
				return false
			}
		}
	}
	return strings.Contains(line, "---")
}

func splitTableRow(line string) (string, string, bool) {
	line = strings.TrimSpace(line)
	if !strings.HasPrefix(line, "|") {
		return "", "", false
	}
	parts := strings.Split(strings.Trim(line, "|"), "|")
	if len(parts) < 2 {
		return "", "", false
	}
	return strings.TrimSpace(parts[0]), strings.TrimSpace(parts[1]), true
}

func isOpsRow(left string) bool {
	return strings.Contains(left, "Demo") && strings.Contains(left, "Projection")
}

func classifyToken(raw, say string) token {
	tok := token{raw: raw, say: say}
	if raw == "" {
		tok.class = classSkip
		return tok
	}
	lowerRaw := strings.ToLower(raw)
	prdOnly := strings.Contains(lowerRaw, "(in a prd)")
	backticked := strings.Contains(raw, "`")
	phrase := normalizePhrase(raw)
	tok.phrase = phrase
	if phrase == "" {
		tok.class = classSkip
		return tok
	}
	homes := homesFromParens(parentheticals(raw))
	switch {
	case backticked, prdOnly:
		tok.class = classProductDocsOnly
	case len(homes) > 0:
		tok.class = classHome
		tok.homes = homes
	default:
		tok.class = classAlways
	}
	tok.covers = coveringPhrases(normalizePhrase(say))
	return tok
}

func coveringPhrases(say string) []string {
	say = strings.NewReplacer("—", ",", "–", ",").Replace(say)
	parts := []string{say}
	for _, sep := range []string{" / ", ";", ",", " or ", ": "} {
		var next []string
		for _, p := range parts {
			next = append(next, strings.Split(p, sep)...)
		}
		parts = next
	}
	seen := map[string]bool{}
	var out []string
	add := func(p string) {
		p = strings.ToLower(strings.Trim(strings.TrimSpace(p), "`"))
		if p == "" || seen[p] {
			return
		}
		seen[p] = true
		out = append(out, p)
	}
	for _, p := range parts {
		add(p)
		if p != "" && !strings.HasSuffix(strings.ToLower(strings.TrimSpace(p)), "s") {
			add(strings.TrimSpace(p) + "s")
		}
	}
	return out
}

func parentheticals(raw string) []string {
	var out []string
	start := -1
	for i, r := range raw {
		switch {
		case r == '(':
			start = i + 1
		case r == ')' && start >= 0:
			out = append(out, strings.TrimSpace(raw[start:i]))
			start = -1
		}
	}
	return out
}

func homesFromParens(parens []string) []string {
	seen := map[string]bool{}
	var homes []string
	for _, p := range parens {
		if strings.EqualFold(strings.TrimSpace(p), "in a prd") {
			continue
		}
		for _, part := range strings.Split(p, ",") {
			part = strings.ToLower(strings.TrimSpace(part))
			if part == "bare" || part == "d" {
				continue
			}
			for _, h := range knownHomes {
				if part == h && !seen[h] {
					seen[h] = true
					homes = append(homes, h)
				}
			}
		}
	}
	return homes
}

func normalizePhrase(raw string) string {
	s := strings.ReplaceAll(raw, "`", "")
	var b strings.Builder
	skip := false
	for _, r := range s {
		switch {
		case r == '(':
			skip = true
		case r == ')':
			skip = false
		case skip:
			continue
		default:
			b.WriteRune(r)
		}
	}
	return strings.Join(strings.Fields(strings.TrimSpace(b.String())), " ")
}

func identifierVariants(phrase string) []string {
	words := strings.Fields(strings.ToLower(phrase))
	if len(words) < 2 {
		return nil
	}
	snake := strings.Join(words, "_")
	kebab := strings.Join(words, "-")
	var pascal, camel strings.Builder
	for i, w := range words {
		title := titleWord(w)
		pascal.WriteString(title)
		if i == 0 {
			camel.WriteString(w)
		} else {
			camel.WriteString(title)
		}
	}
	out := []string{snake, kebab, pascal.String(), camel.String()}
	seen := map[string]bool{}
	var uniq []string
	for _, v := range out {
		if v == "" || seen[v] {
			continue
		}
		seen[v] = true
		uniq = append(uniq, v)
	}
	return uniq
}

func titleWord(w string) string {
	rs := []rune(w)
	if len(rs) == 0 {
		return w
	}
	rs[0] = unicode.ToUpper(rs[0])
	return string(rs)
}
