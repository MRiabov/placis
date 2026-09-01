package main

import (
	"fmt"
	"sort"
	"strings"

	"placis/cmd/ci/docnames"
)

// Code is named identifiers found in OpenAPI, Go, and SQL.
type Code struct {
	PublicFile  string
	WorkerFile  string
	PublicOps   map[string]bool
	PublicDTOs  map[string]bool
	WorkerOps   map[string]bool
	WorkerDTOs  map[string]bool
	JobNames    map[string]bool
	Tables      map[string]bool
	TableFiles  map[string][]string
	GoNameFiles map[string][]string
}

func gateA(d docnames.Docs, c Code) []string {
	var errs []string
	for op := range c.PublicOps {
		if strings.Contains(op, "/internal/") {
			errs = append(errs, fmt.Sprintf("%s: %s must not be on public OpenAPI", c.PublicFile, op))
			continue
		}
		if !d.Paths[op] {
			errs = append(errs, fmt.Sprintf("%s: unknown path %s", c.PublicFile, op))
		}
		if hit := bannedHit(d, op); hit != "" {
			errs = append(errs, fmt.Sprintf("%s: %s is listed under Do not create (%s)", c.PublicFile, op, hit))
		}
	}
	for name := range c.PublicDTOs {
		if !d.DTOs[name] {
			errs = append(errs, fmt.Sprintf("%s: unknown DTO `%s`", c.PublicFile, name))
		}
	}
	for op := range c.WorkerOps {
		if !strings.Contains(op, "/internal/") {
			errs = append(errs, fmt.Sprintf("%s: %s must be an /internal/ path", c.WorkerFile, op))
			continue
		}
		if !d.Paths[op] {
			errs = append(errs, fmt.Sprintf("%s: unknown path %s", c.WorkerFile, op))
		}
		if hit := bannedHit(d, op); hit != "" {
			errs = append(errs, fmt.Sprintf("%s: %s is listed under Do not create (%s)", c.WorkerFile, op, hit))
		}
	}
	for name := range c.WorkerDTOs {
		if !d.DTOs[name] {
			errs = append(errs, fmt.Sprintf("%s: unknown DTO `%s`", c.WorkerFile, name))
		}
	}
	for name, files := range c.GoNameFiles {
		if d.JobNames[name] {
			continue
		}
		sort.Strings(files)
		for _, f := range files {
			errs = append(errs, fmt.Sprintf("%s: unknown River job kind `%s`", f, name))
		}
	}
	for name, files := range c.TableFiles {
		if docnames.TableKnown(name, d.Tables) {
			continue
		}
		sort.Strings(files)
		for _, f := range files {
			errs = append(errs, fmt.Sprintf("%s: unknown table `%s`", f, name))
		}
	}
	sort.Strings(errs)
	return errs
}

func bannedHit(d docnames.Docs, op string) string {
	_, path, ok := strings.Cut(op, " ")
	if !ok {
		return ""
	}
	if d.Paths[op] {
		// Documented Routes row; Do not create may ban a payload variant of
		// the same method+path.
		return ""
	}
	for _, ban := range d.Banned {
		if banMatches(ban, op, path) {
			return ban
		}
	}
	return ""
}

func banMatches(ban, op, path string) bool {
	if strings.Contains(ban, " ") {
		return op == ban
	}
	return path == ban || strings.HasPrefix(path, ban+"/")
}

func gateB(d docnames.Docs, c Code, leftover map[string][]string) []string {
	var errs []string
	for rel, f := range d.ByFile {
		need := map[string]bool{}
		if publicArmed(rel, f, c) {
			for p := range f.PublicPaths {
				addName(need, p)
			}
			for n := range f.PublicDTOs {
				addName(need, n)
			}
		}
		if workerArmed(rel, c) {
			for p := range f.InternalPaths {
				addName(need, p)
			}
			for n := range f.InternalDTOs {
				addName(need, n)
			}
		}
		if len(need) == 0 {
			continue
		}
		present := map[string]bool{}
		if publicArmed(rel, f, c) {
			for p := range c.PublicOps {
				addName(present, p)
			}
			for n := range c.PublicDTOs {
				addName(present, n)
			}
		}
		if workerArmed(rel, c) {
			for p := range c.WorkerOps {
				addName(present, p)
			}
			for n := range c.WorkerDTOs {
				addName(present, n)
			}
		}
		errs = append(errs, leftoverErrs(rel, need, present, leftover[rel])...)
	}
	sort.Strings(errs)
	return errs
}

func publicArmed(rel string, f *docnames.FileAPI, c Code) bool {
	if len(c.PublicOps) == 0 && c.PublicFile == "" {
		return false
	}
	switch rel {
	case "website/api.md":
		return hasURLPrefix(c.PublicOps, "/v1/website")
	case "billing/api.md":
		return f.HasDTOTable() && hasURLPrefix(c.PublicOps, "/v1/billing")
	case "general-architecture/api.md":
		return c.PublicFile != ""
	default:
		return false
	}
}

func workerArmed(rel string, c Code) bool {
	if rel != "website/api.md" {
		return false
	}
	return hasURLPrefix(c.WorkerOps, "/internal/website-")
}

func leftoverErrs(rel string, need, present map[string]bool, allowed []string) []string {
	allow := map[string]bool{}
	for _, t := range allowed {
		allow[t] = true
	}
	var errs []string
	for tok := range need {
		if present[tok] {
			continue
		}
		if !allow[tok] {
			errs = append(errs, fmt.Sprintf("%s: missing from OpenAPI %s", rel, tok))
		}
	}
	for _, tok := range allowed {
		if !need[tok] {
			errs = append(errs, fmt.Sprintf("%s: leftover %s is not a required token; remove it from the leftover list", rel, tok))
			continue
		}
		if present[tok] {
			errs = append(errs, fmt.Sprintf("%s: leftover %s is in OpenAPI; remove it from the leftover list", rel, tok))
		}
	}
	sort.Strings(errs)
	return errs
}

func hasURLPrefix(ops map[string]bool, prefix string) bool {
	for op := range ops {
		_, path, ok := strings.Cut(op, " ")
		if !ok {
			continue
		}
		if path == prefix || strings.HasPrefix(path, prefix+"/") || (strings.HasSuffix(prefix, "-") && strings.HasPrefix(path, prefix)) {
			return true
		}
	}
	return false
}

func addName(dst map[string]bool, name string) {
	if name == "" || dst[name] {
		return
	}
	dst[name] = true
}
