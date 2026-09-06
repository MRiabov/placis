# CI and Delivery

Adapted from the previous repo's CI policy. Validation jobs run only
non-mutating checks — CI never rewrites files.

**CircleCI** and **GitHub Actions** both run the same gates. Switch by
commenting the trigger lines in the YAML (`on: pull_request` in
`.github/workflows/ci.yml`, or the CircleCI workflow trigger in
`.circleci/config.yml`). GitHub Actions is the live runner today (CircleCI quota
is exhausted). Cloudflare deploys stay on GitHub Actions and are not part of
this switch.

## Terms

- **GitHub Checks** — check runs on the pull request. This is how humans and
  agents inspect CI: the Checks tab and `gh pr checks`. Logs belong here, not on
  the CircleCI dashboard.
- **CircleCI GitHub App** — CircleCI installed on the GitHub org, granted this
  repo. Not a CircleCI-native project.
- **Commit statuses** — the `ci/circleci:*` pass/fail bits. Not enough: they do
  not carry logs.

## GitHub integration

When CircleCI is the live runner, install it as a GitHub App on the org (this
repo only) and enable GitHub Checks. Do not register a CircleCI-native /
standalone project (opaque project id `circleci/<org-id>/<project-id>`, VCS type
"CircleCI"). That mode is what the previous repo used: GitHub only received
commit statuses, and logs lived in CircleCI.

CircleCI currently labels some GitHub App orgs "standalone" and gives them
`circleci/<uuid>/<uuid>` project ids. Ignore that product name. If a failing job
is not diagnosable from GitHub Checks, the connection mode is wrong.

## Gates

1. **File-size guard** — `cmd/ci/check-file-size`. Files must stay < 800
   lines (warning) and < 1200 (hard error), except `docs/glossary.md`
   (one ubiquitous-language file; do not split it) and
   `docs/features/onboarding/testing.md` (owning `TestHappyPath*` 1:1 plus
   E2E / Full / extras; do not split it). Trees: `docs/`, `internal/`,
   `cmd/`, `catalog/`, `frontend-3/`. The look app (`apps/demo/src`)
   hard-fails at 800; that is [decision 1](#decisions). Prefer splitting
   a feature into its own package over allowing a file to creep past 800.
2. **Folder fan-out** — `cmd/ci/check-file-size`. A nested dir under
   `internal/` or `frontend-3/src/` may hold at most **9** entries
   (tracked files + child dirs). `internal/` root and `frontend-3/src/`
   may each hold at most **15**. **Exclude `*_test.go` and `*.test.*`**.
   Split a fat folder into a nested package (Go) or nested feature folder
   (`frontend-3`); that is why `templates` and `assistant` nest under
   `website/` instead of sitting as siblings at `internal/` root. Scope is
   `internal/` and `frontend-3/src/` — not `docs/`, `packages/`, or
   `apps/`. Layout: [module layout](module-layout.md),
   [frontend stack](frontend-stack.md).
3. **Format / vet / lint** — `gofmt`/`goimports` check, `go vet`,
   `golangci-lint` (non-mutating); look app (`apps/demo/`) TypeScript check +
   Biome (non-mutating) via biome / `tsc` / knip / token checks in
   parent CI (`pnpm check` locally and on the copied `demo.placis.com`
   checkout, which also runs Don't-say and the look-export file-size
   script); **rumdl** `fmt --check` then `check`
   on first-party Markdown (non-mutating). See Pre-commit below. Look CI:
   `.github/workflows/frontend-quality.yml` (path filter: `apps/demo/**` and
   that workflow file; Don't-say and file-size are the docs-gates job)
   and the copied `apps/demo/.github/workflows/check.yml` on
   `demo.placis.com`. `frontend-3` TypeScript + Biome is the same contract
   once that app is enabled.
4. **Build + test** — `go build ./...` and `go test ./...` with **no**
   `-count=1` (Testcontainers Postgres; CircleCI uses the machine executor when
   it is live); `frontend-3` typecheck + `vitest run --changed origin/main` +
   Playwright e2e (`--only-changed=origin/main` unless Go / goose SQL / OpenAPI
   / Playwright config / lockfile force the full list). Cache paths and worker
   rules: Runner policy below, and [testing.md](testing.md).
5. **Generated-code freshness** — `sqlc generate` must produce no diff; `goose`
   migrations apply cleanly to a fresh DB; the `huma` OpenAPI spec + frontend
   typegen stay in sync with the API structs (a contract check), so generated
   types are evidence and never drift. The **Worker** typegens from a
   **separate** internal OpenAPI file (not `GET /openapi.json`). Export
   and `apps/contractor-website` typegen must produce no diff.
6. **External API isolation** — the backend test job strips Google / LLM /
   Stripe / voice credentials and forces fakes, then fails if any
   credential-shaped env var remains. Tests must not spend LLM, Google,
   registry, or business research quota. Eval suites are **local-only** and
   never run in ordinary CI.
7. **OpenAPI constraints** — the generated spec must constrain every field:
   strings carry `minLength` (and `maxLength`), numbers carry
   `minimum`/`maximum`, fixed sets are `enum`. A field missing its constraints
   fails CI. The check must also fail `map[string]any`, `json.RawMessage`,
   `additionalProperties: true`, and string fields documented as JSON on
   huma DTOs (including SSE event structs). The **same** check runs on the
   Worker internal OpenAPI file. Persistence `jsonb` columns are not
   this check. See [HTTP conventions](api.md).
8. **Production-ready website template** — a website template marked
   `production_ready` (the flag 01 may pick) fails CI unless it has the
   expected website pages and look sections, and every Common variable from
   [variables.md](../features/website/variables.md) appears at least once.
   Rules: [website template catalog](../features/website/catalog.md). Do not
   turn this gate on against leftover predecessor per-website-page JSON
   until a website template index exists. Dump/source drift of `catalog/` vs
   `packages/website-components` contracts also fails CI after that dump
   exists. Keep the deferred blog/careers fail.

## Decisions

Status: decided (dates on each entry). Update an entry (keeping the old
decision + date) instead of silently replacing the old entry.

1. **Look app hard-fails at 800 lines** — Repo-wide files warn under 800 and
   hard-fail at 1200. `apps/demo/src` hard-fails above 800. Why: the look
   app only grows in complexity when it is integrated into `frontend-2`.
   (2026-08-29)
   (2026-09-05): owner SPA is `frontend-3`; [ADR](ADR.md) 3. Do not
   integrate look into `frontend-2`.
   (2026-09-06): parent CI is `cmd/ci/check-file-size` (one walk with
   docs / Go / `frontend-3` / `catalog/`).
   `apps/demo/scripts/check-files.mjs` stays for the look export
   (`demo.placis.com` has no Go).

## Runner policy

- Validation runs on **pull-request branches only** and ignores direct `main`
  pushes (merge commits are already validated by the PR checks). Path filtering
  skips jobs irrelevant to the change: `frontend-3` e2e unless `frontend-3/`,
  `packages/website-components/`, Go, goose SQL, or `openapi.json` changed;
  `apps/placis-website` e2e unless that app (or its shared packages) changed.
  Start the contractor-website **Worker container** (no `wrangler deploy`)
  when `apps/contractor-website/`, the internal OpenAPI file, or Go
  callers of `websiteRender` / `websitePublication` change. Run
  `check-happy-path --worker` on that job only. Do **not** start that
  container from the public cmd/api job. `--public` HappyPath and pipeline
  Go-name pairing run on the general docs/Go job.
- Non-shallow git (or an explicit fetch of `origin/main`) so `--changed` /
  `--only-changed` can diff against main. Empty Vitest selection is a pass
  (`--passWithNoTests` where needed).
- **Caches (both runners, same keys).** GitHub Actions is live:
  `actions/setup-go` with `cache: true` and `cache-dependency-path: go.mod`
  persists `GOCACHE` (`~/.cache/go-build`)
  and the module cache — do not add a second overlapping `actions/cache` for
  those paths. The repo often has no `go.sum` (stdlib-only `go.mod`);
  `actions/setup-go` `@v5` hashes `go.sum` by default and will not save a cache
  without `cache-dependency-path: go.mod`. Pin `go.mod` to a release in the
  ubuntu-latest tool-cache (today 1.24–1.26; 1.27 is not there yet) so
  `actions/setup-go` does not download a toolchain every job. Persist
  `golangci-lint` cache
  separately. Persist Vite `cacheDir`
  (`node_modules/.vite`), `.frontend-quality-cache/`, and Playwright Chromium
  (`~/.cache/ms-playwright`) keyed on `pnpm-lock.yaml`. CircleCI, when live,
  uses `restore_cache`/`save_cache` for the same Go paths (keyed on `go.mod`
  plus a bump suffix when the cache format changes), the lint cache, and the
  same frontend paths. Do not restore Clerk `storageState`, cookies, or
  `test-results/` across jobs. Do not expect skipped tests from a restored Vite
  cache. Chromium only; `playwright install chromium` without `--with-deps`.
- Playwright workers, not `--shard`. Default workers for specs that do not hit
  Clerk's Frontend API. Clerk testing-token specs (`workers: 1`) because testing
  tokens are 2 requests per second: create once per job (`clerkSetup()`), then
  reuse `CLERK_TESTING_TOKEN`. Do not start a second Vite for missing
  `../frontend`. Do not `--shard` until one job with workers is still too slow.
- Both `.github/workflows/ci.yml` and `.circleci/config.yml` live in the repo.
  Comment the unused runner's trigger lines; leave the other uncommented.
- Diagnostics (per-gate stdout/stderr, JUnit XML) are uploaded with the job as a
  backup. Ordinary failure diagnosis is GitHub Checks, not the CircleCI CLI.
- GitHub Actions also has two upload/deploy workflows (separate from validation
  CI). They are not on the runner switch. Secrets/vars stay in GitHub
  Environments, not git. CircleCI does not deploy either origin.
  - `deploy contractor website cloudflare` — the shared
    `placis-contractor-website` Worker (staging | production). Cloudflare
    account id, zone id for `placis.com`, API token (Workers + R2 + Cache Purge;
    Custom Hostnames write is the Go API, not this workflow), contractor R2
    bucket name. Serve path: [website Cloudflare](../features/website/cloudflare.md).
  - `deploy placis website` — `astro build` (bakes `/pricing/` amounts
    from `GET /v1/billing/catalog`) and upload `dist/` to the Placis
    website R2 bucket (`placis-website` | `placis-website-staging`), then purge
    cache. Workflow YAML is not in this PR. Serve path:
    [Placis website Cloudflare](../features/placis-website/cloudflare.md).
- Railway deploys `cmd/api` from the integration branch — release, not CI.

## Dev tooling (`justfile`)

The `justfile` is the **developer entry point**, and nothing more — only the
high-frequency dev loop:

- `just servers-up` / `just servers-down` — start/stop the dev environment
  (Postgres via Docker, goose, `cmd/api`, `frontend-3`, with env-var + port
  resolution).
- `just test`, `just lint`, `just fmt`, `just sqlc`, `just typegen`,
  `go run ./cmd/ci/check-file-size --all` — the fix-it-locally feedback
  loop.

**Not** in the `justfile`: dependency installs / one-off install, and anything
CI runs. CI invokes the underlying tools directly (`go test ./...`,
`golangci-lint`, `sqlc generate`, `vitest run --changed origin/main`,
`playwright test --only-changed=origin/main`) — never `just` recipes. A recipe
that is only ever executed by CI is dead weight. Local `just test` (when added)
should leave Go's test cache on and prefer `--changed` / `--only-changed`;
full-suite escape hatches are not CI defaults.

## Pre-commit & static analysis

Pre-commit runs the fast subset (format + a few linters); CI runs the full set.
Go's compiler and standard linters already enforce most of what the previous
repo's hand-rolled Python AST ratchets did (Python had no compiler backing; Go
does). We do **not** hand-roll AST scripts up front:

- `gofmt`/`goimports`, `go vet`, `golangci-lint` (`staticcheck`, `govet`,
  `errcheck`, `ineffassign`, `unused`, `misspell`, `revive`).
- **rumdl** — Markdown format + lint (standard flavor, 80-col wrap, compact
  tables). Config: [`.rumdl.toml`](../../.rumdl.toml). Pre-commit:
  `rumdl-fmt` on staged files, then `rumdl-fmt-check` and `rumdl` on all
  tracked Markdown (excludes `.agents/`). CI: `.github/workflows/docs-gates.yml`
  runs `rumdl fmt --check` then `rumdl check` before the Go scanners (not via
  `just`; never `rumdl fmt` in CI). Conventions:
  [docs conventions](../docs-conventions.md).
- **Don't-say glossary check** (`cmd/ci/check-dont-say`) — see below.
- **Docs–code named identifiers** (`cmd/ci/check-docs-code`) — see below.
- **Pipeline table and heading check** (`cmd/ci/check-pipeline-tables`) —
  step files pair with `pipeline/testing/<name>.md`; **known** persistence
  tables in a step appear in that testing file; every persistence table
  appears in `testing.md` and/or `pipeline/testing/` when those files
  exist; pipeline step `##` headings are a closed list; feature `api.md`,
  `persistence.md`, and `testing.md` `##` use a shrink-only leftover list
  (closed `api.md` is DTOs / Routes / Do not create; closed `persistence.md`
  is Tables / Indexes); `testing.md` `##` is E2E / Integration and `####`
  is Setup / Exercise / Verify / Fail / Mocked / Teardown; pipeline Go
  `TestPipelineHappyPath*` per paired step plus `{Feature}Full` (shrink-only
  leftover until funcs exist); feature `jobs.md` `##` is Workflows / Jobs;
  backticked River job kind must already live in a feature `jobs.md` `## Jobs`.
  A changed `persistence.md` passed on the command line without
  `testing.md` warns. See
  [docs conventions](../docs-conventions.md#named-identifiers).
- **HappyPath OpenAPI check** (`cmd/ci/check-happy-path`) — `--public`
  leftover-checks structured `api.md` Routes (public and `/internal/…`)
  plus exported `openapi.json` when present; `--worker` against the
  Worker internal OpenAPI file. Each op needs a
  `### TestHappyPath* — Route` Exercise 1:1 in the owning `testing.md`
  and a `func TestHappyPath*`
  that hits **exactly that one** Method+path literal. Flow tests do not
  fill a 1:1 row. `TestPipelineHappyPath*` is not a 1:1 row. Two leftover
  files (`leftover_docs.go`, `leftover_tests.go`) may only shrink. Details
  and Projects owning files are
  `docs/features/business-profile/details/testing.md` and
  `docs/features/business-profile/projects/testing.md`. Missing
  spec file: that walk no-ops. See
  [testing.md](testing.md).
- **API home check** (`cmd/ci/check-api-dirs`) — see below.
- **Import DAG check** (`cmd/ci/check-import-dag`) — see below.
- **File-size and folder fan-out** (`cmd/ci/check-file-size`) — see
  below.
- Generated-code freshness (`sqlc` diff, `huma` OpenAPI + frontend typegen,
  Worker internal OpenAPI export + contractor-website typegen).

### Don't-say checker

The ban list is the `## Don't say` table in `docs/glossary.md`. Do not
duplicate it. The checker fails if that heading is missing or the table is
unparseable.

**Table shape (contract):** the section starts at `## Don't say` and runs until
the next `##` heading. It must contain a `| Don't say | Say |` title row, a
separator row, and at least one `| left | right |` data row. Split left cells on
` / `. Parentheticals are stripped from the matched phrase. Unmarked tokens are
always-ban. `(website)` / `(ads)` / `(onboarding)` / `(media)` / `(details)` /
`(billing)` are unqualified only in that feature’s technical docs (not `prd.md`,
not `frontend.md`) and later `internal/<home>/`. `(website)` also covers
`apps/contractor-website` and `packages/website-components`.
`apps/placis-website` is scanned and is not website home. Backticked names and
`CMS (in a PRD)` are product-docs only. Leftover `(bare)` is always-ban. The
last API-ops row is skipped. Covering (the Say phrase, plus extra-allowed
phrases) still applies when rumdl wrap splits a phrase across adjacent lines. A
Don't-say / do not say / never say instruction still covers the next wrapped
line when that line is not a new list item or heading. Identifier inflections of
always-ban and home-scoped phrases (snake, kebab, Pascal, camel) are banned
outside the allowed files, including inside backticks (table names, types,
paths). Backticks are not an escape. Home-scoped tokens in a `/`-delimited route
or file path are not flagged (the URL still uses the short word). Always-ban
tokens in paths still fail. `apps/contractor-website` is the contractor website
application directory. `docs/glossary.md` itself is not scanned (it is the
list). `**/testdata/**` is skipped (checker fixtures). Worked examples:
[`cmd/ci/check-dont-say/ref.md`](../../cmd/ci/check-dont-say/ref.md).

#### Tiers

- Token **without** a home marker: always-ban in `docs/`, Go, and the website
  apps.
- Token **with** `(website)` (or another home): that feature’s technical docs
  only. PRDs, UI specs, and other features use the Say. `(website)` includes
  `apps/contractor-website` and `packages/website-components`.

#### Pre-commit vs CI

- Install once per clone: `pre-commit install`. Git worktrees share
  `.git/hooks`.
- Pre-commit: `.pre-commit-config.yaml` runs `go run ./cmd/ci/check-dont-say` on
  staged files under `AGENTS.md`, `docs/`, `internal/`, `cmd/`,
  `catalog/`, `apps/contractor-website`, `apps/placis-website`, `scripts/`,
  `apps/demo/`, and `packages/website-components` (Go's build cache keeps this
  cheap). Markdown, Go, and JavaScript
  (`.js` / `.mjs`) are scanned in those trees. TypeScript (`.ts` / `.tsx`) is
  scanned in the look app (`apps/demo/`, exported `src/`) and in
  `packages/website-components` without `--frontend`; that package also scans
  `.json` and `.css`. `packages/website-components/src/blueprints/` is skipped
  (leftover scrap dumps). `frontend-3`
  stays off until `--frontend`. If `docs/glossary.md` is staged, the checker
  scans those trees in full. Paths outside those trees
  are ignored even when filenames are passed in. A copied look checkout
  (`demo.placis.com`) uses the same checker with `--glossary glossary.md` over
  `src/`.
- CI: `.github/workflows/docs-gates.yml` runs rumdl `fmt --check` then
  `check`, then `go test` for Don't-say, docs-code, pipeline-tables,
  check-happy-path, check-api-dirs, check-import-dag, and
  check-file-size, then `go run ./cmd/ci/check-dont-say --all` (and the
  other scanners) in one job so `actions/setup-go` and the stdlib compile
  are paid once. `--frontend` stays off
  until frontend work
  starts from the Go backend (see [frontend-debloat.md](frontend-debloat.md)).

Skip `.agents/` and generated files. There is no empty-list or shrink ratchet:
parse failure is the failure.

### Pipeline tables checker

`cmd/ci/check-pipeline-tables` enforces the table pairing and pipeline step
heading lists in
[docs conventions](../docs-conventions.md#named-identifiers).
Unit tests + `go run`. Pre-commit on
`docs/features/**/{persistence,testing,api,jobs}.md`,
`docs/features/**/pipeline/**/*.md`, and `docs/infrastructure/jobs.md`.
CI: `.github/workflows/docs-gates.yml` runs
`go test ./cmd/ci/check-pipeline-tables` then
`go run ./cmd/ci/check-pipeline-tables --all` in the same job as the other docs
scanners.

This pass: **tables**, **pipeline step headings**,
**feature `api.md` / `persistence.md` / `testing.md` headings**,
**feature `jobs.md` Workflows / Jobs**, and **known River job kind** names. Not
Routes paths, not gatherers (`pipeline/README.md`,
`etl/pipeline/etl-run-kind-triggers.md`). Closed `api.md` `##` is DTOs
(optional), Routes, Do not create. Closed `persistence.md` `##` is Tables
and Indexes. Closed feature `jobs.md` `##` is Workflows and Jobs
([infrastructure/jobs.md](../infrastructure/jobs.md) is the index). Closed
`testing.md` `##` is E2E / Integration; closed `####` is Setup / Exercise /
Verify / Fail / Mocked / Teardown (`###` is one test; ban
`### METHOD /path`). Paired pipeline steps require
`TestPipelineHappyPath{Feature}{Step}` in `internal/**/*_test.go` plus
exactly `TestPipelineHappyPath{Feature}Full` (leftover list may only
shrink). Skip **Do not run** testing files. Skip Persist none
(onboarding `03`). A
backticked River job kind (`River job \`foo\``, `River job kind \`foo\``,
`**inserts** \`foo\``) must be a `## Jobs` row. Website, billing, ads,
assistant, onboarding, auth, the media library, and ETL have none.
Undefined features keep leftover extra-heading lists in
`cmd/ci/check-pipeline-tables`; extras may only shrink (drop the leftover
entry in the same PR). Pairing matches
**known** table names (already in some `persistence.md`); invented names
and columns are writing rules. Warn (do not fail) when a changed
`persistence.md` is passed on the command line and that feature has no
`testing.md`. `--all` with no extra paths does not warn on untouched files.
GitHub Actions passes the PR’s changed `persistence.md` paths after `--all`
so `::warning` can fire.

### HappyPath OpenAPI checker

`cmd/ci/check-happy-path --public` leftover-checks structured `api.md`
Routes **Method + path** cells (and HTTP conventions `GET /v1/health` /
`GET /openapi.json`) plus exported `openapi.json` when present. The
owning `testing.md` must have a `### TestHappyPath* — Route` (not
`TestPipelineHappyPath`) whose **Exercise** is exactly that one
Method+path. `internal/**/*_test.go` must have a `func TestHappyPath*`
that hits that same literal. `--worker` uses the Worker internal
OpenAPI file and `/internal/…` ops. Two leftover files
(`leftover_docs.go`, `leftover_tests.go`) may only shrink; a heading
does not shrink the tests leftover, a func does not shrink the docs
leftover. Details and Projects owning files are
`docs/features/business-profile/details/testing.md` and
`docs/features/business-profile/projects/testing.md`. A spec op has no
leftover. No spec file: that walk passes.
Unit tests + `go run`. Pre-commit: `--public` with the other docs
scanners (also on `docs/**/api.md` and `docs/**/testing.md`).
`--worker` only on the Worker job (do not start the Worker container
from the public job). CI: `.github/workflows/docs-gates.yml` runs
`go test ./cmd/ci/check-happy-path` then
`go run ./cmd/ci/check-happy-path --public`.

### Docs–code named identifiers

`cmd/ci/check-docs-code` pairs OpenAPI, Go, and goose SQL with the named
lists in `docs/`. Unit tests + `go run`. Pre-commit on `docs/**/*.md`,
`internal/`, `cmd/`, `openapi.json`, and the Worker
internal OpenAPI file when present. CI:
`.github/workflows/docs-gates.yml` runs
`go test ./cmd/ci/docnames ./cmd/ci/check-docs-code` then
`go run ./cmd/ci/check-docs-code --all` in the same job as the other docs
scanners.

- **Always:** a path, DTO type name, River job kind, or SQL
  table in public OpenAPI, Worker internal OpenAPI, Go under `internal/`
  and `cmd/` (not `cmd/ci`), or `CREATE TABLE` in
  `internal/infrastructure/store/migrations/` must
  already live in docs. Missing trees are skipped. Empty code does not
  fail. Public OpenAPI must not list `/internal/…`. A **Do not create**
  path in OpenAPI fails even if the string appears in docs.
- **After OpenAPI exists for that feature:** when a feature’s paths
  appear in OpenAPI, that file’s documented public Routes and
  route-linked DTOs must be in the spec, except a shrink-only leftover
  list in `cmd/ci/check-docs-code`. Website public arms on
  `/v1/websites`; Worker internal arms on `/internal/website-`; billing
  public arms on `/v1/billing` once that prefix exists in OpenAPI;
  `GET /v1/health` and `GET /openapi.json` are required once public
  OpenAPI exists. Feature `api.md` files with no matching OpenAPI prefix
  stay out of this ratchet.

Shared parsers live in `cmd/ci/docnames`. This pass does not check
`frontend-3` routes. DTO field constraints are `cmd/ci/check-api-dirs`.

### API home check

`cmd/ci/check-api-dirs` keeps HTTP create/call sites in the layout
homes. Unit tests + `go run`. Pre-commit on `internal/**/*.go`,
`**/*.sql`, `frontend-3/**/*.ts(x)`, `apps/demo/**/*.ts(x)`. CI:
`.github/workflows/docs-gates.yml` runs
`go test ./cmd/ci/check-api-dirs` then
`go run ./cmd/ci/check-api-dirs --all`. Empty trees pass.

- **Go Register:** `huma.Register` / `sse.Register` only in `feature/api/`
  route files (`internal/<home>/api/**`, unsplit `api.go` not under
  `pipeline/` or `store/`). `cmd/api` only **calls** feature `Register`
  helpers. Chi routes only in `infrastructure/httpapi/`. `pipeline/`
  and `store/` never Register. `internal/dto/` fails if it appears.
- **DTO files:** Huma structs live in `dto.go` until `api/dto/` at
  ~800, not in Register files. `Register` in `dto.go` / `dto/` fails.
  Health types may stay in `httpapi` `mux.go`.
- **Constrained DTOs:** `map[string]any`, `json.RawMessage`,
  `additionalProperties` tags, and string fields documented as JSON fail
  on those DTO structs. Persistence `jsonb` in `store/` is not this
  check. [HTTP conventions](api.md).
- **SQL homes:** sqlc `queries.sql` only under `store/`. `CREATE TABLE`
  only in `internal/infrastructure/store/migrations/`. `pipeline/` Go
  files must not contain SQL string literals.
- **TypeScript:** `openapi-fetch` / `createClient` only in
  `frontend-3/src/shared/api.ts` (or `shared/api/`). Call sites only in
  `frontend-3/src/features/**`. `apps/demo` must not call `/v1/`. Skip
  tests, `generated/`, `e2e/`. Not `frontend-2/`, contractor website, or
  Placis website.

### Import DAG check

`cmd/ci/check-import-dag` encodes the forbidden compile-time edges in
[package boundaries](package-boundaries.md). Unit tests + `go run`.
Pre-commit on `internal/**/*.go`, `cmd/api/`, `frontend-3/**/*.ts(x)`.
CI: `go test ./cmd/ci/check-import-dag` then
`go run ./cmd/ci/check-import-dag --all`. Missing trees no-op. Tests and
`cmd/ci` testdata are skipped.

Forbidden: `pipeline/` → `api/` or `httpapi`; features → `httpapi`
(only `cmd/api` imports it); another feature’s `store/`; `profile` →
onboarding / website / ads; `etl` → onboarding; `billing` → `ai`;
website editor Dos → `website/assistant`; `onboarding/assistant` →
`internal/assistant`; Contractor copy improvement ↔ `websiteeditor`;
`frontend-3` `cms/` → onboarding; `frontend-3` → `frontend-2`.

### File-size and folder fan-out

`cmd/ci/check-file-size` is the one walk. Unit tests + `go run`.
Pre-commit always-runs (whole tree). CI:
`go test ./cmd/ci/check-file-size` then
`go run ./cmd/ci/check-file-size --all`.

- **Size:** `docs/`, `internal/`, `cmd/`, `catalog/`, `frontend-3/` warn
  at 800 and hard-fail at 1200. Skip `docs/glossary.md` and
  `docs/features/onboarding/testing.md`. `apps/demo/src` hard-fails at
  800. Skip `**/testdata/**`.
- **Fan-out:** nested dir under `internal/` or `frontend-3/src/` ≤ 9;
  those two roots ≤ 15. Exclude `*_test.go` and `*.test.*`.

This repo’s look CI (`frontend-quality.yml`) does not run
`scripts/check-files.mjs`; docs-gates runs `check-file-size` including
`apps/demo/src`. The script stays in `apps/demo` `pnpm check` for the
look export (`demo.placis.com` has no Go).
