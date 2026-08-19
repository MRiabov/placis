# General architecture

Cross-cutting architecture that doesn't belong to one feature.

- [llm-layer.md](llm-layer.md) — LLM, AI tools, traceability
- [voice-agent.md](voice-agent.md) — voice architecture (minted secret, tools)
- [audit.md](audit.md) — `audit_events`
- [jobs.md](jobs.md) — River background jobs
- [files.md](files.md) — object storage and the `files` row
- [data-model.md](data-model.md) — conventions and index of per-feature schemas

Payments live with [website activation](../features/onboarding/pipeline/07-website-activation.md). Website leads live in
[features/other/leads](../features/other/leads/README.md). Website preview progress events:
[06-website-preview.md](../features/onboarding/pipeline/06-website-preview.md).
