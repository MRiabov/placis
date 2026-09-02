package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintf(os.Stderr, "check-pipeline-tables: %v\n", err)
		os.Exit(1)
	}
}

func run(args []string) error {
	flags := flag.NewFlagSet("check-pipeline-tables", flag.ContinueOnError)
	_ = flags.Bool("all", false, "scan docs/features instead of listed files")
	root := flags.String("root", "docs/features", "features docs root")
	jobs := flags.String("jobs", "docs/general-architecture/jobs.md", "path to jobs.md")
	docs := flags.String("docs", "docs", "docs root for known River job kind names")
	internal := flags.String("internal", "internal", "Go internal packages for TestPipelineHappyPath")
	if err := flags.Parse(args); err != nil {
		return err
	}

	changed := flags.Args()
	rep, err := inspect(*root)
	if err != nil {
		return err
	}

	var errs []string
	errs = append(errs, checkHeadings(rep)...)
	errs = append(errs, checkAPIHeadings(rep)...)
	errs = append(errs, checkPersistHeadings(rep)...)
	errs = append(errs, checkTestingHeadings(rep)...)
	errs = append(errs, checkPipelinePairing(rep)...)
	errs = append(errs, checkCoverage(rep)...)
	funcs, err := collectPipelineHappyPathFuncs(*internal)
	if err != nil {
		return err
	}
	errs = append(errs, checkPipelineHappyPath(rep, funcs, pipelineHappyPathLeftover)...)
	if fileExists(*jobs) {
		cat, err := parseJobsCatalog(*jobs)
		if err != nil {
			return err
		}
		errs = append(errs, checkJobsHeadings(cat)...)
		if fileExists(*docs) {
			errs = append(errs, checkKnownRiverJobs(*docs, cat.names)...)
		}
	}
	if len(changed) > 0 {
		emitWarnings(warnMissingTesting(rep, changed))
	}

	if len(errs) == 0 {
		return nil
	}
	for _, e := range errs {
		fmt.Fprintln(os.Stderr, e)
	}
	return fmt.Errorf("%d check-pipeline-tables error(s)", len(errs))
}

func warnMissingTesting(r report, changed []string) []string {
	touched := map[string]bool{}
	for _, f := range changed {
		touched[filepath.ToSlash(f)] = true
	}
	var out []string
	for _, p := range r.persistFiles {
		if p.testingPath != "" {
			continue
		}
		if !touched[filepath.ToSlash(p.path)] {
			continue
		}
		out = append(out, fmt.Sprintf("%s: no testing.md for this feature; add one so persistence tables are asserted", p.path))
	}
	return out
}

func emitWarnings(msgs []string) {
	github := os.Getenv("GITHUB_ACTIONS") == "true"
	for _, msg := range msgs {
		fmt.Fprintln(os.Stderr, "warning: "+msg)
		if github {
			file, _, _ := strings.Cut(msg, ":")
			fmt.Printf("::warning file=%s::%s\n", file, msg)
		}
	}
}
