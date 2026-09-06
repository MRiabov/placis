package main

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

const (
	nestedMax = 9
	rootMax   = 15
)

func checkFanout(root string) []string {
	var errs []string
	errs = append(errs, fanoutTree(root, "internal", true)...)
	errs = append(errs, fanoutTree(root, filepath.Join("frontend-3", "src"), true)...)
	return errs
}

func fanoutTree(root, rel string, isRoot bool) []string {
	dir := filepath.Join(root, rel)
	st, err := os.Stat(dir)
	if err != nil || !st.IsDir() {
		return nil
	}
	var errs []string
	entries, err := os.ReadDir(dir)
	if err != nil {
		return []string{fmt.Sprintf("%s: %v", slash(rel), err)}
	}
	n := 0
	var kids []fs.DirEntry
	for _, e := range entries {
		name := e.Name()
		if name == ".git" || name == "node_modules" || name == "testdata" {
			continue
		}
		if e.IsDir() {
			n++
			kids = append(kids, e)
			continue
		}
		if isTestName(name) {
			continue
		}
		n++
	}
	max := nestedMax
	if isRoot {
		max = rootMax
	}
	relSlash := slash(rel)
	if n > max {
		errs = append(errs, fmt.Sprintf("%s/: %d entries (max %d)", relSlash, n, max))
	}
	for _, k := range kids {
		child := filepath.Join(rel, k.Name())
		errs = append(errs, fanoutTree(root, child, false)...)
	}
	return errs
}

func isTestName(name string) bool {
	if strings.HasSuffix(name, "_test.go") {
		return true
	}
	return strings.Contains(name, ".test.") || strings.Contains(name, ".spec.")
}
