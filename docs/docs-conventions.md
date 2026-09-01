# Docs conventions

How the `docs/` tree is structured and written, so it stays consistent. Read
before adding or editing a doc.

## Layout

- `README.md` — the router (reading order + canonical references).
- `glossary.md` — the ubiquitous language (`## Domain` / `## Enums` /
  `## Internal` / `## Don't say`; parent terms as `###`, children as `####`
  under Website, Ad, Onboarding; closed label sets live under Enums); the
  only place names are coined. Designers get this file whole.
- `development-principles.md` — how work is sliced and reviewed.
- `general-prd.md` — product-level loop and in/out of scope (pointers to feature
  PRDs).
- `general-architecture/` — cross-cutting architecture no single feature owns:
  `backend-stack.md`, `frontend-stack.md`, `module-layout.md`, `processes.md`,
  `package-boundaries.md`, `api.md` (HTTP conventions + index of per-feature
  `api.md` files), `llm-layer.md`, `voice-agent.md`, `audit.md`, `jobs.md`,
  `files-and-s3.md`, `persistence.md` (conventions + index of per-feature
  tables), `frontend.md` (`frontend-2` UI rules), `cms/` (The CMS: left nav,
  `/cms` two cards, look tokens), `frontend-debloat.md` (cross-cutting port),
  `ci-cd.md`, `testing.md`. Feature-owned capabilities (website
  activation/payments, leads, media library, ETL, business profile, assistant,
  billing) live under `features/`, not here.
- `features/<feature>/` — one directory per feature, **vertical** (all of that
  feature's docs in one place). `features/business-profile/` holds Details,
  Projects, and Certifications and reviews as child view dirs. `features/other/`
  is auth, media library, leads.
- Look lives in [`apps/demo/`](../apps/demo/README.md), not under `docs/`. Do
  not start look work outside that app. The designer checkout
  (`demo.placis.com`) gets the Vite app via `scripts/sync-look-demo.sh` and
  product/look Markdown via `scripts/export_designer_docs.py`. Specs remain
  canonical. CMS is the token source of truth.
- `planning/` — proposed, unshipped work; never the canonical source. The
  `frontend-2` port index is [planning/frontend-debloat.md](planning/frontend-debloat.md); per-feature cut
  lists live with the feature as `frontend-debloat.md`.

## Per-feature structure

A feature directory holds, as applicable:

| File | Purpose |
| --- | --- |
| `README.md` | overview + pointers |
| `prd.md` | business requirements, user stories, acceptance criteria (domain language) |
| `ADR.md` | architectural decision record (numbered, dated; keep old entries) |
| `design-decision-record.md` | design decision record (look and interaction, not architecture). Same numbered, dated, keep-old-entry structure as ADR.md. One number is one decision. **Why** is owner-written; omit it rather than inventing it. |
| `architecture.md` | the logic: content/component model, flows, states. Named services index when the feature is defined. Not Go struct bodies. |
| `persistence.md` | that feature's tables. Defined features: `## Tables` / `## Indexes` with Columns, Enums, Uniques, Written by, Notes. Shared tables are linked, never copied. |
| `api.md` | Canonical HTTP for this feature. Defined features: `## DTOs`, `## Routes` (one table), `## Do not create`. Not Go struct bodies. Conventions: [general-architecture/api.md](general-architecture/api.md). |
| `technical-implementation.md` | pipeline, validation, testing — references `persistence.md` and `api.md`; does not re-define tables or routes |
| `frontend.md` | screens and fields, when the UI is well-defined (the **target**) |
| `frontend-debloat.md` | port instructions for `frontend-2`: keep / delete / do not port / retarget onto the constrained API. Unshipped. Same headings in every file. Index: [planning/frontend-debloat.md](planning/frontend-debloat.md). Contractor website API: [website/port-contractor-website.md](features/website/port-contractor-website.md). Cut list: [website/contractor-website-debloat.md](features/website/contractor-website-debloat.md) |
| `testing.md` | the owner E2E (or ETL integration) with DB asserts at Persist grain. Every persistence table is asserted here and/or in `pipeline/testing/`. |
| `pipeline/` | one doc per step (`01-…`, `02-…`, `04a-…`, …) + a `README.md` that gathers them, and `pipeline/testing/` with one integration-test doc per step (complex pipeline). Closed `##` on step files (see Named identifiers). |
| `ai-layer.md` | the LLM's tools/pipeline (only for one-shot, non-pipelined features) |

Not every file is needed — a feature uses only the ones it has content for. A
complex pipeline uses `pipeline/` and **not** `ai-layer.md`; a one-shot AI use
has `ai-layer.md` and **not** `pipeline/`.

## Markdown formatting

First-party Markdown is formatted and linted with [rumdl](https://github.com/rvben/rumdl) (standard flavor).
Config: [`.rumdl.toml`](../.rumdl.toml).

- **Line wrap:** 80 characters. Auto-reflow (`MD013`, `reflow-mode = "default"`)
  splits lines that exceed 80 at word boundaries. Tables and fenced code are not
  wrapped.
- **Tables:** compact separators (`| --- | --- |`), not padded dash rows
  (`MD060`).
- **When it runs:** pre-commit `rumdl-fmt` reflows staged Markdown on `git
  commit`. Then `rumdl-fmt-check` and `rumdl` always run `fmt --check` and
  `check` on all tracked Markdown (not untracked files), so rebase leftovers
  fail locally the same way CI does. Install once per clone: `pre-commit
  install`. Worktrees share `.git/hooks`. Do not skip hooks. If `rumdl-fmt`
  rewrites staged files, restage and commit again. `rumdl fmt` is optional if
  you want to see wrapping before commit.
- **CI:** `.github/workflows/rumdl.yml` runs `rumdl fmt --check` then
  `rumdl check` on pull requests. CI never rewrites files.
- **Out of scope:** `.agents/` (imported and first-party skills) and
  `**/testdata/**` (Don’t-say fixtures). New first-party `.md` files are
  included automatically.
- **File size:** after wrap, a doc over 800 lines must be split (hard error at
  1200). Exception: `glossary.md` stays one file (Don’t-say table + ubiquitous
  language).
- **Lint:** default rumdl rules except MD057 (relative link exists). Many
  first-party docs have pre-existing wrong `../` depths; re-enable when those
  links are fixed.

## Rules

- **Vertical**: a feature's docs live in one `features/<feature>/` dir;
  cross-cutting stuff lives in `general-architecture/`. Don't split one concern
  across both.
- **One definition per concept**: each feature's tables live in that feature's
  `persistence.md`. A table used by more than one feature lives in one owning
  file and is linked, never copied.
- **Domain language in product docs** (PRD, README, user stories);
  implementation terms stay in the technical docs
  (`technical-implementation.md`, per-feature `persistence.md`, ADR) and code.
  See `glossary.md`.
- **New names come from the glossary** — coin a word there first, never in a
  PRD. The glossary defines terms; it never prescribes.
- **Named identifiers** (below): tables, routes, DTO **type names and
  fields**, and major services are specified **before** code. Do not dump
  Go struct bodies or OpenAPI YAML. Do not invent names at implementation
  time.
- **Filenames hyphenate; prose does not.** `design-decision-record.md` is the
  file. The document is a **design decision record** — the look-and-interaction
  counterpart of ADR.md. Link the file as `[CMS design decision record](...)` 3,
  not `[CMS design-decision-record]` and not bare **decisions**. One numbered
  entry is one decision (do not pack a screen’s look into a single entry).
  **Why** is owner-written; omit it when it is not known. Keep the hyphen in the
  path and in backticks. `ADR.md` is the **architectural decision record**; do
  not label it **decisions** either.

## Named identifiers

A feature is **ill-defined** until tables, columns, routes, DTO type names
and fields, and major service functions are named in technical docs
(`persistence.md`, `api.md`, `architecture.md`, `pipeline/`, `testing.md`).
Not in PRDs or `frontend.md`. Do not dump Go struct bodies or OpenAPI YAML.
Every identifier is backticked, glossary-derived, and the same spelling in
spec, code, and tests (`website.menus`, not “the menus table”;
`WebsitePageRead`, not “the page payload”). Do not say **uses** or
**accepts**.

### Verbs

Tables:

- **persists into** — INSERT/UPDATE this table (or named columns)
- **reads** — SELECT this table
- **must not write** — pipeline Must not; keep table names backticked

HTTP: Routes **Request** / **Response** name a row from `## DTOs`. Do not
repeat field lists on the route.

Other objects:

- **sends** — outbound body where Go is the HTTP caller (Worker, LLM)
- **loads** — website template catalog or website component catalog sidecar
- **calls** — named service function, Worker operation, or River job

HTTP example: `PATCH /v1/website/editor/pages/{page_id}` — Request
`WebsitePageUpdate`, Response `WebsiteEditApplyRead`, persists into
`website_slots` / `edit_history`.

Pipeline example: `GenerateWebsiteCopy` **calls** `websiteRender`,
**sends** `WebsiteRenderRequest`, **reads** unpublished `website_pages`,
**persists into** `website_slots`.

### Three pairing rules

`persistence.md` and `api.md` are the named lists. `pipeline/` is the ordered
write. Tests prove the names. Influence is one-way; do not stuff website
editor GET into pipeline 01–04.

1. **Pipeline only names existing lists.** A backticked table or HTTP
   path in `pipeline/` must already live in some `persistence.md` or a
   Routes **Method + path** cell. Match the path as written (`GET /v1/…`,
   later `/v2/…`, `POST /internal/…`). Do not match a raw `v1` token.
2. **Test docs assert every persistence table.** Every table in that
   feature’s `persistence.md` is asserted at least once in `testing.md`
   and/or `pipeline/testing/*.md`. Grain follows Persist / Must not (see
   Named asserts). The same table **may** appear in several files.
   `testing.md` is the owner journey (ETL: integration, no owner UI). It
   only asserts what that journey reads or writes. Do not invent writes in
   the E2E for tables another test file already asserts. Do not leave a
   persistence table with no assert in either place. Do not require a
   bullet per Routes row. **Do not create** stays untested.
3. **Every table has a write path.** **Written by** on that table’s
   persistence entry: pipeline function, Routes method+path, or job.

### Named asserts

Grain follows **Persist** / **Must not**, not a mandatory
table+column+predicate triple.

- Persist names a **table** → testing asserts that table (row exists,
  empty, unchanged, one row).
- Persist names **table.column** → testing asserts that column. Add a
  short predicate only if the test would check it (`status=unpublished`,
  empty, unchanged). Not a SQL dump. Not a jsonb tree essay.
- Must not write a **table** → testing asserts that table stayed empty /
  unchanged. No column.
- Prior-step fixture “already from a prior step” names the **tables** that
  step persisted. Do not repeat that step’s column predicates.
- Non-Postgres objects stay named as themselves (R2 key, Worker op).

Ban “Assert Details transform lands”, “assert the copy”, “profile posts /
reviews” with no table. CI checks **table names** only; columns are a
writing rule.

### Closed headings

`##` lists are closed. Extra `##` is how unstructured essays return.

**`api.md`** — intro prose (Auth default, Idempotency-Key, feature serve-only
rows that are not in [HTTP conventions](general-architecture/api.md)), then only:

- `## DTOs` — when the feature is defined; do not add an empty stub
- `## Routes`
- `## Do not create`

Ban at `##`: `Complete`, `Serve only types on HTTP`, per-type essays.
`###` only as Routes overflow: `### METHOD /path` when a table cell would
be a paragraph. No `###` under DTOs.

**`persistence.md`** — intro, then only `## Tables` and `## Indexes`.
Overflow is `###` under a table, not a new `##`.

**`testing.md`** — H1 + numbered journey. No required `##`. Optional `##`
only to split journeys (`## CMS`). Ban `## Routes`, `## DTOs`, `## Tables`,
`## Do not create`, and `### GET /v1/…`.

**`pipeline/` step files** — intro, then only:

- Required: `## Trigger`, `## Pre`, `## Must not`, `## Do` (also
  `## Do — <phase>`), `## Persist`, `## Fail`, `## Out`, `## Invariants`
- Optional: `## Reads`, `## Loads`, `## Sends`, `## Calls`

**Do** names the step’s own function (backticked, first sentence). Ban
`## In code`, `## Routes`, SLO titles, and other essays. Overflow is
`###` under the matching closed heading. `pipeline/README.md` is a
gatherer — not this list. `pipeline/testing/` keeps bold fixture / invoke /
assert / fail / mocked / cases labels, not `##`.

### `api.md` shape (defined features)

`## DTOs` — table **DTO** | **Fields** | **Description**. Fields are
backticked names only. Nested types get their own rows. No `minLength` /
`enum` in the table. One `*Read` / `*Create` / `*Update` per entity.

`## Routes` — **one table**, fixed columns (empty cell = N/A; do not drop
columns). One row per operation:

- **Method + path** — `GET /v1/billing/usage`,
  `POST /internal/website-render`. Never path-only, never
  `GET … / PATCH …` in one row.
- **Callers**, **Request**, **Response**, **Reads**, **Persists into**,
  **Behavior**, **Errors**, **Must not**

Auth in a row only when it differs from the file intro. Query params live
on the Request DTO.

### `persistence.md` shape (defined features)

`## Tables` then one `### \`table_name\`` (qualified when needed:
`website.menus`). Closed keys; omit an empty key:

- **Columns:** backticked names plus `fk` / `nullable` when that is the
  contract. Keep `jsonb` where that is the contract. No enum sets here.
- **Enums:** closed check-constraints (`page_type` → `home` / `about` /
  …). Glossary = meaning; persistence = which column.
- **Uniques:** `(tenant_id, path)`, …
- **Written by:** function, Routes method+path, or job.
- **Notes:** one line. Overflow as `###` under that table.

`## Indexes` — as billing already does.

Major features that must eventually satisfy this contract: ads, assistant,
billing, ETL, onboarding, website. Website is the first fully defined
feature. CI: [ci-cd.md](general-architecture/ci-cd.md).
