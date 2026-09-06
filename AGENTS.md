# AGENTS.md

Instructions for coding agents in this repository. Canonical product and
architecture docs live under `docs/`. This file is the hard gates plus an
index. If this file and a skill disagree, this file and `docs/` win.

## Product

Placis is a done-for-you marketing and advertising service for construction
companies (the owner can DIY in The CMS). One loop: onboarding → business
profile → website → ads. There is no CRM, quotes, invoices, jobs, workflows,
calendar, or crew.

Start at [docs/README.md](docs/README.md).

## Read first

1. This file
2. [docs/development-principles.md](docs/development-principles.md)
3. [docs/docs-conventions.md](docs/docs-conventions.md)
4. [docs/glossary.md](docs/glossary.md)
5. The owning `docs/features/<feature>/README.md`, or
   [docs/infrastructure/](docs/infrastructure/README.md) when the work is
   tenancy, store, jobs, AI, files and S3, or config, or
   [docs/general-architecture/](docs/general-architecture/README.md) when the
   work is otherwise cross-cutting

## Apps

Do not collapse these into "the frontend". Processes:
[docs/general-architecture/processes.md](docs/general-architecture/processes.md).

- [`apps/demo/`](apps/demo/README.md) — look app (Vite, mock data, no auth, no
  API). `demo.placis.com`. Own lockfile; not a root-workspace member. Look and
  interaction land here. Specs stay canonical. Design decision records, not
  `persistence.md` / `api.md`.
- [`apps/contractor-website/`](apps/contractor-website/README.md) — live
  contractor HTML and the preview website address. Astro + React islands, one
  Worker, R2 `latest/`. A live GET is Cache then R2 and never calls Go. Do not
  invent a second HTML engine.
- [`apps/placis-website/`](apps/placis-website/README.md) — Placis's own site.
  Astro static → R2, hostname `placis.com`. No Worker. No Go HTTP.
- [`frontend-3/`](docs/general-architecture/frontend-stack.md) — owner CMS and
  onboarding (not under `apps/`). Greenfield. Delete `frontend-2/` before the
  first owner-UI implementation. Do not open `frontend-2`, copy from it, or
  use it as a reference. [ADR](docs/general-architecture/ADR.md) 3.

Look-only work stays in `apps/demo/`. Do not restyle look in
`apps/contractor-website` or `apps/placis-website`.

## Documentation-first (blocks implementation)

This repository is documentation-first. Missing or ill-defined docs **block
implementation** until the owner reviews them.

**Every changeset starts with docs.** Do not implement first and document
after. The first edits are canonical `docs/` (or a design decision record for
look-only `apps/demo/` work). Go, goose, Worker, owner UI, and test code come
after those docs exist — and, when identifiers are new, after owner review.

**Plan mode:** when Plan mode is selected, the first step is always updating
docs. Do not write a plan that defers the spec to implementation. Name the
tables, routes, jobs, and verifies in `docs/` first. The plan is how those
named lists will be built, not a substitute for them.

Before Go, goose, sqlc, huma, Worker, owner UI, or test **code**:

- The change exists in canonical `docs/` (not only `docs/planning/`).
- Owning `persistence.md` is **defined** when the change persists: closed
  `## Tables` / `## Indexes` with Columns, Enums, Uniques, Written by
  ([docs conventions](docs/docs-conventions.md#persistencemd-shape-defined-features)).
- Owning `api.md` is **defined** when the change has HTTP: closed `## DTOs` /
  `## Routes` / `## Do not create`
  ([docs conventions](docs/docs-conventions.md#apimd-shape-defined-features)).
- Owning `testing.md` (and `pipeline/testing/` when there is a pipeline) names
  Persist / Must not verifies and HappyPath rows
  ([testing](docs/general-architecture/testing.md)).
- New names are already in [docs/glossary.md](docs/glossary.md).
- River job kinds already live in the owning feature `jobs.md`
  ([jobs](docs/infrastructure/jobs.md) is the River index).

If any of those are missing or ill-defined:

1. Write or complete the docs (allowed).
2. **Stop.** Do not write implementation. Ask for owner review.
3. After explicit approval, implement only the named lists. Do not invent a
   table, route, DTO, job, or test that is not already named.

**Not blocked:** look-only work in `apps/demo/` (design decision record, not
persistence/API); doc-only edits; bugfixes that do not add identifiers already
named in defined files.

**Known exceptions** (do not invent an `api.md` to satisfy the gate):

- ETL: tables + named services + `testing.md`; no owner HTTP
  ([ETL](docs/features/etl/README.md)).
- Placis website: no Go HTTP
  ([Placis website](docs/features/placis-website/README.md)).
- Cross-cutting storage (files, audit, AI traces, River):
  [general architecture](docs/general-architecture/README.md), not a feature
  `persistence.md`.

"Tests" here means the **test spec** (`testing.md` / `pipeline/testing/`), not
Go / Playwright / Vitest files. Test code is implementation and waits for the
same review.

Named-identifier shape:
[docs conventions](docs/docs-conventions.md#named-identifiers).

## Workflow

Follow
[.agents/skills/pr-driven-workflow/SKILL.md](.agents/skills/pr-driven-workflow/SKILL.md)
at the start of repository work. Production-bound work lives in a git worktree
under `.worktrees/<branch>`. Do not switch the main checkout off `main`. Use a
feature branch and a pull request. If that skill and `docs/` disagree, `docs/`
and this file win.

## Other non-negotiables

- Names come from the glossary. Don't say is a CI fail
  ([glossary](docs/glossary.md)).
- Two type layers: sqlc rows + huma DTOs
  ([backend stack](docs/general-architecture/backend-stack.md)).
- Every DTO field is constrained (`minLength`/`maxLength`,
  `minimum`/`maximum`, enums). No freeform JSON on HTTP
  ([HTTP conventions](docs/general-architecture/api.md)).
- `ADR.md` is the architectural decision record.
  `design-decision-record.md` is look and interaction. Do not say bare
  **decisions**. Do not invent **Why**
  ([docs conventions](docs/docs-conventions.md)).
- Files stay under 800 lines (hard fail at 1200)
  ([module layout](docs/general-architecture/module-layout.md)).
- Pipeline stages: number and architecture name together (`04 Website
  publication`, never bare `04`).
- The LLM drafts; the contractor edits. Record internal reasoning, visible
  output, and tool calls ([AI layer](docs/infrastructure/ai/README.md)).
- Predecessor OpenAPI is not a compatibility surface.
