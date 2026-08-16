# 05 — Refine (LLM edits)

The LLM (the editor) refines the draft through the shared CMS assistant tools (`update_slot`,
`generate_image`) — typed, validated, parallel.

- **Persists** `ai_generations` (reasoning + output + tool calls); updates slots/sections as drafts —
  never published state.
