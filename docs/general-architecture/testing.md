# Testing

## Test types

Three tiers, and they are not interchangeable:

- **Unit** — one function or helper with I/O cut off. No DB, no network, no
  router. Not specified in feature `testing.md` (drop Auth gate /
  `AuthGate.test.tsx`).
- **Integration** — **one side**, not both.
  - **Backend** (`humatest`, no `frontend-2`): handler → service → sqlc is
    real. **Testcontainers Postgres** and **Testcontainers MinIO** (throwaway
    containers, not `just servers-up` MinIO). Product language can still say
    R2 keys; integration storage is MinIO. Always fake the LLM. Prefer fake
    Clerk (SDK-boundary `Principal`) — real Clerk slows the suite. Still fake
    Google, voice, and Cloudflare `purge_cache`. Stripe test-mode SDK is
    allowed. Do **not** start the Worker container on the general backend
    job. Start it only when that test **calls** `websiteRender` or
    `websitePublication` (Worker job).
  - **Frontend** (jsdom / Vitest, no Go): real React, real router, MSW. The
    unit is not “two or more screens.” One route is still integration
    (`/cms/website`). Completeness is one owner-journey **HappyPath Full**
    per feature that has contractor UI. Not one Vitest file per OpenAPI
    op, not one per pipeline step. **Verify** is UI plus MSW saw the
    Method+path — not Postgres.
  - **Worker** — HappyPath of the Worker, different CI job: real Worker
    container, `TestHappyPathInternalWebsiteRender` for
    `POST /internal/website-render`. Path-filter:
    `apps/contractor-website/`, the Worker internal OpenAPI file, and Go
    callers of `websiteRender` / `websitePublication`.
- **E2E** — **both sides real**: Playwright drives `frontend-2` against the
  real Go API + real Postgres. A full contractor/owner/website-visitor
  journey. Website / onboarding E2E that hit 03 or 04 start the Worker
  container. Live GET does not call Go. E2E storage may still fake paid
  Cloudflare; MinIO is the **integration** rule.

Agents must not substitute a unit test where an integration or E2E test is
required — stubbing an E2E with unit tests is a failure, not a pass.

A feature is **more complete** when its HappyPath tests pass. Edge cases
(`#### Fail`, isolation, 4xx) come after.

## HappyPath matrices

Backend HappyPath integration covers HTTP paths. If the API works over
`humatest` (`api.Get` / `api.Post`, handler → service → sqlc), it
works. A Postgres `SELECT` after a write does not prove the matching
read Route. Pipeline tests prove Persist, not Routes.

Two OpenAPI specs and structured `api.md` Routes. Each public or Worker
operation needs both:

1. `### TestHappyPath*` in the owning `testing.md` under
   `## Integration` (prefix `TestHappyPath`, not
   `TestPipelineHappyPath`, not frontend `HappyPath*Full`). **Setup** is
   backend. **Exercise** names exactly one Method+path literal. **Verify**
   through HTTP (create then `GET` and assert it exists; delete then
   `GET` and assert gone; or the Exercise body). Named persistence
   verifies may supplement. Extra Method+path in Verify does not cover
   another Route.
2. `func TestHappyPath*` that hits **exactly that one** Method+path as a
   literal (`api.Get("/v1/…")` or `"GET /v1/…"`).

Required ops come from **Method + path** cells in defined feature
`api.md` (website, billing, ads, assistant, onboarding, auth, media
library) plus HTTP conventions `GET /v1/health` and
`GET /openapi.json`. Skip **Do not create**. Skip unstructured leftover
extra-`##` files (Details, Projects, website leads). Flow tests also hit
some paths; they do not replace the 1:1 row. `TestPipelineHappyPath*` is
not a 1:1 row (`TestHappyPath` prefix only). CI:
`cmd/ci/check-happy-path` `--public` / `--worker`. Two leftover files:
`leftover_docs.go` (`###` missing) and `leftover_tests.go` (`func`
missing). A heading does not shrink the tests leftover; a func does
not shrink the docs leftover. A missing spec file no-ops that walk;
docs leftover still runs. Once a spec has ops, missing tests fail with
no leftover.

Owning `testing.md` (ads Routes live in `ads/api.md` but tests live
under ad-generation):

- website → `docs/features/website/testing.md` (includes
  `/internal/…`)
- ads → `docs/features/ads/ad-generation/testing.md`
- billing / assistant / onboarding → that feature’s `testing.md`
- auth / media library → `docs/features/other/{auth,media}/testing.md`
- `GET /v1/health`, `GET /openapi.json` → this file. Do not add
  `## Integration` until those leftover rows drop.

Examples:

- **Public** (`GET /openapi.json` / exported `openapi.json`):
  `TestHappyPathV1WebsiteEditorPagesReturnsPages` for
  `GET /v1/website/editor/pages`. `TestHappyPathV1MediaAssetsReturnsList`
  for `GET /v1/media-assets`. Also `GET /v1/health`, `GET /openapi.json`.
- **Worker** (internal OpenAPI file):
  `TestHappyPathInternalWebsiteRender` for `POST /internal/website-render`.

Pipeline (not OpenAPI 1:1). Every `pipeline/` needs **both**:

- Per paired step: `TestPipelineHappyPathWebsite01SelectWebsiteTemplate`
  ↔ `pipeline/testing/01-select-website-template.md`. Unnumbered stems
  (ETL `google-maps.md`, onboarding `build-profile.md`) use PascalCase of
  the filename. Skip **Do not run** (onboarding `04b`). Skip gatherers and
  testing-only `worker-internal.md` (Worker OpenAPI 1:1).
- Whole pipeline: exactly `TestPipelineHappyPath{Feature}Full`
  (`TestPipelineHappyPathWebsiteFull`, `OnboardingFull`, `AdsFull`,
  `EtlFull`). Testcontainers Postgres + MinIO. Worker container only if
  that pipeline **calls** `websiteRender` / `websitePublication`. Do not
  name a step file `full.md`.

CI: `check-pipeline-tables` leftover of current names until the Go funcs
exist (extras may only shrink).

Frontend completeness (documented, not CI-asserted this pass):

| Feature | Vitest HappyPath Full | Not required |
| --- | --- | --- |
| Ads | `HappyPathAdsFull` — list → download | 01–04 Vitest files |
| Onboarding | `HappyPathOnboardingFull` — Find → preview/pay | 01–09 Vitest files |
| Website | `HappyPathWebsiteFull` — website editor → Publish | one test per website Route |
| Auth | `HappyPathAuthFull` — `/login` → `setActive` → `/cms` | `AuthGate.test.tsx` |
| Billing | `HappyPathBillingFull` — Usage & billing → cancel / keep / pay-again | one test per billing Route |
| Assistant | `HappyPathAssistantFull` — CMS dock | one test per assistant Route |
| Media library | `HappyPathMediaFull` — `/cms/media` upload → crop | one test per media library Route |
| ETL | none (no owner UI) | |

Extra frontend HappyPath only for real screen branching. Names include
**HappyPath**; **Full** only on that journey.

`### METHOD /path` stays banned. Frontend Full and pipeline `{Feature}Full`
stay extra `###`; they do not fill a 1:1 row.

## The rule

At least **one E2E test per feature** that has owner UI — a "feature" is a
directory under `docs/features/`. ETL has no owner UI (onboarding E2E covers
02). E2E is **full-stack**: Playwright drives `frontend-2` against the real
Go API and a real Postgres (Testcontainers), with migrations run. Only
Google, the LLM, and voice are faked. Website / onboarding E2E that hit 03
or 04 also run the Worker container. Each E2E verifies both what the UI
shows and the DB rows. A feature with owner UI does not pass without its
E2E test green.

Each feature defines its E2E and/or integration tests in its own
`testing.md` (`## E2E` / `## Integration`; unit tests are not specified
there), spelling out the tables those tests read and write that Persist /
Must not names (from that feature's `persistence.md`). Every table in
that persistence file must appear in `testing.md` and/or `pipeline/testing/`
([docs conventions](../docs-conventions.md#named-identifiers)). Do not require
a bullet per Routes row; each structured Route needs
`### TestHappyPath*` (leftover until the heading lands). Pipeline
integration tests pair
`pipeline/<name>.md` ↔ `pipeline/testing/<name>.md` (step tables).

- [assistant](../features/assistant/testing.md)
- [onboarding](../features/onboarding/testing.md)
- [ETL](../features/etl/testing.md) — integration (no owner UI); onboarding E2E covers 02
- [website](../features/website/testing.md)
- [ads](../features/ads/ad-generation/testing.md)
- [media library](../features/other/media/testing.md)
- [auth](../features/other/auth/testing.md)
- [Placis website](../features/placis-website/testing.md) — static origin only (no Go / Postgres)

## Cross-tenant isolation

Every feature that stores tenant-owned rows must have a **backend
integration** test that creates two tenants and verifies reads, writes, and
**files** are blocked across them (`humatest` → real Postgres). Do not
specify it as Playwright. This is in addition to the per-feature E2E rule
above. Auth spells out the two-tenant case in
[auth testing](../features/other/auth/testing.md) `## Integration`.

A feature's E2E must run when **that** feature's UI or API changed. Unrelated
features may stay skipped. Incremental selection is a feedback optimization — it
is not evidence that skipped tests were re-executed. Full escape hatches:
`go test -count=1 ./...`, `vitest run`, `playwright test`.

## Incremental testing

CI restores caches and skips work the runners already know how to skip. Local
loops use the same tools. CI still invokes the tools directly, not `just`. See
[ci-cd.md](ci-cd.md) for cache paths and flags both runners must share.

- **Go** — `go test ./...` in package-list mode caches successful packages in
  `GOCACHE`. A hit prints `ok (cached)` and does not re-run the binary. The
  cache unit is the package, not `TestFoo`. Do not pass `-count=1` on the
  ordinary PR job (that flag disables the cache). `go test` with no package
  args, or `go test foo_test.go`, never caches. Failures always rerun. Unchanged
  Testcontainers packages skip starting Postgres; that is intended. A cached
  pass will not re-run an unchanged flaky package — accept that for PR cost; use
  `-count=1` when a full suite is required.
- **Vite** — `node_modules/.vite` (default `cacheDir`) stores dependency
  pre-bundles and transformed modules. Restoring it speeds `vitest run`,
  `vite build`, and Playwright `webServer`. It does **not** skip tests. The
  Vitest results file under the same dir only changes failed-first ordering.
  Persist `.frontend-quality-cache/*.tsbuildinfo` for faster typecheck. Do not
  enable `experimental.fsModuleCache`.
- **Vitest** — `"test": "vitest run"` always runs the full file set. Skip files
  with `vitest run --changed origin/main` (git + static import graph, not
  coverage). Empty selection is a pass (`--passWithNoTests` where needed). Needs
  a non-shallow checkout or an explicit fetch of `origin/main`. Changing
  `vitest.config.ts` or `package.json` already force-reruns the whole suite.
  Local day-to-day: `vitest` watch, or `vitest run --changed`.
- **Playwright** — there is no `ok (cached)` for a passing spec. Split three
  costs: persist Chromium at `~/.cache/ms-playwright` (lockfile key; Chromium
  only; `playwright install chromium` without `--with-deps`); persist Vite/Astro
  transform caches for `webServer`; skip specs with
  `playwright test --only-changed=origin/main` (TypeScript import graph). That
  graph cannot see Go, SQL, or OpenAPI — force the **full** list for that job
  when `internal/`, `cmd/`, `migrations/`, `openapi.json`, the Worker
  internal OpenAPI file, Playwright config, `package.json`, or
  `pnpm-lock.yaml` change. Path-filter `frontend-2` e2e unless
  `frontend-2/`, `packages/website-components/`, Go, migrations, or
  `openapi.json` changed. Path-filter `apps/placis-website` e2e unless that app
  (or its shared packages) changed. Do not `--shard` until one job with workers
  is still too slow (shards multiply hosted minutes and Clerk traffic). Do not
  restore `storageState`, Clerk cookies, or `test-results/` **across** jobs.
- **Playwright workers** — not `--shard`. Drop a global `workers: 1`. Default
  workers for specs that do not hit Clerk's Frontend API. Specs that create or
  present a Clerk testing token (sign-in, signed-out `/login`, `setActive`,
  bot-protection bypass) stay on a serial project (`workers: 1`) because testing
  tokens are **2 requests per second**. Cap non-Clerk workers only if the runner
  runs out of memory (then `workers: 2`, not a global `1`). Do not start a
  second Vite for `../frontend` when that tree is absent.

## Notes

- **Clerk** — default **fake** on backend integration (SDK-boundary
  `Principal`; does not decode JWTs). App code uses the official Clerk Go SDK
  (`Sessions().Verify`, `Users().Create`, `Organizations().Create`) — never a
  hand-rolled JWT or JWKS. Playwright is the one place Clerk is *not* faked:
  **testing tokens** (bot-protection, `__clerk_testing_token`) once per CI job
  (`clerkSetup()` or the Backend API), `CLERK_TESTING_TOKEN` in the job env,
  reuse it. Attaching that token to a new Playwright page is fine; fetching a
  new token per spec or worker is not. Signed-in Playwright tests write
  `storageState` once per job, then `test.use({ storageState })`. Do not
  re-sign-in per spec. Do not restore `storageState` across jobs.
- **Stripe** uses test mode the same way: real SDK + test keys, no real charge.
- **`humatest`** — backend-only tests that hit the API use Huma's
  `humatest` (the faster in-process API: `api.Get` / `api.Post`, no
  listen). Do not start a real HTTP server for those tests. Playwright
  E2E still drives `frontend-2` against the real Go process.
- Fakes for Google, the LLM, Stripe, and voice live in the repo (see
  [ci-cd.md](ci-cd.md)); tests never spend money or reach production APIs.
  Integration object storage is MinIO. `purge_cache` stays faked.
