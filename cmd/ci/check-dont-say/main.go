package main

import (
	"flag"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintf(os.Stderr, "check-dont-say: %v\n", err)
		os.Exit(1)
	}
}

func run(args []string) error {
	flags := flag.NewFlagSet("check-dont-say", flag.ContinueOnError)
	all := flags.Bool("all", false, "scan enabled trees instead of listed files")
	frontend := flags.Bool("frontend", false, "include frontend-2")
	glossaryPath := flags.String("glossary", "docs/glossary.md", "path to glossary.md")
	rootsFlag := flags.String("roots", "", "comma-separated scan roots (default: built-in list)")
	if err := flags.Parse(args); err != nil {
		return err
	}

	overrideRoots := splitRoots(*rootsFlag)
	if overrideRoots != nil {
		prev := defaultRoots
		defaultRoots = overrideRoots
		defer func() { defaultRoots = prev }()
	}

	src, err := os.ReadFile(*glossaryPath)
	if err != nil {
		return fmt.Errorf("read glossary: %w", err)
	}
	tokens, err := parseDontSayTable(string(src))
	if err != nil {
		return err
	}
	compiled, err := compileTokens(tokens)
	if err != nil {
		return err
	}

	files := flags.Args()
	scanAll := *all || len(files) == 0 || glossaryStaged(files, *glossaryPath)
	if scanAll {
		var err error
		files, err = collectFiles(*frontend)
		if err != nil {
			return err
		}
	} else {
		files = filterEnabledFiles(files, *frontend)
	}

	var hits []hit
	for _, path := range files {
		if shouldSkipPath(path, *frontend) {
			continue
		}
		if !scanExt(path, *frontend) {
			continue
		}
		found, err := scanFile(path, compiled)
		if err != nil {
			return err
		}
		hits = append(hits, found...)
	}

	if len(hits) == 0 {
		return nil
	}
	for _, h := range hits {
		fmt.Fprintf(os.Stderr, "%s:%d: don't say %q (say %s)\n  %s\n", h.path, h.line, h.tok.phrase, h.tok.say, h.text)
	}
	return fmt.Errorf("%d Don't-say hit(s)", len(hits))
}

func splitRoots(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	var roots []string
	for _, part := range strings.Split(raw, ",") {
		part = strings.TrimSpace(part)
		if part != "" {
			roots = append(roots, part)
		}
	}
	return roots
}

func glossaryStaged(files []string, glossaryPath string) bool {
	want := filepath.ToSlash(glossaryPath)
	for _, f := range files {
		slash := filepath.ToSlash(f)
		if slash == want || strings.HasSuffix(slash, "/"+want) {
			return true
		}
	}
	return false
}

func filterEnabledFiles(files []string, frontend bool) []string {
	var kept []string
	for _, path := range files {
		if inEnabledTree(path, frontend) {
			kept = append(kept, path)
		}
	}
	return kept
}

func collectFiles(frontend bool) ([]string, error) {
	var files []string
	for _, root := range enabledRoots(frontend) {
		if _, err := os.Stat(root); err != nil {
			continue
		}
		err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
			if err != nil {
				return err
			}
			if d.IsDir() {
				return nil
			}
			if shouldSkipPath(path, frontend) {
				return nil
			}
			if scanExt(path, frontend) {
				files = append(files, path)
			}
			return nil
		})
		if err != nil {
			return nil, err
		}
	}
	return files, nil
}
