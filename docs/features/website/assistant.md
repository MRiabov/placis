# Website assistant

The website assistant is a chat-like command surface in the website editor — not a separate
generator. It reads the selected website page, website sections, website slots, media assets,
website forms, SEO, validation blockers, website publication status, and website versions, and
turns requests into governed, reviewable website editor edits. Text chat, voice handoffs, and
website editor assistance all share the same tool surface.

Onboarding [website copy generation](../onboarding/pipeline/05-website-copy-generation.md) reuses
these tools headless (continuous mode, no chat UI, no `create_page`) after the website template
is applied. That job is website copy generation, not this website assistant.

## Tools (hard-typed, validated, parallel)

The planner uses hard-typed website editor action tools — never one generic plan tool with freeform
JSON. Each call is validated on input; the backend turns it into a planned / applied / skipped /
failed event.

| Tool | What it does |
| --- | --- |
| `update_slot` | update one typed website slot on an existing website section (copy or image) |
| `update_seo` | update bounded unpublished-website SEO metadata for the current website page |
| `update_form` | update a website form (title, fields, privacy notice) the same way the editor PATCH does |
| `update_website_styles` | update the tenant website styles (preset + bounded overrides), not per website page |
| `set_section_visibility` | show or hide one existing website section |
| `update_section_design` | update one website section's **design controls** — the per-website-component enum/bool knobs (e.g. `density`: `compact`/`comfortable`/`spacious`) with allowed values from the website component contract |
| `reorder_sections` | set the full ordered list of website section ids for the website page |
| `create_section` | propose a new website section using an approved website component |
| `create_page` | propose a new unpublished website page |
| `generate_image` | generate a media asset from a prompt, optionally attach it to an image website slot |

`generate_image`: the model supplies a prompt + media caption; the backend creates a generated
media asset (`supplied_by=ai`, pending review) and may attach it to a website slot on the
unpublished canvas (convenience). The canvas always surfaces a warning on that image. Owner
approval makes the media asset approved and permanent. Website publication and the live website
still require approved media assets. Ads stay approved-only.

Two plan tools carry the owner-facing reply, the plan, assumptions, open questions, and
activity: `refinement_plan` (plan mode, no mutation) and `assistant_plan` (summarize alongside the
edit tools).

## Plan mode vs continuous mode

- **Plan mode (default)** — for new website pages, multi-website-section redesigns, ambiguous
  copy/website styles, structural changes. The website assistant keeps a plan (affected website
  pages/website sections, proposed edits, assumptions, open questions, validation risks,
  acceptance criteria). Nothing is changed until the owner approves the plan. After they approve,
  the assistant applies the edits in bounded batches — apply, report failures, retry repaired
  calls, continue until done or capped.
- **Continuous mode** — bounded, low-risk edits applied directly to unpublished rows, still
  validated.

## Output and undo

- **Activity cards** are generated from execution events (`Edited 2 website sections`, `Created 1
  website page`, `Updated SEO`, `Changed colors`, `Failed to apply`); expanding one shows the
  affected targets and a before/after, and selecting it focuses the canvas/editing panel.
- **Revert** — revert the last website assistant batch by restoring the recorded before-values
  (`ai_generations.applied_changes` / execution events). It refuses if a manual edit came after.
  There is no unpublished revision stack and no per-page version table.

The website assistant never does a website publication, never bypasses validation, and never writes
arbitrary registry JSON.
