# Don't-say checker — worked examples

The ban list is the `## Don't say` table in `docs/glossary.md`. This file is
the pass/fail reference for `cmd/ci/check-dont-say`. The checker skips this
directory, so illustrations may contain banned words.

Unmarked = nowhere (docs, Go, backticks, table names, paths). `(website)` /
`(ads)` / `(onboarding)` / `(media)` / `(details)` / `(billing)` = the
unqualified word is allowed only in that feature’s technical docs (not
`prd.md`, not `frontend.md`) and later `internal/<home>/`. `(website)` also
covers `apps/contractor-website`.
`apps/placis-website` is scanned but is not the website home. Everywhere else
use the Say. `(in a PRD)` stays only for `CMS`. Leftover `(bare)` is unmarked.

Assume the table has `slug` (unmarked), `page (website)`, `posting (ads)`,
`interview (onboarding)`, `CMS (in a PRD)`. Covering still applies: the Say
(`website page`) does not flag the shorter Don't-say. The same covering holds
when rumdl wrap splits the Say across adjacent lines (`website` then `page`). A
Don't-say / do not say / never say instruction still covers the next wrapped
line when that line is not a new list item or heading.

## Banned synonym (unmarked) — nowhere, including code

- `docs/features/website/architecture.md`: “store the slug” → **fail**. Say
  **website prefix**.
- `internal/website/pages.go`: type `Slug` or column `slug` → **fail**. Same Say
  (or `path` / `website_prefix` once named in the glossary).
- Backticks do not help: `` `slug` `` → **fail**.

## Banned synonym (unmarked) — mint

- `docs/infrastructure/ai/voice-agent.md`: “the backend mints a secret” →
  **fail**. Say **create**.
- `docs/features/etl/ADR.md`: “mints one `enqueue_id`” → **fail**. Say
  **create**.
- `docs/general-architecture/testing.md`: “mint once per CI job” → **fail**. Say
  **create** (or **use** the testing token already created).

## Banned synonym (unmarked) — fold

- `docs/features/etl/ADR.md`: “same fold rules as onboarding” → **fail**. Say
  **live business profile** (same profile-update / conflict rules).
- `docs/features/website/editing.md`: “GET the fold” / “the folds” → **fail**.
  Say **unpublished website** (or **live business profile**).
- Hero copy “conversion copy above the fold” → **pass** (first viewport;
  extra-allowed).

## Banned synonym (unmarked) — bytes

- `docs/features/other/media/README.md`: “while bytes land” → **fail**. Say
  **photo** / **file** (the upload).
- `docs/features/website/api.md`: “send a media library item id, not bytes” →
  **fail**. Say **file**.
- Go `import "bytes"` / `bytes.Buffer` → **pass** (stdlib; extra-allowed).

## Banned synonym (unmarked) — bag / blob

- `docs/general-architecture/api.md`: “unconstrained JSON bags” /
  “not a JSON bag” → **fail**. Say **typed struct** / **named fields**.
- `docs/features/assistant/architecture.md`: “instructions blob” → **fail**.
  Say **instructions**.
- `docs/features/etl/persistence.md`: “extract blobs” / “HTML blob” →
  **fail**. Say **`etl.sources` row** / **crawled HTML** / **Extract markdown**.
- GitHub `github.com/.../blob/...` → **pass** (`/blob/`; extra-allowed).
- `new Blob(...)` / `response.blob()` → **pass** (Web API; extra-allowed).

## Banned synonym (unmarked) — grain

- `docs/docs-conventions.md`: “Persist grain” / “Grain follows Persist” →
  **fail**. Say **what Persist / Must not names**.
- `docs/general-architecture/testing.md`: “Grain is the package” → **fail**.
  Say **the cache unit is the package**.
- `docs/infrastructure/jobs.md`: “persist grain, not this unique key”
  → **fail**. Say **`website_activations`**.

## Banned synonym (unmarked) — widget

- `docs/features/other/media/README.md`: “**Widget:** Crop is a rect overlay”
  → **fail**. Say **Crop / focal**.
- `docs/features/onboarding/ADR.md`: “onboarding-only widget for a Details
  field” → **fail**. Say **control**.
- `docs/features/placis-website/ADR.md`: “interactive widgets share a file”
  → **fail**. Say **islands**.

## Banned synonym (unmarked) — well (image gallery)

- `docs/features/onboarding/frontend.md`: “the work-photo well” / “the well
  scrolls” → **fail**. Say **onboarding image gallery**.
- `docs/features/ads/ad-generation/frontend.md`: “image well” → **fail**. Say
  **ads image gallery**.
- `docs/features/website/frontend.md`: “photo well” on Content → **fail**. Say
  **website editor image gallery**.
- “as well” / “well-defined” / “reads well” → **pass** (not the UI control).

## Self-understood at home — website `page`

- `docs/features/website/architecture.md`: “each page has sections” → **pass**
  (`page (website)`).
- `docs/features/website/prd.md`: “each page has sections” → **fail**. PRDs are
  product-facing. Say **website page**.
- `docs/features/website/frontend.md`: same as PRD → **fail**.
- `docs/features/onboarding/pipeline/05-select-and-copy-website-template.md`:
  “create the page” → **fail**. Onboarding is not the website. Say
  **website page**.
- `docs/features/ads/ad-generation/technical-implementation.md`: “landing page”
  if it matches `\bpage\b` → **fail**. Say **website page**.
- Same ads file: “website page” → **pass** (covering).
- `docs/features/website/architecture.md`: “route `/preview/page`” → **pass**
  (home-scoped token inside a `/` path is skipped).
- Later `internal/website/page.go`: `type Page struct` → **pass** (home
  package). `internal/ads/page.go` → **fail**.
- `apps/contractor-website/src/middleware.ts`: “render the page” in a
  `.md`/`.go` file → **pass** (website home).
- `apps/placis-website/README.md`: “the page” → **fail**. The Placis website is
  not the contractor website home. Say **website page**.

## Self-understood at home — ads `posting`

- `docs/features/ads/ad-generation/technical-implementation.md`: “move the
  posting to needs review” → **pass**.
- `docs/features/website/architecture.md`: “the posting” → **fail**. Say
  **ad posting**.
- `docs/features/ads/ad-generation/prd.md`: “the posting” → **fail**. Say
  **ad posting**.

## Self-understood at home — ads `preview`

- `docs/features/ads/ad-generation/technical-implementation.md`:
  “format-accurate preview” → **pass** (`preview (website, ads)` in a technical
  ads doc).
- `docs/features/ads/ad-generation/prd.md`: “the preview” → **fail**. Say
  **ad format preview**.
- `docs/features/ads/ad-generation/frontend.md`: “Facebook + Instagram preview”
  → **fail**. Say **ad format preview**.
- Same frontend file: “ad format preview” → **pass** (covering).

## Self-understood at home — onboarding `interview`

- `docs/features/onboarding/pipeline/01-find-business.md`: “after the interview”
  → **pass**.
- `docs/features/website/editing.md`: “after the interview” → **fail**. Say
  **client interview**.
- `docs/README.md`: “interview” → **fail**. Say **client interview**.

## `CMS (in a PRD)` — unchanged, not a junk drawer

- `docs/features/website/prd.md`: “open the CMS” → **fail**. Say website editor
  / Details / Media library / Ads.
- `docs/features/website/architecture.md`: “the CMS is the umbrella” → **pass**.
- Do **not** put `slug` or `idempotent` in this bucket.

## Leftover `(bare)` in the table

- `slug (bare)` still in the glossary → treated as **unmarked** (fail
  everywhere). It does not keep today’s skip-in-code behavior.

## What a leftover rewrite looks like

- Ads technical doc “crop is normalized” → “crop is stored as 0–1 coordinates”
  (or the Say **combine / turn into** where that is the meaning).
- Development principles “walking skeleton” is already extra-allowed; do not
  write “huma skeleton”.
- Architecture “runtime validation” → “validation when the request is handled”
  (do not name the contractor website a runtime; do not use `runtime` as a
  synonym).

## Banned synonym (unmarked) — kind

- `docs/features/etl/persistence.md`: column `kind` or
  `kind=google_maps_listing` → **fail**. Say **ETL run kind** /
  `etl_run_kind=google_maps_listing` (or ETL source kind, thread kind, photo
  kind, imported media kind as appropriate).
- `internal/etl/run.go`: type `Kind` → **fail**. Say **ETLRunKind**.
- `etl_run_kind=google_maps_listing` / “ETL run kind” → **pass** (covering).
- Bare “ETL kind” / “source kind” → **fail**. Say **ETL run kind** /
  **ETL source kind**.
- Do **not** extra-allow `kind=` or `.kind`.

## Banned synonym (unmarked) — fast extract / slow extract / fast crawl / slow crawl

- `docs/features/etl/pipeline/README.md`: “Fast extract then slow extract” →
  **fail**. Say **ETL fast extract** / **ETL slow extract**.
- `docs/features/etl/pipeline/website-crawl.md`: “a fast crawl” / “slow crawl”
  → **fail**. Say **ETL fast crawl** / **ETL slow crawl**.
- “ETL fast extract” / “ETL slow extract” / “ETL fast crawl” /
  “ETL slow crawl” → **pass** (covering).
- No extraAllowed for the bare forms. ETL docs are not a home.

## `setup` in testing docs

The onboarding Don't-say token is skipped in `testing.md` and `**/testing/**`,
in `docs/docs-conventions.md`, in `docs/general-architecture/ci-cd.md`, and
in `cmd/ci/check-pipeline-tables/` and `cmd/ci/check-happy-path/` (the
closed `#### Setup` heading). Fixture headings stay **Setup** /
**Exercise** / **Verify**.

- `docs/features/onboarding/pipeline/testing/01-find-business.md`: “**Setup**:
  …” → **pass**.
- `docs/docs-conventions.md`: “`####` is closed: **Setup**” → **pass**.
- `docs/features/onboarding/technical-implementation.md`: “setup” → **fail**.
  Say **onboarding**.
