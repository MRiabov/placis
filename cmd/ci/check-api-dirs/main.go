package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintf(os.Stderr, "check-api-dirs: %v\n", err)
		os.Exit(1)
	}
}

func run(args []string) error {
	flags := flag.NewFlagSet("check-api-dirs", flag.ContinueOnError)
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
		files, err = collectFiles(abs)
		if err != nil {
			return err
		}
	} else {
		files = filterEnabled(abs, files)
	}

	var errs []string
	errs = append(errs, checkGo(abs, files)...)
	errs = append(errs, checkSQL(abs, files)...)
	errs = append(errs, checkTS(abs, files)...)
	if dirExists(filepath.Join(abs, "internal", "dto")) {
		errs = append(errs, "internal/dto/: do not add a shared DTO dump")
	}
	if len(errs) == 0 {
		return nil
	}
	for _, e := range errs {
		fmt.Fprintln(os.Stderr, e)
	}
	return fmt.Errorf("%d check-api-dirs error(s)", len(errs))
}
