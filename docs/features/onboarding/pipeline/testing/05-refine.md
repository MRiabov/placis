# 05 — Refine (integration test)

- **Setup**: a generated website draft.
- **Invoke**: run refinement (LLM faked; tool calls typed + validated).
- **Assert**: `ai_generations` (reasoning + output + tool calls) written; slots/sections updated as
  drafts; an invalid tool call is rejected, never executed; nothing published.
- **Mocked**: the LLM (returns fixed tool-call proposals).
