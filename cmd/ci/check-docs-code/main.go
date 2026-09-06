package main

import (
	"flag"
	"fmt"
	"os"

	"placis/cmd/ci/docnames"
)

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintf(os.Stderr, "check-docs-code: %v\n", err)
		os.Exit(1)
	}
}

func run(args []string) error {
	flags := flag.NewFlagSet("check-docs-code", flag.ContinueOnError)
	_ = flags.Bool("all", false, "scan docs, OpenAPI, Go, and SQL instead of listed files")
	docsRoot := flags.String("docs", "docs", "docs root")
	jobsPath := flags.String("jobs", "docs/infrastructure/jobs.md", "path to jobs.md")
	openapiPath := flags.String("openapi", "openapi.json", "public OpenAPI JSON")
	workerPath := flags.String("worker-openapi", "apps/contractor-website/openapi.json", "Worker internal OpenAPI JSON")
	migrations := flags.String("migrations", "internal/infrastructure/store/migrations", "goose SQL directory")
	internalRoot := flags.String("internal", "internal", "Go internal packages")
	cmdRoot := flags.String("cmd", "cmd", "Go commands (ci is skipped)")
	if err := flags.Parse(args); err != nil {
		return err
	}

	d, err := docnames.ParseDocs(*docsRoot, *jobsPath)
	if err != nil {
		return err
	}
	c, err := loadCode(*openapiPath, *workerPath, *migrations, *internalRoot, *cmdRoot)
	if err != nil {
		return err
	}

	var errs []string
	errs = append(errs, gateA(d, c)...)
	errs = append(errs, gateB(d, c, missingOpenAPILeftover)...)
	if len(errs) == 0 {
		return nil
	}
	for _, e := range errs {
		fmt.Fprintln(os.Stderr, e)
	}
	return fmt.Errorf("%d check-docs-code error(s)", len(errs))
}

func loadCode(publicPath, workerPath, migrations, internalRoot, cmdRoot string) (Code, error) {
	c := Code{
		PublicOps:   map[string]bool{},
		PublicDTOs:  map[string]bool{},
		WorkerOps:   map[string]bool{},
		WorkerDTOs:  map[string]bool{},
		JobNames:    map[string]bool{},
		Tables:      map[string]bool{},
		TableFiles:  map[string][]string{},
		GoNameFiles: map[string][]string{},
	}
	if fileExists(publicPath) {
		spec, err := docnames.ParseOpenAPIFile(publicPath)
		if err != nil {
			return c, err
		}
		c.PublicFile = spec.Path
		c.PublicOps = spec.Ops
		c.PublicDTOs = spec.DTOs
	}
	if fileExists(workerPath) {
		spec, err := docnames.ParseOpenAPIFile(workerPath)
		if err != nil {
			return c, err
		}
		c.WorkerFile = spec.Path
		c.WorkerOps = spec.Ops
		c.WorkerDTOs = spec.DTOs
	}
	files, err := docnames.RiverFilesFromGo(internalRoot, cmdRoot)
	if err != nil {
		return c, err
	}
	c.GoNameFiles = files
	for name := range files {
		c.JobNames[name] = true
	}
	c.TableFiles, err = docnames.SQLFilesFromDir(migrations)
	if err != nil {
		return c, err
	}
	for name := range c.TableFiles {
		c.Tables[name] = true
	}
	return c, nil
}

func fileExists(path string) bool {
	st, err := os.Stat(path)
	return err == nil && !st.IsDir()
}
