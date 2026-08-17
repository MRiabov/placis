# 05 — Refine (the assistant edits)

The LLM (the editor) refines the draft through the **CMS assistant** — the full architecture is in
[assistant.md](../../website/assistant.md).

- **Hard-typed tools** — `update_slot`, `update_seo`, `update_theme`, `set_section_visibility`,
  `update_section_design`, `reorder_sections`, `create_section`, `create_page`, `generate_image`
  (full list + plan tools in [assistant.md](../../website/assistant.md)) — validated on input, run
  in parallel.
- **Plan mode (default)** — a live markdown plan; **approval is the handoff boundary**, then bounded
  multi-batch execution with retry. **Continuous mode** for bounded low-risk edits.
- **Activity cards** (`Edited 2 sections`, `Created 1 page`, …) and **revert** for every change.

- **Persists** `ai_generations` (reasoning + output + tool calls), draft CMS edits, and generated
  assets — never published state.
