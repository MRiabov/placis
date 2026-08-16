# CI and Delivery

Adapted from the previous repo's CI policy. Two-layer CI: **CircleCI** is the primary validation
runner; **GitHub Actions** is reserved for emergency comparison and the Cloudflare public-site
deploy. Both run only non-mutating checks — CI never rewrites files.

## Gates

1. **File-size guard** — files must stay < 800 lines (warning) and < 1200 (hard error). Enforced
   by a `just check-files` recipe over `internal/`, `cmd/`, `migrations/`, `catalog/`, `docs/`.
   Prefer splitting a feature into its own package over allowing a file to creep past 800.
2. **Format / vet / lint** — `gofmt`/`goimports` check, `go vet`, `golangci-lint` (non-mutating).
3. **Build + test** — `go build ./...` and `go test ./...`. Backend tests use Testcontainers for
   Postgres (machine executor on CircleCI).
4. **Generated-code freshness** — `sqlc generate` must produce no diff; `goose` migrations apply
   cleanly to a fresh DB; the `huma` OpenAPI spec + frontend typegen stay in sync with the API
   structs (a contract check), so generated types are evidence and never drift.
5. **Provider isolation** — the backend test job strips provider credentials and forces fake
   storage/domain/LLM/research/voice providers, then fails if any credential-shaped env var
   remains. Tests must not spend OpenRouter, Google, registry, or research quota. Eval suites are
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
