# General architecture

Cross-cutting architecture that doesn't belong to one feature.

- [llm-layer.md](llm-layer.md) — LLM, AI tools, traceability
- [voice-agent.md](voice-agent.md) — voice architecture (minted secret, tools)
- [audit.md](audit.md) — `audit_events`
- [jobs.md](jobs.md) — River background jobs
- [files.md](files.md) — object storage and the `files` row
- [data-model.md](data-model.md) — conventions and index of per-feature schemas
- [frontend.md](frontend.md) — `frontend-2` loading placeholders and other UI rules that no
  single feature owns
- [frontend-debloat.md](frontend-debloat.md) — cross-cutting `frontend-2` port (generated types,
  leftover layout names, parity e2e). Per-feature cut lists live with the feature.

Payments live with [website activation](../features/onboarding/pipeline/07-website-activation.md). Website leads live in
[features/other/leads](../features/other/leads/README.md). Website preview progress events:
[06-website-preview.md](../features/onboarding/pipeline/06-website-preview.md).
