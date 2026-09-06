# Development Principles

How the backend and owner UI are built. Read this before writing Go or
`frontend-3` code; the docs referenced here are the single source of
truth. A change that invents a name, model, or pattern not in them is
wrong.

`frontend-3` is a **thin typed wrapper** over Go. Screens bind generated OpenAPI
types (`src/generated/` + `openapi-fetch`). Policy, caps, auth modes, 402,
allowlists, and writes live in Go. Do not add a third TypeScript model layer.
Look (`apps/demo`) stays mock-only. [frontend stack](general-architecture/frontend-stack.md). [ADR](general-architecture/ADR.md) 3.

## Why this file exists

The previous Python backend grew to ~71k lines not because the features were
hard, but because nothing was ever a complete, tested, reviewable
development task, and there was no enforced contract or naming —
sessions re-derived names, models, and patterns from scratch. This file
is the antidote: work in small development tasks, and let the gates +
glossary catch drift.

## The two things that prevent drift

1. **The ubiquitous language + schema + per-feature specs are already written:**
   - [glossary.md](glossary.md) — the only place names come from
   - [persistence.md](general-architecture/persistence.md) — conventions + index; each feature's tables are in
     `features/<feature>/persistence.md`. Pool/goose: [store](infrastructure/store.md)
   - [backend-stack.md](general-architecture/backend-stack.md) — stack, type layers
   - [module-layout.md](general-architecture/module-layout.md) — package tree
   - [api.md](general-architecture/api.md) — HTTP conventions; per-feature `api.md` is the HTTP routes
   - [features/](features/) — per-feature PRD / ADR / `persistence.md` / `api.md` /
     technical-implementation / frontend
   - [ci-cd.md](general-architecture/ci-cd.md) — the gates
   - [general-prd.md](general-prd.md) — product-level scope

   Read the relevant ones before touching a feature. A development task is spec,
   then owner review, then code — not docs after code, not docs alongside code.
   Every changeset starts by editing `docs/`. In Plan mode, updating docs is the
   first step. Named lists in `persistence.md`, `api.md`, and `testing.md` must
   exist and be reviewed before Go, goose, or owner UI code. Agent entry:
   [AGENTS.md](../AGENTS.md).
2. **The gates** (CI-enforced) catch drift mechanically: file-size guard,
   `golangci-lint`, generated-code freshness, two-layer types, tests isolated
   from Google / the LLM / Stripe / voice, one E2E per feature.

## Workflow: development tasks

Build one feature at a time, bottom-up, in dependency order. The coarse
loop is:

```text
infrastructure/tenancy/auth -> onboarding (source -> client interview -> profile) -> website
  -> website preview/website activation/billing -> ads -> leads
```

The implementable DAG (ETL, files, AI, River, the contractor website
Worker, `frontend-3`, voice, and S01–S27 ids) is
[planning/implementation-strategy.md](planning/implementation-strategy.md).
Do not implement from this coarse list alone.

Each development task is **one PR**, complete and green before the next
starts. A development task that has owner UI includes matching
`frontend-3` screens. A development task is:

1. goose SQL for that feature's tables only, under
   `internal/infrastructure/store/` (one chain; not a repo-root
   `migrations/` dump)
2. `sqlc` queries
3. `huma` DTOs — this *is* that feature's part of the OpenAPI (`huma` derives
   it)
4. service + handlers
5. unit + integration tests, plus **one E2E test** (see [testing.md](general-architecture/testing.md) for the
   per-feature E2E definition) when this development task closes the owner
   journey
6. regenerate the `frontend-3` types from Go `/openapi.json`
7. `frontend-3` screens from that feature’s `frontend.md` when the development
   task has owner UI
8. CI green -> merge

**"Done"** for a development task = green CI + the named HappyPath / E2E +
regenerated types. Not "scaffolded", not "compiles".

## The walking skeleton first

Before the first feature, build the walking skeleton: `cmd/api` (HTTP +
in-process River), config, `slog`, `huma` + `GET /v1/health`, Postgres +
`goose` + `sqlc`, and the CI pipeline. A few hundred lines, but it proves the
whole toolchain (sqlc → huma → OpenAPI → `frontend-3` typegen →
Testcontainers → deploy) end to end. Next: `frontend-3` scaffold and
**delete `frontend-2`**, then **tenancy + auth**
(`internal/infrastructure/tenancy`) — everything else FKs into
`tenants`. Order:
[implementation strategy](planning/implementation-strategy.md).

## Rules that keep it from collapsing

- **Small, named development tasks.** One development task = one PR, with a
  fixed "done" (green CI + E2E + regenerated types). Never "add the website
  feature" as one development task.
- **Don't write the whole OpenAPI up front.** `huma` derives it from the DTOs,
  so writing every DTO now is the speculative batch that caused the last
  collapse. Write each feature's DTOs as you build that development task. Specs
  already name tables, routes, DTO **types and fields**, and major services
  ([docs conventions](docs-conventions.md#named-identifiers)); implementation keeps those names. Do not pre-write
  OpenAPI YAML or Go struct literals. Predecessor OpenAPI is not a compatibility
  surface for `frontend-3` or the contractor website: do not wrap it, alias old
  paths, or generate types from it.
- **Two type layers by default** (see [backend-stack.md](general-architecture/backend-stack.md)): sqlc rows + huma
  DTOs. A third "domain value" only for a composite of several rows — never a
  hand-written model mirroring a table.
- **Name everything from the glossary.** Coining a new word is wrong; add it to
  the glossary first if a concept is genuinely missing.
- **Keep files under 800 lines** (hard error at 1200); split into a feature
  package instead. Markdown after rumdl wrap (80 characters) uses the same cap:
  split a doc that exceeds 800. Exception: `docs/glossary.md` (one
  ubiquitous-language file; do not split it). The look app (`apps/demo/src`)
  hard-fails at 800
  ([CI decision 1](general-architecture/ci-cd.md#decisions)).

## What "good" looks like

Size is not the metric. The old “~5 features / a tenth of the 71k-line Python
app” cut is historical. Every line lands in a
**merged, tested, green development task** rather than a pile of half-finished
code. Per-file 800 / hard 1200 is the size control. Order of work:
[implementation strategy](planning/implementation-strategy.md).

## Later development task: auditability hardening

After the product development tasks above are green, a later
development task hardens
**audit completeness** and **AI-trace completeness** (every LLM call
reconstructable: reasoning, visible answer, tool calls). Voice is a current
channel ([voice agent](infrastructure/ai/voice-agent.md)), not a later phase.
