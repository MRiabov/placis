# General architecture

Cross-cutting architecture that doesn't belong to one feature. Product loop:
[general-prd.md](../general-prd.md).

- [backend-stack.md](backend-stack.md) — stack, type layers
- [frontend-stack.md](frontend-stack.md) — `frontend-2` stack, folders, typegen
- [module-layout.md](module-layout.md) — Go package tree, file-size guard, folder fan-out
- [processes.md](processes.md) — `cmd/api`, `frontend-2`, contractor website, Placis website, deploy
- [api.md](api.md) — HTTP conventions (versioning, typing, serve only types on HTTP, auth modes, errors) and index of per-feature `api.md` files
- [package-boundaries.md](package-boundaries.md) — which Go package owns which work
- [llm-layer.md](llm-layer.md) — LLM, AI tools, traceability
- [voice-agent.md](voice-agent.md) — voice architecture (short-lived secret, tools)
- [audit.md](audit.md) — `audit_events`
- [jobs.md](jobs.md) — River background jobs (including ETL)
- [files-and-s3.md](files-and-s3.md) — object storage and the `files` row
- [persistence.md](persistence.md) — conventions and index of per-feature tables
- [frontend.md](frontend.md) — `frontend-2` loading placeholders and other UI rules that no
  single feature owns
- [frontend-debloat.md](frontend-debloat.md) — cross-cutting `frontend-2` port (generated types,
  leftover layout names, parity e2e). Per-feature cut lists live with the feature.
- [ci-cd.md](ci-cd.md) — delivery gates (file-size, folder fan-out), GitHub Checks, Don't-say checker
- [testing.md](testing.md) — unit / integration / E2E tiers and the per-feature E2E rule

Payments live with [website activation](../features/onboarding/pipeline/08-website-activation.md). Website leads live in
[features/other/leads](../features/other/leads/README.md). Website preview progress events:
[07-website-preview.md](../features/onboarding/pipeline/07-website-preview.md).
