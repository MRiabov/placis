# Docs conventions

How the `docs/` tree is structured and written, so it stays consistent. Read before adding or
editing a doc.

## Layout

- `README.md` — the router (reading order + canonical references).
- `glossary.md` — the ubiquitous language (`## Domain` / `## Enums` / `## Internal`; parent terms as
  `###`, children as `####` under Website, Ad, Onboarding; closed label sets live under Enums); the
  only place names are coined.
- `development-principles.md` — how work is sliced and reviewed.
- `general-prd.md` — product-level loop and in/out of scope (pointers to feature PRDs).
- `general-architecture/` — cross-cutting architecture no single feature owns:
  `backend-stack.md`, `frontend-stack.md`, `module-layout.md`, `processes.md`,
  `package-boundaries.md`, `api.md` (HTTP conventions + index of per-feature `api.md` files),
  `llm-layer.md`, `voice-agent.md`, `audit.md`, `jobs.md`,
  `files-and-s3.md`, `persistence.md`
  (conventions + index of per-feature tables), `frontend.md` (`frontend-2` UI rules),
  `cms/` (The CMS: left nav, New chat, look tokens),
  `frontend-debloat.md` (cross-cutting port), `ci-cd.md`, `testing.md`.
  Feature-owned capabilities (website
  activation/payments, leads, media library, ETL, business profile) live under `features/`, not here.
- `features/<feature>/` — one directory per feature, **vertical** (all of that feature's docs in one
  place). `features/business-profile/` holds Details, Projects, and Certifications and reviews as
  child view dirs. `features/other/` is auth, media library, leads.
- `design/` — static HTML mocks (`cms.html`). Specs remain canonical. Ads mock stays with ads
  until a later `ads.html` consolidation.
- `planning/` — proposed, unshipped work; never the canonical source. The
  `frontend-2` port index is [planning/frontend-debloat.md](planning/frontend-debloat.md);
  per-feature cut lists live with the feature as `frontend-debloat.md`.

## Per-feature structure

A feature directory holds, as applicable:

| File | Purpose |
| --- | --- |
| `README.md` | overview + pointers |
| `prd.md` | business requirements, user stories, acceptance criteria (domain language) |
| `ADR.md` | numbered decision record |
| `architecture.md` | the logic: content/component model, flows, states (no structs) |
| `persistence.md` | that feature's tables (columns, indexes); shared tables are linked, never copied |
| `api.md` | Canonical HTTP routes for this feature. Routes, auth, callers, request/response fields, errors, do-not-create. Not Go structs. Conventions: [general-architecture/api.md](general-architecture/api.md). |
| `technical-implementation.md` | pipeline, validation, testing — references `persistence.md` and `api.md`; does not re-define tables or routes |
| `frontend.md` | screens and fields, when the UI is well-defined (the **target**) |
| `frontend-debloat.md` | port instructions for `frontend-2`: keep / delete / do not port / retarget onto the constrained API. Unshipped. Same headings in every file. Index: [planning/frontend-debloat.md](planning/frontend-debloat.md). Contractor website API: [website/port-contractor-website.md](features/website/port-contractor-website.md). Cut list: [website/contractor-website-debloat.md](features/website/contractor-website-debloat.md) |
| `testing.md` | the full-stack E2E test(s) with DB asserts |
| `pipeline/` | one doc per step (`01-…`, `02-…`, `04a-…`, …) + a `README.md` that gathers them, and `pipeline/testing/` with one integration-test doc per step (complex pipeline) |
| `ai-layer.md` | the LLM's tools/pipeline (only for one-shot, non-pipelined features) |

Not every file is needed — a feature uses only the ones it has content for. A complex pipeline uses
`pipeline/` and **not** `ai-layer.md`; a one-shot AI use has `ai-layer.md` and **not** `pipeline/`.

## Rules

- **Vertical**: a feature's docs live in one `features/<feature>/` dir; cross-cutting stuff lives in
  `general-architecture/`. Don't split one concern across both.
- **One definition per concept**: each feature's tables live in that feature's `persistence.md`.
  A table used by more than one feature lives in one owning file and is linked, never copied.
- **Domain language in product docs** (PRD, README, user stories); implementation terms stay in the
  technical docs (`technical-implementation.md`, per-feature `persistence.md`, ADR) and code. See
  `glossary.md`.
- **New names come from the glossary** — coin a word there first, never in a PRD. The glossary
  defines terms; it never prescribes.
- **Logic before structs**: architecture/pipeline docs describe flows and models; structs/DTOs fall
  out at implementation time and are not pre-written. The **HTTP routes** are per-feature `api.md`
  (plus [general-architecture/api.md](general-architecture/api.md)); that is paths and fields, not
  huma structs.
