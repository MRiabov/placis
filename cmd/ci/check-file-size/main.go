package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintf(os.Stderr, "check-file-size: %v\n", err)
		os.Exit(1)
	}
}

func run(args []string) error {
	flags := flag.NewFlagSet("check-file-size", flag.ContinueOnError)
	_ = flags.Bool("all", false, "scan whole trees (always)")
	root := flags.String("root", ".", "repo root")
	if err := flags.Parse(args); err != nil {
		return err
	}
	abs, err := filepath.Abs(*root)
	if err != nil {
		return err
	}
	var warns, errs []string
	warns, errs = checkSizes(abs)
	errs = append(errs, checkFanout(abs)...)
	for _, w := range warns {
		fmt.Fprintln(os.Stderr, "check-file-size: warning: "+w)
	}
	if len(errs) == 0 {
		return nil
	}
	for _, e := range errs {
		fmt.Fprintln(os.Stderr, e)
	}
	return fmt.Errorf("%d check-file-size error(s)", len(errs))
}
