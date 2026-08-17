# CMS assistant (refinement)

The assistant is a chat-like command surface in the editor — not a separate generator. It reads the
selected page, sections, slots, assets, forms, SEO, validation blockers, publish state, and history,
and turns requests into governed, reviewable CMS edits. Text chat, voice handoffs, and editor
assistance all share the same tool surface.

## Tools (hard-typed, validated, parallel)

The planner uses hard-typed CMS action tools — never one generic plan tool with freeform JSON. Each
call is validated on input; the backend normalizes it into a planned / applied / skipped / failed
event.

- `update_slot` — edit copy or image in a section slot.
- `generate_image` — the model supplies a prompt + alt text; the backend creates a generated asset
  (provenance + review state) and attaches it to a slot through the draft page-version path.
- section add / remove / reorder and component swap; theme and style changes; SEO and form updates;
  page creation; publish-readiness checks.

## Plan mode vs continuous mode

- **Plan mode (default)** — for new pages, multi-section redesigns, ambiguous copy/style, structural
  changes. The assistant keeps a live markdown plan (affected pages/sections, proposed edits,
  assumptions, open questions, validation risks, acceptance criteria). **Approval is the handoff
  boundary**: after approval the plan converts into governed tool calls and may run several bounded
  batches — apply, report failures, retry repaired calls, continue until done or capped.
- **Continuous mode** — bounded, low-risk edits applied directly, still as draft versions with
  validation.

## Output and undo

- **Activity cards** are generated from execution events (`Edited 2 sections`, `Created 1 page`,
  `Updated SEO`, `Changed colors`, `Failed to apply`); expanding one shows the affected targets and a
  before/after, and selecting it focuses the canvas/inspector.
- **Revert** — assistant-authored edits can be reverted to the prior draft version; it refuses if a
  manual edit came after.

The assistant never publishes, never bypasses validation, and never writes arbitrary registry JSON.
