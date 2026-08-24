# Website assistant

The website assistant is a chat-like command surface in the website editor — not a separate
generator. It reads the selected website page, website sections, website slots, media assets,
website forms, SEO, validation blockers, website publication status, and website versions, and
turns requests into governed, reviewable website editor edits. Text chat, voice handoffs, and
website editor assistance all share the same tool surface.

Onboarding [website copy generation](../onboarding/pipeline/06-website-copy-generation.md) reuses
these tools headless (**continuous** workflow + **instant apply**, no chat UI, no `create_page`)
after the website template is applied. That job is website copy generation, not this website
assistant.

## Tools (hard-typed, validated, parallel)

The planner uses hard-typed website editor action tools — never one generic plan tool with freeform
JSON. Each call is validated on input; the backend turns it into a planned / applied / skipped /
failed event.

| Tool | What it does |
| --- | --- |
| `update_slot` | update one typed website slot on an existing website section (copy, or image attach / crop / focal) |
| `update_seo` | update bounded unpublished-website SEO metadata for the current website page |
| `update_form` | update a website form (title, fields, privacy notice) the same way the editor PATCH does |
| `update_website_styles` | update the tenant website styles (preset + bounded overrides), not per website page |
| `set_section_visibility` | show or hide one existing website section |
| `update_section_design` | update one website section's **design controls** — the per-website-component enum/bool fields (e.g. `density`: `compact`/`comfortable`/`spacious`) with allowed values from the website component contract |
| `reorder_sections` | set the full ordered list of website section ids for the website page |
| `create_section` | propose a new website section using an approved website component |
| `create_page` | propose a new unpublished website page (also appends a top-level page node on the footer, and on the top menu unless legal or cap) |
| `update_menus` | add / remove / reorder / update nodes on the top menu or footer tree; optional `show_phone` / `show_email` |
| `cleanup_image` | run the media-library AI cleanup on a photo, then point that image website slot at the copy |
| `generate_image` | generate a new media library item from a prompt; last resort when nothing in `media_assets[]` fits; may attach **that new item** |

**Owner action = assistant action.** Each tool is another caller of the same website-editor /
media-library execution the owner already uses (Ask first / instant apply around it). Text
`update_slot` is the same upsert as click-off PATCH. Image attach, crop, focal, and AI cleanup
are the same functions as the website editor PATCH and `/cms/media`. There is no second assistant
implementation and no public copy helper the tools call. Copy-on-write
(`parent_media_asset_id`, parent file never replaced) stays **inside** those functions.

Planner: a named real photo → **attach first** (`update_slot` + `media_asset_id`). Cleanup only
when they ask to tidy that photo. `generate_image` only when nothing in GET `media_assets[]`
fits ([ADR](ADR.md) 6). UUIDs are the media library key.

`generate_image`: the model supplies a prompt + media caption; the backend creates a generated
media library item (`supplied_by=ai`, pending review) and may attach **that new item** to an
image website slot on the unpublished canvas (convenience). It does not attach an existing
library photo — that is `update_slot`. The canvas always surfaces a warning on that image. Owner
approval makes the media library item approved and permanent. Website publication and the live
website still require approved media library items. Ads stay approved-only.

`refinement_plan` is the plan-workflow text (no mutation). It is confirmation text, not a required
schema of affected pages / assumptions / acceptance criteria. `assistant_plan` may summarize
alongside the edit tools.

## Two configs

Independent options. They combine. Default in the website editor: **plan + Ask first**.

**Workflow: plan vs continuous** (how the request is scoped)

- **Plan** — plan in text first (Cursor-style). Only after the owner accepts that text does the
  website assistant continuously apply. For larger or ambiguous work.
- **Continuous** — no plan text. Start applying. For a small ask like “make the about us section
  a bit clearer”.

**Gate: instant apply vs Ask first** (whether Apply / Reject exist)

- **Ask first** (`ask_first`) — each (or batched) edit shows **Apply** / **Reject**. Nothing
  lands until the owner picks. Never `on_confirm`.
- **Instant apply** — those buttons are bypassed. Validated tools write as they succeed. There is
  no Reject for that edit.

After a plan is accepted, apply uses the same engine as continuous workflow. Only the gate
changes whether Apply / Reject appear.

## Apply / Reject is one-way

The same agent edit must never **Apply** and then **Reject** (or the reverse).

- **Ask first:** `pending` → Apply *or* Reject, never both. The first committed transition
  wins. A second Apply, Reject, or retry after that is a no-op / `409`. The UI drops the
  buttons once the server says terminal.
- **Instant apply:** the edit is created **already applied**. Reject is not offered; the API
  refuses it.

Applied writes the unpublished row. After that, the owner does not Reject that edit. Changing
the canvas later is a **new** human edit (PATCH / typing). That is not Reject. There is no
“revert last website-assistant batch” via Reject. Activity cards show what happened; they are
not an undo control. After Apply, Ctrl+Z undoes that **batch in RAM**, then PATCHes like any
owner edit. The Apply row in `edit_history` keeps `edited_by=agent`; the copy-out of the undo
is a later human batch. Instant-apply tools undo one tool at a time in RAM. Website
publication rollback is a different surface.

## Last writer

Last writer lives only on `edit_history` (`edited_by` `human`/`agent`, `ai_generation_id` when
agent). Live unpublished rows have no last-writer columns. See
[data-model.md](data-model.md). `origin` is still first source, not last writer.

Apply (Ask first whole Apply, or one instant-apply tool) is one `edit_history` batch. Pending
Ask first edits are not in the table. Reject never writes a row. Apply sends
`base_edit_history_head` on the existing apply request; success / `409`
`edit_history_conflict` match PATCH ([editing.md](editing.md)).

**One in-flight website-assistant run per tenant** (includes onboarding 06). A second start is
`409` until the current run finishes, fails, or is cancelled. Two tabs, voice + text, or 06 +
the editor must not both apply. PATCH (including undo copy-out) is `409` while a run is
applying.

## Output

**Activity cards** are generated from execution events (`Edited 2 website sections`, `Created 1
website page`, `Updated SEO`, `Changed colors`, `Failed to apply`); expanding one shows the
affected targets and a before/after, and selecting it focuses the canvas/editing panel.

There is no unpublished snapshot per edit and no per-page version table.
Website edit history is typed increments on `edit_history`; Ctrl+Z is in-memory, then PATCH.

### `update_menus`

One tool for both bars. This surface is rare; eight named tools are not worth it. Same Ask first /
instant apply gate as `update_slot`.

```text
update_menus(
  which: top_menu | footer,
  add_entries?,
  remove_entries?,
  reorder_entries?,
  update_entries?,
  show_phone?: bool | omit,
  show_email?: bool | omit
)
```

Omitted lists and omitted `show_*` are no-ops. Empty `{}` / `[]` are no-ops, not wipes.

Apply order:

1. **remove** — old ids, max 4
2. **add** — new nodes; server sets `id` from the label (page title for `kind: page`)
3. **reorder** — nested `{ id, children }` using **pre-update** ids (GET ids plus ids just
   assigned by add). Membership = tree after remove+add. Does not delete. A flat id array is
   invalid.
4. **update** — labels / hrefs / path last. Label change recomputes `id` after reorder.
5. **show_phone / show_email** — bar CTA visibility. Not tree nodes. Href is always
   `{{marketing_phone}}` / `{{marketing_email}}`. No `tel:` / `mailto:` override.

`add_entries`: parent `id` (omit = top-level) + new node (`kind` + `path` or `label`/`href`).
`remove_entries`: ids, at most 4. `update_entries`: text → `label`; url → `label` and/or `href`;
page → `path`, optional display `label`. Kind is not changed by update (heading ↔ link is remove
+ add).

Invalid is `400`; over bar cap (8 top-level top menu, 12 footer, 8 children per parent) is `409`.
A page already in that tree is `400`. Tool result returns the tree (post-update ids). GET for
the assistant returns both trees with `id` / `kind` / `label` / `path` / `href` (no UUID).

Logo and density stay on the site-wide look website sections (other tools). Do not name this
tool `update_nav`.

### `update_slot` (image)

Same tool as text. No `attach_image` verb. Text / rich-text `value` is unchanged.

```text
update_slot(
  section_id,
  slot_key,
  value?,              # text / rich_text only
  media_asset_id?,     # image: attach this library item
  crop?,               # { mode: full | rect, x, y, width, height } 0–1
  focal?               # { x, y } 0–1
)
```

- Image + `media_asset_id` only → **attach** (same as drag onto the canvas). No copy.
- Image + `crop` and/or `focal` → crop and/or focal **function**, then point the slot at the
  returned item. Omit `media_asset_id` → the slot’s current item. Crop and focal may be one
  function with two fields — still one implementation.
- `value` on an image slot is `400`. Image fields on a text slot are `400`.
- Tenant mismatch, archived, or `rejected` → `400`. `pending_review` may attach on the
  unpublished canvas (warning). Publication still needs `approved`.

Same Ask first / instant apply gate as text `update_slot`.

### `cleanup_image`

Same AI cleanup as `/cms/media`. Ads light cleanup, when it writes a media-library copy, calls
this same function.

```text
cleanup_image(
  section_id,
  slot_key,
  prompt,              # light cleanup: declutter, tidy background; not invent work
  media_asset_id?      # omit = the slot’s current item
)
```

Resolve parent → **AI cleanup** → point **that slot** at the returned item. Other slots
and ads keep the parent until retargeted. Cosmetic bound lives on that cleanup (same as
ads: no fake results). Canvas warning until approved. Publication blocked until approved. Same
Ask first / instant apply gate as `update_slot`.

The website assistant never does a website publication, never bypasses validation, and never writes
arbitrary registry JSON. It does not edit Details, Projects, or Certifications and reviews (those
are Profile screens). It does not delete or archive a website section or website page (hide
stays: `set_section_visibility`). It does not upload or replace file bytes — replace stays the
existing replace on `/cms/media` / website editor upload.
