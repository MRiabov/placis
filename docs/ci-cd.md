# CI and Delivery

Adapted from the previous repo's CI policy. Two-layer CI: **CircleCI** is the primary validation
runner; **GitHub Actions** is reserved for emergency comparison and the Cloudflare public-site
deploy. Both run only non-mutating checks — CI never rewrites files.

## Gates

1. **File-size guard** — files must stay < 800 lines (warning) and < 1200 (hard error). Enforced
   by a `just check-files` recipe over `internal/`, `cmd/`, `migrations/`, `catalog/`, `docs/`.
   Prefer splitting a feature into its own package over allowing a file to creep past 800.
2. **Format / vet / lint** — `gofmt`/`goimports` check, `go vet`, `golangci-lint` (non-mutating);
   `frontend-2` TypeScript check + Biome (non-mutating).
3. **Build + test** — `go build ./...` and `go test ./...` (Testcontainers Postgres on CircleCI's
   machine executor); `frontend-2` typecheck + Vitest + Playwright e2e.
4. **Generated-code freshness** — `sqlc generate` must produce no diff; `goose` migrations apply
   cleanly to a fresh DB; the `huma` OpenAPI spec + frontend typegen stay in sync with the API
   structs (a contract check), so generated types are evidence and never drift.
5. **Provider isolation** — the backend test job strips provider credentials and forces fake
   storage/domain/LLM/research/voice providers, then fails if any credential-shaped env var
   remains. Tests must not spend LLM-provider, Google, registry, or research quota. Eval suites are
   **local-only** and never run in ordinary CI.

## Runner policy

- CircleCI runs on **pull-request branches only** and ignores direct `main` pushes (merge commits
  are already validated by the PR checks). Path filtering skips jobs irrelevant to the change.
- Diagnostics (per-gate stdout/stderr, JUnit XML) are published as artifacts so failures are
  API-retrievable.
- GitHub Actions: manual `workflow_dispatch` for emergency comparison; plus the manual
  `deploy public site cloudflare` entry point (separate from validation CI).
- Railway deploys `cmd/api` and `cmd/worker` from the integration branch — release, not CI.

## Local fix commands

```text
just fmt            # gofmt + goimports (mutating, local only)
just lint           # golangci-lint
just check-files    # file-size guard
just sqlc           # regenerate queries
just test           # go test ./...
```

## Pre-commit & static analysis

Pre-commit runs the fast subset (format + a few linters); CI runs the full set. Go's compiler and
standard linters already enforce most of what the previous repo's hand-rolled Python AST ratchets
did (Python had no compiler backing; Go does). We do **not** hand-roll AST scripts up front:

- `gofmt`/`goimports`, `go vet`, `golangci-lint` (`staticcheck`, `govet`, `errcheck`, `ineffassign`,
  `unused`, `misspell`, `revive`).
- Generated-code freshness (`sqlc` diff, `huma` OpenAPI + frontend typegen).

A custom `go/analysis` analyzer is added only when a concrete mistake keeps recurring — the one
candidate is the Go analog of the old "freeform-JSON" ratchet ("no `map[string]any` /
`json.RawMessage` in domain code, only at the persistence/API boundary"). Defer it until it
actually bites.
