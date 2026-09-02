package main

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

func headingTitles(src string) []string {
	var out []string
	for _, m := range headingRe.FindAllStringSubmatch(src, -1) {
		out = append(out, strings.TrimSpace(m[1]))
	}
	return out
}

func leftoverHeadingErrs(path, rel string, heads []string, closed map[string]bool, leftover map[string][]string) []string {
	allowed := map[string]bool{}
	for _, t := range leftover[rel] {
		allowed[t] = true
	}
	have := map[string]bool{}
	var errs []string
	for _, h := range heads {
		have[h] = true
		if closed[h] {
			continue
		}
		if !allowed[h] {
			errs = append(errs, fmt.Sprintf("%s: extra heading ## %s", path, h))
		}
	}
	for _, t := range leftover[rel] {
		if !have[t] {
			errs = append(errs, fmt.Sprintf("%s: leftover heading ## %s is gone; remove it from the leftover list", path, t))
		}
	}
	return errs
}

func relToRoot(root, path string) string {
	rel, err := filepath.Rel(root, path)
	if err != nil {
		return filepath.ToSlash(path)
	}
	return filepath.ToSlash(rel)
}

func parseHeadingFile(root, path string) (headingFile, error) {
	src, err := os.ReadFile(path)
	if err != nil {
		return headingFile{}, err
	}
	text := string(src)
	return headingFile{
		path:  filepath.ToSlash(path),
		rel:   relToRoot(root, path),
		heads: headingTitles(text),
		h3:    h3Titles(text),
		atx:   atxHeads(text),
	}, nil
}

var (
	h3Re  = regexp.MustCompile(`(?m)^### (.+)$`)
	atxRe = regexp.MustCompile(`(?m)^(#{2,4}) (.+)$`)
)

func atxHeads(src string) []atxHead {
	var out []atxHead
	for _, m := range atxRe.FindAllStringSubmatch(src, -1) {
		out = append(out, atxHead{
			level: len(m[1]),
			title: strings.TrimSpace(m[2]),
		})
	}
	return out
}

func h3Titles(src string) []string {
	var out []string
	for _, m := range h3Re.FindAllStringSubmatch(src, -1) {
		out = append(out, strings.TrimSpace(m[1]))
	}
	return out
}

func isFeatureTesting(slash string) bool {
	if !strings.HasSuffix(slash, "/testing.md") {
		return false
	}
	return !strings.Contains(slash, "/pipeline/testing/")
}
