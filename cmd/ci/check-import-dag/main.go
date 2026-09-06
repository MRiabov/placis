package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintf(os.Stderr, "check-import-dag: %v\n", err)
		os.Exit(1)
	}
}

func run(args []string) error {
	flags := flag.NewFlagSet("check-import-dag", flag.ContinueOnError)
	all := flags.Bool("all", false, "scan trees instead of listed files")
	root := flags.String("root", ".", "repo root")
	if err := flags.Parse(args); err != nil {
		return err
	}
	abs, err := filepath.Abs(*root)
	if err != nil {
		return err
	}
	files := flags.Args()
	if *all || len(files) == 0 {
		files, err = collect(abs)
		if err != nil {
			return err
		}
	} else {
		var resolved []string
		for _, f := range files {
			if !filepath.IsAbs(f) {
				f = filepath.Join(abs, f)
			}
			resolved = append(resolved, f)
		}
		files = resolved
	}
	var errs []string
	errs = append(errs, checkGoImports(abs, files)...)
	errs = append(errs, checkTSImports(abs, files)...)
	if len(errs) == 0 {
		return nil
	}
	for _, e := range errs {
		fmt.Fprintln(os.Stderr, e)
	}
	return fmt.Errorf("%d check-import-dag error(s)", len(errs))
}
