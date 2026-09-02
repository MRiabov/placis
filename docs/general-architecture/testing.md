# Testing

## Test types

Three tiers, and they are not interchangeable:

- **Unit** — one function/service in isolation; internal collaborators are
  faked. No DB, no network.
- **Integration** — asserts the API on one side, with
  **internal services real, not mocked**: **backend-only** (handler → service →
  sqlc → real Postgres, no frontend; HTTP via `humatest`) or
  **frontend-only** (the frontend asserting against the API). Only Google,
  the LLM, voice, and Stripe are
  faked. The contractor-website **Worker** is real (container; no)
  `wrangler deploy`) when the test calls `websiteRender` or
  `websitePublication`. R2 / `purge_cache` are faked (paid Cloudflare).
- **E2E** — **both sides real**: Playwright drives `frontend-2` against the real
  Go API + real Postgres. A full contractor/owner/website-visitor journey.
  Website / onboarding E2E that hit 03 or 04 start the Worker container.
  Live GET does not call Go. R2 / `purge_cache` stay faked.

Agents must not substitute a unit test where an integration or E2E test is
required — stubbing an E2E with unit tests is a failure, not a pass.

## The rule

At least **one E2E test per feature** — a "feature" is a directory under
`docs/features/`. E2E is **full-stack**: a Playwright test drives `frontend-2`
(the real UI) against the real Go API and a real Postgres (Testcontainers), with
migrations run. Only Google, the LLM, and voice are faked. Website /
onboarding E2E that hit 03 or 04 also run the Worker container. Each E2E
asserts both
what the UI shows and the DB rows. A feature does not pass without its E2E test
green.

Each feature defines its E2E test in its own `testing.md`, spelling out the
tables that journey reads and writes at Persist grain (names come from that
feature's `persistence.md`). Every table in that persistence file must appear
in `testing.md` and/or `pipeline/testing/`
([docs conventions](../docs-conventions.md#named-identifiers)). Do not require
a bullet per Routes row. Pipeline integration tests pair
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

Every feature that stores tenant-owned rows must have an **integration** test
that creates two tenants and asserts reads, writes, and **files** are blocked
across them. This is in addition to the per-feature E2E rule above. Auth spells
out the two-tenant case in
[auth testing](../features/other/auth/testing.md).

A feature's E2E must run when **that** feature's UI or API changed. Unrelated
features may stay skipped. Incremental selection is a feedback optimization — it
is not evidence that skipped tests were re-executed. Full escape hatches:
`go test -count=1 ./...`, `vitest run`, `playwright test`.

## Incremental testing

CI restores caches and skips work the runners already know how to skip. Local
loops use the same tools. CI still invokes the tools directly, not `just`. See
[ci-cd.md](ci-cd.md) for cache paths and flags both runners must share.

- **Go** — `go test ./...` in package-list mode caches successful packages in
  `GOCACHE`. A hit prints `ok (cached)` and does not re-run the binary. Grain is
  the package, not `TestFoo`. Do not pass `-count=1` on the ordinary PR job
  (that flag disables the cache). `go test` with no package args, or
  `go test foo_test.go`, never caches. Failures always rerun. Unchanged
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

- **Clerk** is the one external dependency that is *not* faked. Backend tests
  use the official Clerk Go SDK (`Sessions().Verify`, `Organizations().Create`,
  and so on) — never a fake verifier, never hand-rolled JWT or JWKS. The SDK
  fetches and caches JWKS; app and test code must not decode tokens. Playwright
  **testing tokens** (bot-protection, `__clerk_testing_token`) are a different
  path: create once per CI job (`clerkSetup()` or the Backend API), put
  `CLERK_TESTING_TOKEN` in the job env, and reuse it. Attaching that token to a
  new Playwright page is fine; fetching a new token per spec or worker is not.
  Signed-in Playwright tests write `storageState` once per job, then
  `test.use({ storageState })`. Do not re-sign-in per spec.
- **Stripe** uses test mode the same way: real SDK + test keys, no real charge.
- **`humatest`** — backend-only tests that hit the API use Huma's
  `humatest` (the faster in-process API: `api.Get` / `api.Post`, no
  listen). Do not start a real HTTP server for those tests. Playwright
  E2E still drives `frontend-2` against the real Go process.
- Fakes for Google, the LLM, Stripe, and voice live in the repo (see
  [ci-cd.md](ci-cd.md)); tests never spend money or reach production APIs.
