# Website editor tools

Hard-typed website editor tools the **assistant** (and onboarding 06) may call.
Assistant look, thread, and HTTP: [assistant](../assistant/README.md). Plan vs continuous and Ask first
vs instant apply stay **website editor only** (below). Generation and search go
through `LLMProvider` in `ai` ([LLM layer](../../general-architecture/llm-layer.md)).

Onboarding [automatic website copy generation](../onboarding/pipeline/06-website-copy-generation.md) ([website 03](pipeline/03-website-copy-generation.md)) reuses these tools
headless (**continuous** + **instant apply**, no chat UI, no `create_page`, no
`update_reviews`) after the website template’s pages are copied onto the
unpublished website. That job is `GenerateWebsiteCopy`, not the CMS assistant.
After each `update_slot`, Go **calls** `websiteRender` and **sends**
`WebsiteRenderRequest` ([website HTTP](api.md)). Response `WebsiteRenderResponse`. The
tool result is a website image render (`before_image` / `after_image`), not
HTML. Do not persist a website image render onto unpublished website slots.
**Must not:** a model-invoked screenshot tool.

Assistant look: [assistant design decision record](../assistant/design-decision-record.md), website placement:
[design decision 18](design-decision-record.md). Architecture: [website ADR](ADR.md) 6.

## Tools (hard-typed, validated, parallel)

The assistant is an **agent** (up to **20** tool-using model turns after one
owner send / utterance). Tools are hard-typed website editor actions — never
one generic plan tool with freeform JSON. Each call is validated on input; the
backend turns it into a planned / applied / skipped / failed event. **128K /
12K tokens** are text `LLMProvider` assembly only. Voice live context is
xAI-side after instructions seed (xAI region from the **business country**).

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
| `update_details` | the shared Details tool — one implementation ([details HTTP](../business-profile/details/api.md)) |
| `create_project` | create a **project draft** (same `POST /v1/projects` as first click-off on **New project**; not in the next website publication bake until Approve) |
| `set_project_title` | PATCH the project title (immediate) |
| `set_project_cover` | PATCH cover to an existing media library item, or clear it |
| `patch_project_description` | queue one Ask-first description hunk; **Apply** PATCHes the resulting `description` |
| `archive_project` | same archive HTTP as the editor |
| `unarchive_project` | same unarchive HTTP as the list |

Argument lists below match existing website PATCH / menus / media-library HTTP
— not new product. `update_reviews`, `update_menus`, image `update_slot`,
`cleanup_image`, and `update_details` are spelled out in later sections.

### `update_slot` (text / rich_text / link / list)

```text
update_slot(
  section_id,
  slot_key,
  value            # typed to that slot; image fields are the image form below
)
```

Same Ask first / instant apply gate as image `update_slot`.

### `update_seo`

Same PATCH SEO columns as the website editor.

```text
update_seo(
  seo_title?,
  seo_description?,
  seo_og_title?,
  seo_og_description?,
  seo_canonical_url?,
  seo_noindex?,
  seo_primary_keyword?
)
```

Omitted fields are no-ops. Current website page only.

### `update_form`

Same PATCH as Content website-form dirty keys.

```text
update_form(
  website_form_id,
  title?,
  submit_action?,
  fields[]?,
  privacy_notice?
)
```

### `update_website_styles`

Same `PATCH /v1/website/editor/settings` named fields.

```text
update_website_styles(
  preset_id?,
  primary?,
  neutral?,
  accent?,
  radius?,
  density?
)
```

Tenant-scoped, not per website page. Extra keys 4xx.

### `set_section_visibility`

```text
set_section_visibility(
  section_id,
  visible: bool
)
```

Does not delete or archive.

### `update_section_design`

```text
update_section_design(
  section_id,
  design    # named design-control fields from that website component; extra keys 4xx
)
```

### `reorder_sections`

```text
reorder_sections(
  ordered_section_ids[]   # full ordered list for the current website page
)
```

### `create_section`

Same create keys as the website editor PATCH.

```text
create_section(
  component_id,
  component_version,
  position,
  props?,
  design?,
  origin?
)
```

Approved website component only.

### `create_page`

Same as `POST /v1/website/editor/pages`. Also appends a top-level page node on
the footer, and on the top menu unless legal or cap.

```text
create_page(
  path,
  title,
  page_type,
  seo_title?,
  seo_description?,
  seo_og_title?,
  seo_og_description?,
  seo_canonical_url?,
  seo_noindex?,
  seo_primary_keyword?
)
```

Onboarding 06 does not call this tool.

### `generate_image`

Last resort when nothing in GET `media_assets[]` fits (work-photo
slots). 03 must not call this for a logo slot or a portrait / About /
leadership slot (leave empty). Writes `media_library`
immediately (`CreateGeneratedMediaAsset`; `supplied_by=ai`,
`created_by=ai`, pending review; classification
`algorithm=copy_requested_media_caption`). Canvas attach still follows Ask
first vs instant apply.

```text
generate_image(
  prompt,              # minLength 1
  media_caption,       # minLength 1, maxLength 500
  section_id?,         # attach that new item
  slot_key?
)
```

Does not attach an existing library photo — that is `update_slot`. Stays
website-editor unless a later pass says otherwise.

**Owner action = assistant action.** Each tool is another caller of the same
website-editor / media-library / Details / Projects execution the owner already
uses (Ask first / instant apply around canvas tools). Text `update_slot` is the
same upsert as click-off PATCH. Image attach, crop, focal, and AI cleanup are
the same functions as the website editor PATCH and `/cms/media`.
`update_details` is the shared Details tool (Ads generator calls it too), not a
second copy of that Details tool. Click-off on `/cms/details` stays PATCH.
Projects tools call the same `POST` / `PATCH` / archive HTTP as `/cms/projects`
([projects HTTP](../business-profile/projects/api.md)). There is no second
assistant implementation and no public copy helper the tools call.
Copy-on-write (`parent_media_asset_id`, parent file never replaced) stays
**inside** those functions.

**Write-path ownership.** The CMS dispatcher (text in-process on
`GET /v1/assistant/thread/ws`; voice `POST /v1/assistant/voice/tool-calls`)
returns events only. It does **not** upsert unpublished website rows.
Frontend mutates the in-memory projection and PATCHes Request
`WebsitePageUpdate` (and `/menus` Request `WebsiteMenusUpdate`). Those
PATCHes **persist into** `website_slots` / `website_sections` /
`website_pages` / `website_forms` / `edit_history` /
`website_settings.edit_history_head` (and `website.menus` on `/menus`).
Onboarding 06 writes unpublished rows in River SQL (no `frontend-2`).
`generate_image` /
`cleanup_image` write `media_library` immediately (same as today’s media-library
HTTP); canvas attach still follows Ask first vs instant apply. Every agent edit
is Ctrl+Z’able. `cleanup_image` is also allowed on Ads (same media-library
function, then ads placement PATCH — not a website slot). Ads generate / revise
/ rewrite are **not** these tools.

Planner: a named real photo → **attach first** (`update_slot` +
`media_asset_id`). Cleanup only when they ask to tidy that photo.
`generate_image` only when nothing in GET `media_assets[]` fits ([ADR](ADR.md) 6). UUIDs
are the media library key.

`generate_image`: the model supplies a prompt + media caption; the backend
**calls** `CreateGeneratedMediaAsset`, which persists the tool
`media_caption` as `media_asset_classifications` (`photo_kind=photo`,
`algorithm=copy_requested_media_caption`) and must not **insert**
`describe_image`. The canvas may attach **that new item** to an image
website slot on the unpublished canvas (convenience). It does not attach
an existing library photo — that is `update_slot`. The canvas always
surfaces a warning on that image. Owner approval makes the media library
item approved and permanent. Website publication and the live website
still require approved media library items. Ads stay approved-only.

`refinement_plan` is the plan-workflow text (no mutation). It is confirmation
text, not a required schema of affected pages / assumptions / acceptance
criteria. `assistant_plan` may summarize alongside the edit tools.

## Three configs

Independent options. They combine. Default in the website editor **text:**
**plan + Ask first**, **Follow** on. Plan and Ask first are boolean switches on
the Assistant (website editor text only). Follow is always on (not a request
field). Voice is always Ask first; no owner Plan switch; no `plan` /
`ask_first` / `follow` on Voice create.

**Follow** — the canvas snaps to the website slot the **agent** is editing.
Always **on**. The owner cannot turn it off. Not a WS / HTTP field. A request
with `follow: false` is **400**. Dispatcher: [assistant](../assistant/architecture.md).

**Workflow: plan vs continuous** (how the request is scoped)

- **Plan** — plan in text first (Cursor-style). Only after the owner accepts
  that text does the assistant continuously apply. For larger or ambiguous work.
- **Continuous** — no plan text. Start applying. For a small ask like “make the
  about us section a bit clearer”.

**Gate: instant apply vs Ask first** (whether Apply / Reject exist)

- **Ask first** (`ask_first`) — **Apply** / **Reject** pills sit on the canvas
  over the composer, or in the left stack next to DustOrb when Voice is on, for
  the whole pending run. The canvas shows the proposal in memory.
  Nothing is PATCHed until **Apply**. Never `on_confirm`. Voice is always this
  gate.
- **Instant apply** — those buttons are bypassed. In the CMS, the website editor
  applies each validated tool to the in-memory projection and PATCHes as they
  succeed. There is no Reject for that edit. Onboarding 06 writes unpublished
  rows headless (no `frontend-2`).

After a plan is accepted, apply uses the same engine as continuous workflow.
Only the gate changes whether Apply / Reject appear.

## Apply / Reject is one-way

The same agent edit must never **Apply** and then **Reject** (or the reverse).

- **Ask first:** `pending` → Apply *or* Reject, never both. The first committed
  transition wins. A second Apply, Reject, or retry after that is a no-op /
  `409`. The UI drops the buttons once the server says terminal.
- **Instant apply:** the edit is created **already applied**. Reject is not
  offered; the API refuses it.

In the CMS, Apply does not write unpublished rows on a distinct path. The
website editor mutates the in-memory projection, then the ordinary PATCH (and
`/menus`) copies out with `ai_generation_id` so that `edit_history` batch is
`edited_by=agent`. `record-apply` / `record-reject` are activity metadata only.
After Apply, the owner does not Reject that edit. Changing the canvas later is a
**new** human edit (PATCH / typing). That is not Reject. There is no “revert
last assistant batch” via Reject. Activity cards show what happened; they are
not an undo control. After Apply, Ctrl+Z undoes that **batch in RAM**, then
PATCHes like any owner edit. The Apply row in `edit_history` keeps
`edited_by=agent`; the copy-out of the undo is a later human batch.
Instant-apply tools undo one tool at a time in RAM. Live website rollback is a
different surface ([api.md](api.md)).

## Last writer

Last writer lives only on `edit_history` (`edited_by` `human`/`agent`,
`ai_generation_id` when agent). Live unpublished rows have no last-writer
columns. See [persistence.md](persistence.md). `origin` is still first source, not last writer.

Apply (Ask first whole Apply, or one instant-apply tool) is one `edit_history`
batch, written by the CMS PATCH that copies those dirty keys (`ai_generation_id`
set). Pending Ask first edits are not in the table. Reject never writes a row.
`record-apply` / `record-reject` do not send `base_edit_history_head`; the PATCH
already did. Success / `409` `edit_history_conflict` match any other PATCH
([editing.md](editing.md)).

**One in-flight CMS assistant run per tenant** (`assistant.runs`). See
[assistant](../assistant/architecture.md). A second CMS start is `409` until the current run finishes or
fails. There is no cancel HTTP. Two tabs or voice + text must not both start a
CMS run. Onboarding 06 is a separate River `tenant_id` lock — it does **not**
409 CMS PATCH or CMS assistant HTTP. Same website-slot overlap after pay is
last-write / `edit_history_conflict`. While a CMS run is in flight, PATCH is
allowed — that is the apply path.

## Output

**Activity** sits on a chat turn. Each tool call in the thread is a muted
**owner line** from the backend (`summary`, `string` + `maxLength`). It is not a
bordered card per tool. The frontend never renders a tool name (`update_slot`,
`cleanup_image`, …) and never says slot. Expanding a call shows the affected
targets and a before/after, and selecting it focuses the canvas and Content.
Execution events still exist (`Edited 2 website sections`,
`Created 1 website page`, `Updated SEO`, `Changed colors`, `Failed to apply`).
Ask first Apply / Reject is a pair of **pills on the canvas** over the composer,
not in the thread and not on each tool.

`summary` is **deterministic**, built by the backend from the validated tool +
target. The owner-facing label on `update_slot` is a closed union: **heading**,
**text**, or **image**. The place is the website section’s owner-facing name
(Hero, Services), not an id. The thread icon is from a closed union: **write**
(pencil) for tool summaries, **think** (lightbulb) for thinking. There is no
search/grep tool.

- `slot_type=image` → `Updated image on {Section}`
- `slot_key` `heading` / `headline` / `title` → `Updated heading on {Section}`
- any other `update_slot` (body, lede, rich text, link, list, …) →
  `Updated text on {Section}`
- `update_reviews` → `Updated reviews on {Section}`

Other tools use the same field, never the tool name, for example:
`Cleaned up image on Hero`, `Generated image on Hero`, `Updated SEO`,
`Updated website styles`, `Hid Services`, `Added Reviews`, `Created Contact`,
`Updated top menu`, `Updated Business details`.

Do not require an LLM `user_description` on the tool call. If we later want a
mandatory owner-facing description from the model on every tool the owner sees,
that can replace or prefix this line. Not in this pass.

Parked (out): a plaintext list of that run’s changes next to the pills, opened
from a hoverable list icon. Not in this pass.

There is no unpublished snapshot per edit and no per-page version table. Website
edit history is typed increments on `edit_history`; Ctrl+Z is in-memory, then
PATCH.

### `update_reviews`

Rewrite the ordered reviews **on one reviews website section**. Same Ask first /
instant apply gate as `update_slot`. Same PATCH as Content. Does **not** edit
the pool or **top reviews**.

```text
update_reviews(
  section_id,
  review_ids[]   # ordered pool ids; length ≤ that website component’s max
)
```

Ids must be `in_pool` (not archived). Duplicates in one array are `400`. Over
the website component max is `400`. Empty `[]` is a valid wipe of **that**
website section (keep the website section; no fake copy). `create_section` of a
reviews website component starts empty until this tool or Content fills it.
Onboarding 06 may call this tool.

### `update_menus`

One tool for both bars. This surface is rare; eight named tools are not worth
it. Same Ask first / instant apply gate as `update_slot`.

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

Omitted lists and omitted `show_*` are no-ops. Empty `{}` / `[]` are no-ops, not
wipes.

Apply order:

1. **remove** — old ids, max 4
2. **add** — new nodes; server sets `id` from the label (page title for
   `menu_node_kind: page`)
3. **reorder** — nested `{ id, children }` using **pre-update** ids (GET ids
   plus ids just assigned by add). Membership = tree after remove+add. Does not
   delete. A flat id array is invalid.
4. **update** — labels / hrefs / path last. Label change recomputes `id` after
   reorder.
5. **show_phone / show_email / show_contact** — bar CTA visibility. Not tree
   nodes. Marketing phone and email hrefs are always `{{marketing_phone}}` /
   `{{marketing_email}}` (no `tel:` / `mailto:` override). Contact href is the
   Contact website page.

`add_entries`: parent `id` (omit = top-level) + new node (`menu_node_kind` +
`path` or `label`/`href`). `remove_entries`: ids, at most 4. `update_entries`:
text → `label`; url → `label` and/or `href`; page → `path`, optional display
`label`. Menu node kind is not changed by update (heading ↔ link is remove

- add).

Invalid is `400`; over bar cap (8 top-level top menu, 12 footer, 8 children per
parent) is `409`. A page already in that tree is `400`. Tool result returns the
tree (post-update ids). GET for the assistant returns both trees with `id` /
`menu_node_kind` / `label` / `path` / `href` (no UUID).

Logo and density stay on **Website styles** (other tools). Do not name this
tool `update_nav`.

### `update_slot` (image)

Same tool as text. No `attach_image` verb. Text / rich-text `value` is
unchanged.

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

- Image + `media_asset_id` only → **attach** (same as drag onto the canvas). No
  copy.
- Image + `crop` and/or `focal` → crop and/or focal **function**, then point the
  slot at the returned item. Omit `media_asset_id` → the slot’s current item.
  Crop and focal may be one function with two fields — still one implementation.
- `value` on an image slot is `400`. Image fields on a text slot are `400`.
- Tenant mismatch, archived, or `rejected` → `400`. `pending_review` may attach
  on the unpublished canvas (warning). Publication still needs `approved`.

Same Ask first / instant apply gate as text `update_slot`.

### `cleanup_image`

Same AI cleanup as `/cms/media`. Ads light cleanup, when it writes a
media-library copy, calls this same function.

```text
cleanup_image(
  section_id,
  slot_key,
  prompt,              # light cleanup: declutter, tidy background; not invent work
  media_asset_id?      # omit = the slot’s current item
)
```

Resolve parent → **AI cleanup** → point **that slot** at the returned item.
Other slots and ads keep the parent until retargeted. Cosmetic bound lives on
that cleanup (same as ads: no fake results). Canvas warning until approved.
Publication blocked until approved. Same Ask first / instant apply gate as
`update_slot`.

On **Ads**, the same function is `POST /v1/media-assets/{id}/image-edits`
(`media_asset_id` + `prompt`; no website `section_id`). Then PATCH that
placement on the existing ads caller path. Highlight / agent-edited notice;
Ctrl+Z’able. No `POST /v1/ads/…/cleanup`. Ordinary ads owner PATCH still has no
undo.

### `update_details`

The shared Details tool ([details HTTP](../business-profile/details/api.md)) — one implementation, also invoked by
the Ads generator. Not a second copy here. On this surface: applied immediately
(not Ask first Apply / Reject, not `edit_history`). Then the shared
notification. Onboarding 06 does not call it.

Activity `summary` example: `Updated Business details`. Never a tool name.

### Projects tools

Same HTTP as `/cms/projects` ([projects HTTP](../business-profile/projects/api.md), [projects ADR](../business-profile/projects/ADR.md) 4). Allowed only
while `assistant_screen` is `website_editor` (same gate as `update_slot`). The
Assistant on Projects is guide-only. Writing on `/cms/projects/{id}` is
**inline AI assistance**, not Voice and not the Assistant. `create_project`
creates a **project draft** — do not treat a draft id as bake-ready in a
gallery. Description hunks are **Ask first** (pending in memory; **Apply**
PATCHes). Title and cover PATCH immediately. Cover is an existing media library
item or null — never `generate_image`, never an invented photo. Archive only if
the owner asked. `archive_project` / `unarchive_project` are the same POSTs as
the editor (unarchive returns a project draft).
**Select to edit inline AI assistance** is a `span` patch. `patch` is a closed
union: `span` (UTF-8 code points, exclusive end), `quote` (find exactly once),
`append`, `fill` (empty description only). Refuse empty find, 0 or >1 quote
matches, out-of-range span, fill when non-empty, a whole new description as a
tool arg, overlapping pending hunks.

Activity `summary` examples: `Updated description on {title}`, `Added to
description on {title}`, `Wrote description on {title}`. Never a tool name.

These tools never do a website publication, never bypass validation, and never
write arbitrary registry JSON. Projects writes are the tools above — one
implementation. It does not edit Certifications and reviews. Details writes are
`update_details` only — not a side effect of `update_slot` or website styles. It
does not delete or archive a website section or website page (hide stays:
`set_section_visibility`). It does not upload or replace the file — replace
stays the existing replace on `/cms/media` / website editor upload.
