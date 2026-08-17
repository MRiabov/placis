# General architecture

Cross-cutting architecture that doesn't belong to one feature.

- [llm-layer.md](llm-layer.md) — LLM provider, AI tools, traceability
- [voice-agent.md](voice-agent.md) — voice architecture (minted secret, tools)
- [audit.md](audit.md) — `audit_events`
- [jobs.md](jobs.md) — River background jobs
- [files.md](files.md) — object storage and the `files` row
- [data-model.md](data-model.md) — conventions and index of per-feature schemas

Payments live with [claim](../features/onboarding/pipeline/07-claim.md). Leads live in
[features/other/leads](../features/other/leads/README.md). Preview progress events:
[06-preview.md](../features/onboarding/pipeline/06-preview.md).
