# General architecture

Cross-cutting architecture that doesn't belong to one feature. Product loop:
[general-prd.md](../general-prd.md).

- [backend-stack.md](backend-stack.md) — stack, type layers
- [feature-flags.md](feature-flags.md) — named config bools (`internal/config`)
- [frontend-stack.md](frontend-stack.md) — `frontend-2` stack, folders, typegen
- [module-layout.md](module-layout.md) — Go package tree, file-size guard, folder fan-out
- [processes.md](processes.md) — `cmd/api`, `frontend-2`, contractor website, Placis website,
  deploy
- [api.md](api.md) — HTTP conventions (versioning, typing, serve only types on HTTP,
  auth modes, errors) and index of per-feature `api.md` files
- [package-boundaries.md](package-boundaries.md) — which Go package owns which work
- [llm-layer.md](llm-layer.md) — LLM, AI tools, traceability
- [voice-agent.md](voice-agent.md) — voice architecture (short-lived secret, HTTP finals)
- [audit.md](audit.md) — `audit_events`
- [jobs.md](jobs.md) — River background jobs (including ETL)
- [files-and-s3.md](files-and-s3.md) — object storage and the `files` row
- [ADR.md](ADR.md) — architectural decision record (closed sets are checks, not
  Postgres enums)
- [persistence.md](persistence.md) — conventions and index of per-feature tables
- [frontend.md](frontend.md) — `frontend-2` loading placeholders and other UI rules that no
  single feature owns. Tokens: [CMS design.md](cms/design.md).
- [cms/](cms/README.md) — The CMS (sidebar + main area): left nav, `/cms` two cards, look
  tokens
- [frontend-debloat.md](frontend-debloat.md) — cross-cutting `frontend-2` port (generated types,
  leftover layout names, parity e2e; left nav / `/cms` two cards). Per-feature
  cut lists live with the feature.
- [ci-cd.md](ci-cd.md) — delivery gates (file-size, folder fan-out), GitHub Checks,
  Don't-say checker
- [testing.md](testing.md) — unit / integration / E2E tiers and the per-feature E2E rule
- [sep-3-issue-list.md](sep-3-issue-list.md) — Sep 3 issue list (keep /
  doc gap / drop); index of per-feature lists

One-time activation Checkout (access fee plus Placis Pro plan / month) lives
with
[website activation](../features/onboarding/pipeline/09-website-activation.md).
Stripe Subscription after that Checkout, extra usage credit, and the
Price cache live with [billing](../features/billing/README.md). Website
leads live in
[features/other/leads](../features/other/leads/README.md). Public-source
extract: [ETL](../features/other/etl/README.md). Onboarding session
progress events: [pipeline README](../features/onboarding/pipeline/README.md).
