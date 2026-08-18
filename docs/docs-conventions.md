# Docs conventions

How the `docs/` tree is structured and written, so it stays consistent. Read before adding or
editing a doc.

## Layout

- `README.md` — the router (reading order + canonical references).
- `glossary.md` — the ubiquitous language (`## Domain` / `## Internal`, terms as `###`); the only
  place names are coined.
- `development-principles.md` — how work is sliced and reviewed.
- `architecture.md` — full-stack architecture, centered on the API contract.
- `ci-cd.md` / `testing.md` — delivery gates and the per-feature E2E rule.
- `general-architecture/` — cross-cutting architecture no single feature owns:
  `llm-layer.md`, `voice-agent.md`, `audit.md`, `jobs.md`, `files.md`, `data-model.md`
  (conventions + index of per-feature schemas). Feature-owned capabilities (claim/payments,
  leads, media) live under `features/`, not here.
- `features/<feature>/` — one directory per feature, **vertical** (all of that feature's docs in one
  place).
- `planning/` — proposed, unshipped work; never the canonical source.

## Per-feature structure

A feature directory holds, as applicable:

| File | Purpose |
| --- | --- |
| `README.md` | overview + pointers |
| `prd.md` | business requirements, user stories, acceptance criteria (domain language) |
| `ADR.md` | numbered decision record |
| `architecture.md` | the logic: content/component model, flows, states (no structs) |
| `data-model.md` | that feature's tables (columns, indexes); shared tables are linked, never copied |
| `technical-implementation.md` | API surface, validation, testing — references `data-model.md`, does not re-define tables |
| `frontend.md` | screens and fields, when the UI is well-defined |
| `testing.md` | the full-stack E2E test(s) with DB asserts |
| `pipeline/` | one doc per step (`01a-…`, `02a-…`, …) + a `README.md` that gathers them, and `pipeline/testing/` with one integration-test doc per step (complex pipeline) |
| `ai-layer.md` | the LLM's tools/pipeline (only for one-shot, non-pipelined features) |

Not every file is needed — a feature uses only the ones it has content for. A complex pipeline uses
`pipeline/` and **not** `ai-layer.md`; a one-shot AI use has `ai-layer.md` and **not** `pipeline/`.

## Rules

- **Vertical**: a feature's docs live in one `features/<feature>/` dir; cross-cutting stuff lives in
  `general-architecture/`. Don't split one concern across both.
- **One definition per concept**: each feature's tables live in that feature's `data-model.md`.
  A table used by more than one feature lives in one owning file and is linked, never copied.
- **Domain language in product docs** (PRD, README, user stories); implementation terms stay in the
  technical docs (`technical-implementation.md`, per-feature `data-model.md`, ADR) and code. See
  `glossary.md`.
- **New names come from the glossary** — coin a word there first, never in a PRD.
- **Logic before structs**: architecture/pipeline docs describe flows and models; structs/DTOs fall
  out at implementation time and are not pre-written.
