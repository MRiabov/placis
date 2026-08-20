# CI and Delivery

Adapted from the previous repo's CI policy. Two-layer CI: **CircleCI** is the primary validation
runner; **GitHub Actions** is reserved for emergency comparison and the Cloudflare contractor-website
deploy. Both run only non-mutating checks — CI never rewrites files.

## Gates

1. **File-size guard** — files must stay < 800 lines (warning) and < 1200 (hard error), except
   `docs/glossary.md` (one ubiquitous-language file; do not split it). Enforced
   by a `just check-files` recipe over `internal/`, `cmd/`, `migrations/`, `catalog/`, `docs/`.
   Prefer splitting a feature into its own package over allowing a file to creep past 800.
2. **Format / vet / lint** — `gofmt`/`goimports` check, `go vet`, `golangci-lint` (non-mutating);
   `frontend-2` TypeScript check + Biome (non-mutating).
3. **Build + test** — `go build ./...` and `go test ./...` (Testcontainers Postgres on CircleCI's
   machine executor); `frontend-2` typecheck + Vitest + Playwright e2e.
4. **Generated-code freshness** — `sqlc generate` must produce no diff; `goose` migrations apply
   cleanly to a fresh DB; the `huma` OpenAPI spec + frontend typegen stay in sync with the API
   structs (a contract check), so generated types are evidence and never drift.
5. **External API isolation** — the backend test job strips Google / LLM / Stripe / voice
   credentials and forces fakes, then fails if any credential-shaped env var remains. Tests must
   not spend LLM, Google, registry, or business research quota. Eval suites are
   **local-only** and never run in ordinary CI.
6. **OpenAPI constraints** — the generated spec must constrain every field: strings carry
   `minLength` (and `maxLength`), numbers carry `minimum`/`maximum`, fixed sets are `enum`. A field
   missing its constraints fails CI (the Go equivalent of the old "strict schema contract" check).

## Runner policy

- CircleCI runs on **pull-request branches only** and ignores direct `main` pushes (merge commits
  are already validated by the PR checks). Path filtering skips jobs irrelevant to the change.
- Diagnostics (per-gate stdout/stderr, JUnit XML) are published as artifacts so failures are
  API-retrievable.
- GitHub Actions: manual `workflow_dispatch` for emergency comparison; plus the manual
  `deploy contractor website cloudflare` entry point (separate from validation CI).
- Railway deploys `cmd/api` and `cmd/worker` from the integration branch — release, not CI.

## Dev tooling (`justfile`)

The `justfile` is the **developer entry point**, and nothing more — only the high-frequency dev loop:

- `just servers-up` / `just servers-down` — start/stop the dev environment (Postgres via Docker,
  migrations, `cmd/api`, `cmd/worker`, `frontend-2`, with env-var + port resolution).
- `just test`, `just lint`, `just fmt`, `just sqlc`, `just typegen`, `just check-files` — the
  fix-it-locally feedback loop.

**Not** in the `justfile`: dependency installs / one-off install, and anything CI runs. CI invokes the
underlying tools directly (`go test ./...`, `golangci-lint`, `sqlc generate`) — never `just`
recipes. A recipe that is only ever executed by CI is dead weight.

## Pre-commit & static analysis

Pre-commit runs the fast subset (format + a few linters); CI runs the full set. Go's compiler and
standard linters already enforce most of what the previous repo's hand-rolled Python AST ratchets
did (Python had no compiler backing; Go does). We do **not** hand-roll AST scripts up front:

- `gofmt`/`goimports`, `go vet`, `golangci-lint` (`staticcheck`, `govet`, `errcheck`, `ineffassign`,
  `unused`, `misspell`, `revive`).
- **Don't-say glossary check** (`cmd/ci/check-dont-say`) — see below.
- Generated-code freshness (`sqlc` diff, `huma` OpenAPI + frontend typegen).

A custom `go/analysis` analyzer is added only when a concrete mistake keeps recurring — the one
candidate is the Go analog of the old "freeform-JSON" ratchet ("no `map[string]any` /
`json.RawMessage` in domain code, only at the persistence/API boundary"). Defer it until it
actually bites.

### Don't-say checker

The ban list is the `### Don't say` table in `docs/glossary.md`. Do not duplicate it. The checker
fails if that heading is missing or the table is unparseable.

**Table shape (contract):** the section starts at `### Don't say` and runs until the next `## `
heading. It must contain a `| Don't say | Say |` title row, a separator row, and at least one
`| left | right |` data row. Split left cells on ` / `. Parentheticals are stripped from the
matched phrase. Unmarked tokens are always-ban. `(website)` / `(ads)` / `(onboarding)` /
`(media)` / `(details)` are unqualified only in that feature’s technical docs (not `prd.md`,
not `frontend.md`) and later `internal/<home>/`. Backticked names and `CMS (in a PRD)` are
product-docs only. Leftover `(bare)` is always-ban. The last API-ops row is skipped.
Identifier inflections of always-ban and home-scoped phrases (snake, kebab, Pascal, camel) are
banned outside the allowed files, including inside backticks (table names, types, paths).
Backticks are not an escape. Home-scoped tokens in a `/`-delimited route or file path are not
flagged (the URL still uses the short word). Always-ban tokens in paths still fail.
`apps/contractor-website` is the contractor website application directory.
`docs/glossary.md` itself is not scanned (it is the list). Worked examples:
[`cmd/ci/check-dont-say/ref.md`](../cmd/ci/check-dont-say/ref.md).

**Tiers**

- Token **without** a home marker: always-ban in `docs/` and Go.
- Token **with** `(website)` (or another home): that feature’s technical docs only. PRDs, UI
  specs, and other features use the Say.

**Pre-commit vs CI**

- Pre-commit: `language: golang` in `.pre-commit-config.yaml` builds `cmd/ci/check-dont-say` once and
  caches the binary. The hook receives staged `*.md` / `*.go` paths (not `go run` on every commit).
  `frontend-2` is excluded. If `docs/glossary.md` is staged, the checker scans the enabled trees
  (`docs/`, `internal/`, `cmd/`, `migrations/`, `catalog/`).
- CI: the same command over those trees, `go run ./cmd/ci/check-dont-say --all` (not via `just`).
  `--frontend` stays off until frontend work starts from the Go backend (see
  `docs/planning/go-backend-rewrite.md`).

Skip `.agents/` and generated files. There is no empty-list or shrink ratchet: parse failure is
the failure.
