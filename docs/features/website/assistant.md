# Website assistant

The website assistant is a chat-like command surface in the website editor — not a separate
generator. It reads the selected website page, website sections, website slots, media assets,
website forms, SEO, validation blockers, website publication status, and website versions, and
turns requests into governed, reviewable website editor edits. Text chat, voice handoffs, and
website editor assistance all share the same tool surface. The registry lives here; generation
and search go through `LLMProvider` in `ai` ([LLM layer](../../general-architecture/llm-layer.md)).

## Owner surface

Default-on overlay on the website-editor canvas. Tools and the apply path below are unchanged;
this is the owner overlay. Details: [frontend.md](frontend.md), look:
[design-decisions.md](design-decisions.md), architecture: [ADR](ADR.md) 6.

- **Always on:** pinned to the canvas. **Default is collapsed** (canvas first) on wide and
  narrow. Wide collapsed is the single-line composer (one row: chevrons, field, **Plan mode**,
  **Ask first**, **Plan** / **Send**). Narrow collapsed stays two rows (overlay bar + composer).
  Expand is at least half the canvas column. Reduce height
  on a narrow screen stays two rows (overlay bar + composer). **Clear context** trash is expanded-only.
  Reduced composer is max-width 40rem, centered; expand fills the 12px canvas inset
  (180ms). Idle / unfocused is 40% opacity; hover or focus-within is opaque. The overlay
  does not dim or black out the website; the uncovered canvas stays clickable.
- No **Website assistant** label or toolbar button — the overlay is the chatbot.
- Composer submit is **Plan** while **Plan mode** is on, **Send** when it is off (continuous).
- **Apply / Reject pills never fade.**
- **Clear context** starts a new thread and discards pending unapplied Ask-first proposals
  (same as Reject those). It does not undo already-Applied batches and is not “clear selected
  website section”. Control: silent trash on the right of the overlay top row while
  **expanded** (no label, no fill). Hidden while reduced.
- The overlay is **one chat-like thread** (owner turns and assistant replies). Ask first
  **Apply / Reject is per pending turn**: one pair for the whole run’s tools, not per tool.
  Those two actions are **pills on the canvas**, always over the chatbot (above it) or in the
  left stack next to the orb when the voice agent is on, not in the thread. Tool calls in the thread are muted owner lines from the backend, never
  the tool name. Each line has a kind icon: pencil for writes, lightbulb for thinking.
  There is no search/grep tool.
- Configs are **boolean switches** in the overlay. Default **plan + Ask first**. **Follow**
  is a third config (`follow`), default off, not shown, not owner-turnable.
- Empty composer turns the **voice agent** on (`/cms/website`). The chatbot overlay is
  hidden. A soft orb sits bottom-right of the canvas (`min(5.5rem, 30vw)`). A glow
  falls off from the center with no hard edge. Clicks pass through except Restore chatbot
  and close. Restore chatbot is an opaque pill under Apply / Reject; the orb is a circle on
  the right spanning both rows (sticky while the
  field stays empty until **Voice**). A small close on the top-right of the orb also restores.
  In chatbot mode, empty field shows **Voice**; text in the field is Plan / Send. Apply /
  Reject sit in that left stack when the voice agent is on, and
  centered above the overlay over the chatbot. Switching to the voice agent and back is a
  fade, not a cut. The voice agent speaks back and uses the same tools; it grants no extra
  authority. **Follow** does not snap the canvas while it is off.
- Pending / Applied / Rejected must be obvious (Apply / Reject pills only while that turn is
  pending; pending outline on changed website sections). Do not paint **Not applied** as copy
  on the website.

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
| `update_reviews` | rewrite the ordered pool ids on one reviews website section (same PATCH as Content; length ≤ that website component’s max) |
| `update_seo` | update bounded unpublished-website SEO metadata for the current website page |
| `update_form` | update a website form (title, fields, privacy notice) the same way the editor PATCH does |
| `update_website_styles` | update the tenant website styles (preset + bounded overrides), not per website page |
| `set_section_visibility` | show or hide one existing website section |
| `update_section_design` | update one website section's **design controls** — the per-website-component enum/bool fields (e.g. `density`: `compact`/`comfortable`/`spacious`) with allowed values from the website component contract |
| `reorder_sections` | set the full ordered list of website section ids for the website page |
| `create_section` | propose a new website section using an approved website component |
| `create_page` | propose a new unpublished website page (also appends a top-level page node on the footer, and on the top menu unless legal or cap) |
| `update_menus` | add / remove / reorder / update nodes on the top menu or footer tree; optional `show_phone` / `show_email` / `show_contact` |
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

## Three configs

Independent options. They combine. Default in the website editor: **plan + Ask first**,
**Follow** off. Plan and Ask first are boolean switches on the overlay. Follow is contract-only.

**Follow** (`follow`) — when on, the canvas would snap to the website slot the agent is
editing. Default **off**. The owner cannot turn it on (no overlay switch). A request with
`follow: true` is refused. Reserved for a later cut.

**Workflow: plan vs continuous** (how the request is scoped)

- **Plan** — plan in text first (Cursor-style). Only after the owner accepts that text does the
  website assistant continuously apply. For larger or ambiguous work.
- **Continuous** — no plan text. Start applying. For a small ask like “make the about us section
  a bit clearer”.

**Gate: instant apply vs Ask first** (whether Apply / Reject exist)

- **Ask first** (`ask_first`) — **Apply** / **Reject** pills sit on the canvas over the
  chatbot, or in the left stack next to the orb when the voice agent is on, for the whole pending run. The
  canvas shows the proposal in memory. Nothing is PATCHed until **Apply**. Never `on_confirm`.
- **Instant apply** — those buttons are bypassed. In the CMS, the website editor applies each
  validated tool to the in-memory projection and PATCHes as they succeed. There is no Reject for
  that edit. Onboarding 06 writes unpublished rows headless (no `frontend-2`).

After a plan is accepted, apply uses the same engine as continuous workflow. Only the gate
changes whether Apply / Reject appear.

## Apply / Reject is one-way

The same agent edit must never **Apply** and then **Reject** (or the reverse).

- **Ask first:** `pending` → Apply *or* Reject, never both. The first committed transition
  wins. A second Apply, Reject, or retry after that is a no-op / `409`. The UI drops the
  buttons once the server says terminal.
- **Instant apply:** the edit is created **already applied**. Reject is not offered; the API
  refuses it.

In the CMS, Apply does not write unpublished rows on a distinct path. The website editor
mutates the in-memory projection, then the ordinary PATCH (and `/menus`) copies out with
`ai_generation_id` so that `edit_history` batch is `edited_by=agent`. `record-apply` /
`record-reject` are activity metadata only. After Apply, the owner does not Reject that edit. Changing the canvas
later is a **new** human edit (PATCH / typing). That is not Reject. There is no “revert last
website-assistant batch” via Reject. Activity cards show what happened; they are not an undo
control. After Apply, Ctrl+Z undoes that **batch in RAM**, then PATCHes like any owner edit.
The Apply row in `edit_history` keeps `edited_by=agent`; the copy-out of the undo is a later
human batch. Instant-apply tools undo one tool at a time in RAM. Live website rollback is a
different surface ([api.md](api.md)).

## Last writer

Last writer lives only on `edit_history` (`edited_by` `human`/`agent`, `ai_generation_id` when
agent). Live unpublished rows have no last-writer columns. See
[persistence.md](persistence.md). `origin` is still first source, not last writer.

Apply (Ask first whole Apply, or one instant-apply tool) is one `edit_history` batch, written
by the CMS PATCH that copies those dirty keys (`ai_generation_id` set). Pending Ask first
edits are not in the table. Reject never writes a row. `record-apply` / `record-reject` do
not send `base_edit_history_head`; the PATCH already did. Success / `409`
`edit_history_conflict` match any other PATCH ([editing.md](editing.md)).

**One in-flight website-assistant run per tenant** (includes onboarding 06). A second start is
`409` until the current run finishes or fails. There is no cancel HTTP. Two tabs, voice +
text, or 06 + the website editor must not both start a run. While 06 is in flight, CMS PATCH
is `409`. While a CMS run is in flight, PATCH is allowed — that is the apply path.

## Output

**Activity** sits on a chat turn. Each tool call in the thread is a muted **owner line** from
the backend (`summary`, `string` + `maxLength`). It is not a bordered card per tool. The
frontend never renders a tool name (`update_slot`, `cleanup_image`, …) and never says slot.
Expanding a call shows the affected targets and a before/after, and selecting it focuses the
canvas and Content. Execution events still exist (`Edited 2 website sections`,
`Created 1 website page`, `Updated SEO`, `Changed colors`, `Failed to apply`). Ask first
Apply / Reject is a pair of **pills on the canvas** over the chatbot, not in the thread and
not on each tool.

`summary` is **deterministic**, built by the backend from the validated tool + target. The
owner-facing kind on `update_slot` is a closed union: **heading**, **text**, or **image**.
The place is the website section’s owner-facing name (Hero, Services), not an id. The thread
icon is from a closed union: **write** (pencil) for tool summaries, **think** (lightbulb) for
thinking. There is no search/grep tool on the website assistant.

- `slot_type=image` → `Updated image on {Section}`
- `slot_key` `heading` / `headline` / `title` → `Updated heading on {Section}`
- any other `update_slot` (body, lede, rich text, link, list, …) → `Updated text on {Section}`
- `update_reviews` → `Updated reviews on {Section}`

Other tools use the same field, never the tool name, for example: `Cleaned up image on Hero`,
`Generated image on Hero`, `Updated SEO`, `Updated website styles`, `Hid Services`,
`Added Reviews`, `Created Contact`, `Updated top menu`.

Do not require an LLM `user_description` on the tool call. If we later want a mandatory
owner-facing description from the model on every tool the owner sees, that can replace or
prefix this line. Not in this pass.

Parked (out): a plaintext list of that run’s changes next to the pills, opened from a
hoverable list icon. Not in this pass.

There is no unpublished snapshot per edit and no per-page version table.
Website edit history is typed increments on `edit_history`; Ctrl+Z is in-memory, then PATCH.

### `update_reviews`

Rewrite the ordered reviews **on one reviews website section**. Same Ask first / instant apply
gate as `update_slot`. Same PATCH as Content. Does **not** edit the pool or **top reviews**.

```text
update_reviews(
  section_id,
  review_ids[]   # ordered pool ids; length ≤ that website component’s max
)
```

Ids must be `in_pool` (not archived). Duplicates in one array are `400`. Over the website
component max is `400`. Empty `[]` is a valid wipe of **that** website section (keep the
website section; no fake copy). `create_section` of a reviews website component starts empty
until this tool or Content fills it. Onboarding 06 may call this tool.

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
  show_email?: bool | omit,
  show_contact?: bool | omit
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
5. **show_phone / show_email / show_contact** — bar CTA visibility. Not tree nodes. Marketing phone and
   email hrefs are always `{{marketing_phone}}` / `{{marketing_email}}` (no `tel:` / `mailto:`
   override). Contact href is the Contact website page.

`add_entries`: parent `id` (omit = top-level) + new node (`kind` + `path` or `label`/`href`).
`remove_entries`: ids, at most 4. `update_entries`: text → `label`; url → `label` and/or `href`;
page → `path`, optional display `label`. Kind is not changed by update (heading ↔ link is remove
+ add).

Invalid is `400`; over bar cap (8 top-level top menu, 12 footer, 8 children per parent) is `409`.
A page already in that tree is `400`. Tool result returns the tree (post-update ids). GET for
the assistant returns both trees with `id` / `kind` / `label` / `path` / `href` (no UUID).

Logo and density stay on **Website styles** (other tools). Do not name this
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
