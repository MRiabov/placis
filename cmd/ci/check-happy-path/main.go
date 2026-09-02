package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"placis/cmd/ci/docnames"
)

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintf(os.Stderr, "check-happy-path: %v\n", err)
		os.Exit(1)
	}
}

func run(args []string) error {
	flags := flag.NewFlagSet("check-happy-path", flag.ContinueOnError)
	public := flags.Bool("public", false, "check public OpenAPI 1:1 TestHappyPath*")
	worker := flags.Bool("worker", false, "check Worker internal OpenAPI 1:1 TestHappyPath*")
	openapiPath := flags.String("openapi", "openapi.json", "public OpenAPI JSON")
	workerPath := flags.String("worker-openapi", "apps/contractor-website/openapi.json", "Worker internal OpenAPI JSON")
	internal := flags.String("internal", "internal", "Go internal packages")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if !*public && !*worker {
		return fmt.Errorf("pass --public and/or --worker")
	}

	tests, err := collectHappyPathTests(*internal)
	if err != nil {
		return err
	}

	var errs []string
	if *public {
		errs = append(errs, checkSpec(*openapiPath, tests, specPublic)...)
	}
	if *worker {
		errs = append(errs, checkSpec(*workerPath, tests, specWorker)...)
	}
	if len(errs) == 0 {
		return nil
	}
	for _, e := range errs {
		fmt.Fprintln(os.Stderr, e)
	}
	return fmt.Errorf("%d check-happy-path error(s)", len(errs))
}

func checkSpec(path string, tests []happyPathTest, set specSet) []string {
	if _, err := os.Stat(path); err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return []string{err.Error()}
	}
	spec, err := docnames.ParseOpenAPIFile(path)
	if err != nil {
		return []string{err.Error()}
	}
	return checkHappyPath(filepath.ToSlash(path), spec.Ops, tests, set)
}
