# Assistant

The CMS **assistant** after website activation: product guide and doer, text
and voice, one thread per activated tenant. The **onboarding assistant** is
Find, Review, and client interview (Voice only). The **onboarding website
editor** is unpaid Assistant on `/onboarding/preview-and-edit/`
([website-editor.md](../onboarding/website-editor.md)). Website-editor tool
names and plan / Ask first stay in
[website editor tools](../website/assistant.md). Ads generate / revise /
rewrite stay Ads UI; on Ads the assistant write tool is media-library
`cleanup_image`.

Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).

- [PRD](prd.md)
- [ADR](ADR.md) — architectural decision record
- [design decision record](design-decision-record.md) — bottom-right **Assistant** (call), DustOrb, `/cms`
  two cards, onboarding launcher
- [architecture.md](architecture.md) — logic (context, allowed set, text vs voice, apply, locks).
  HTTP: `GetAssistantThread`, `StreamAssistantThread`, `CompactAssistantThread`,
  …. Contract stays in [api.md](api.md); tables in [persistence.md](persistence.md).
- [persistence.md](persistence.md) — `thread_items`, `runs`; thread identity is
  `ai.threads`
- [api.md](api.md) — DTOs and Routes (`/v1/assistant/…`; text
  `GET /v1/assistant/thread/ws`; voice under `/v1/assistant/voice/`)
- [testing.md](testing.md)
- [sep-3-issue-list.md](sep-3-issue-list.md) — unused-spec punch list (2026-09-03)

Onboarding guide: [onboarding assistant](../onboarding/assistant.md). Unpaid
website preview:
[onboarding website editor](../onboarding/website-editor.md). Usage credit:
[billing](../billing/README.md). LLM traces:
[LLM layer](../../general-architecture/llm-layer.md) (schema `ai`). Voice
transport: [voice agent](../../general-architecture/voice-agent.md).
