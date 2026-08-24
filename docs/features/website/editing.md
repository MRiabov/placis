# Website editing

How an owner's edits reach the backend and appear in the frontend. "Think Wix": select, edit, see
it update, then website publication.

## The loop

1. `GET` loads the typed **website editor projection** once (page select / reload). That is the
   only hydrate. The canvas (`frontend-2`) renders that unpublished website through the shared
   contractor-website component package — the same ones the live website (Astro) uses.
2. The owner edits inline: click-to-edit visible text, swap an image (media library workspace
   item or drag onto the canvas), reorder / add / remove a website section, change a design control, SEO,
   or the website style catalog preset.
3. The canvas and editing panel mutate the **in-memory website editor projection immediately**
   and re-render from it. That working copy is the cache. There is **no Save action** and no
   Saving / Saved indicator. Edits persist automatically. If a copy-out or media-library upload
   has not succeeded after **10 seconds**, show a visible error. Keep the local edit and keep
   retrying. The leave guard still applies — the change is still uncopied.
4. A schema-validated **PATCH** (`/api/v1/website/editor/...`) **copies** the change to unpublished
   rows. It is persistence, not the render path. Do not `GET` after each PATCH. Do not replace the
   whole projection from the PATCH response (that is frontend → backend → frontend). Merge only
   `{ edit_history_head, batch_id }` (plus assigned ids on create). Typing does **not** PATCH.
   Copy-out for `text` / `rich_text` / SEO happens on **click-off** (leave the field). Discrete
   actions (image swap, reorder, add/remove a website section) queue a PATCH immediately. The
   frontend has a **safety timer**: at most one website-editor PATCH in flight, and at most one
   send every **500ms**, coalescing queued click-offs and discrete actions into the next body.
   That is why `429` should be rare. Also flush on route change, website publication, and page
   hide / unload so a close-tab without blur is not lost. If a copy-out or media-library upload
   is queued or in flight, or the focused field is dirty, the website editor **blocks leaving**
   until it finishes or the owner confirms discard (in-app confirm plus `beforeunload` on tab
   close / reload).
5. The backend validates the change against the website component contract and **upserts** the
   unpublished website rows, appends `edit_history` for that copy-out, and advances
   `edit_history_head`. The body is only the changed website slots / website sections — not the
   whole unpublished website. Over-chatty PATCH from one tenant is `429` with `Retry-After`; the
   website editor retries with backoff and **keeps the local edit**. Do not write `audit_events`
   per website slot edit. Last writer is `edit_history` only ([assistant.md](assistant.md)).
   There is no `POST /undo` or `POST /redo`.

The backend serves a typed **website editor projection** — website pages, website sections, current
website slot values, validation status, website publication blockers, allowed controls — and the
frontend consumes that on hydrate, never raw records. After hydrate, the frontend owns the working
copy. Tokenized values (`{{business_name}}`) stay as tokens in the unpublished website and show as
small inline variable chips in the website editor.

Sending PATCH is not enough on its own. The predecessor `useSaveEditorPage` `onSuccess` that
`setQueryData`s the full PATCH response is the round-trip to stop. Website publication, apply
website styles, Connect website address, media-library upload, and adding a website page still
take their response (new ids / publication metadata). Do not background-refetch the projection
on window focus while the website editor is open.

## Edits mutate unpublished rows; website publication writes a website version

- **Edit = mutation** — an edit upserts the unpublished website rows in place: text/image →
  `website_slots.value`, design/visibility → `website_sections.design` / `status`, position →
  `website_sections.position`, add/remove a website section → `website_sections` + `website_slots`.
- **Website publication** — writes a website version: `website_publications` + `website_manifest`
  (a published website copy) from the current unpublished website.

Website publication is always a separate, explicit action. Do not write a per-page version table.
The website editor has no Save; unpublished rows are written on click-off (and discrete
actions), paced by the safety timer. Explicit
actions that remain: website publication, Connect website address, and apply website styles.

## Models

The website editor is one typed **projection** (read) and one **patch** (write).

### Read — the website editor projection

`GET /api/v1/website/editor/pages/{page_id}` returns:

- `tenant` (id, website address, name); `page` (id, path / website page path, title,
  page_type, status, validation status,
  website-publication-blocker count).
- `seo_title`, `seo_description`, `seo_og_title`, `seo_og_description`, `seo_canonical_url`,
  `seo_noindex`, `seo_primary_keyword`; tenant **website styles** (preset + overrides from
  `website_settings`, shown here, stored once per tenant).
- `sections[]` — each: `id`, `page_id`, `component_id` (+ `component_version`, `schema_version`,
  `family`, `variant`), `position`, `status`, `visible`, `props`, `design`, `slots[]`,
  `design_controls[]`, `origin`, `unsupported_component`.
- `media_assets[]`, `forms[]` (website forms), `menus` (`top_menu` and `footer` trees plus
  `show_phone` / `show_email` — [data-model.md](data-model.md)).
- `publication` (active website version + `has_unpublished_changes`),
  `validation`.
- `preview_url`, live website URL. The website editor canvas is not a website preview.

No new routes. Optional query on this same GET: `include_edit_history=true`.

**Open hydrate** (enter `/cms/website`, full reload, or after `409` `edit_history_conflict`):
`GET /api/v1/website/editor/pages/{page_id}?include_edit_history=true` — the fold for the
selected website page **and** tenant-scoped website edit history (last 200 batches). A batch
can be website styles, a website form, or another website page, so the log is not a per-page
slice. Extra fields: `edit_history_head` (uuid, null if the stack is empty), `edit_history[]`
(each batch: `batch_id`, `edited_by`, `ai_generation_id`, rows of target / `op` / `before` /
`after`).

**Website page switch:** the same GET with the query off. Fold only. Do not re-download
`edit_history`.

A **website slot** (`sections[].slots[]`): `id`, `key`, `type`, `label`, `required`, `max_length`,
`value` (typed), `status`, `origin`, `validation_errors`.

A **design control** (`sections[].design_controls[]`): `key`, `type`, `label`, `values[]`, `default`,
`value`.

### Write — the patch

`PATCH /api/v1/website/editor/pages/{page_id}` takes a website page patch whose `sections[]` carry
the edits, plus required `base_edit_history_head` (the acked head; null only if the stack is
empty). Dirty keys unchanged — including keys dirtied by in-memory undo/redo. Success returns
**only** `{ edit_history_head, batch_id }` — not the projection, not the log. To update a
website slot you send:

```json
{ "sections": [ { "id": "<section id>", "slots": [
    { "key": "headline", "type": "text", "value": "Roof repairs across Dublin", "status": "unpublished" }
] } ] }
```

- **website slot patch** — `key`, `type`, `value`, `status` (`label` optional).
- **website section patch** — `id`, `component_id` (optional swap), `component_version`, `visible`,
  `design`, `slots[]`.
- **website section create** — `component_id`, `component_version`, `position`, `props`, `design`,
  `origin`.
- **website section order** — `ordered_section_ids[]`.
- **website page create** — `path`, `title`, `page_type`, SEO columns, unpublished content.
- **website form patch** — `website_form_id`, `title`, `submit_action`, `fields[]` (typed form
  field rows), `privacy_notice`.
- **menus patch** — optional `top_menu` and/or `footer` (full closed JSON trees) and optional
  `show_phone` / `show_email`. Omit a field = no change. Human PATCH may replace a whole tree
  (including a wipe). Assistant writes use `update_menus` ([assistant.md](assistant.md)), not
  a blob replace.

Coalesce means the **dirty keys since the last successful copy-out**, not the full draft. Do not
send sibling website slots, `media_assets[]`, the website manifest, or file bytes. Image website
slots send a `media_asset_id` (and crop / focal point if those changed). That PATCH is the same
**attach**, **crop**, and **focal** the website assistant calls (`update_slot`;
[assistant.md](assistant.md)). Attach only retargets the slot. Crop / focal run that write,
then the slot points at the returned item (copy-on-write stays inside that function;
[media library](../other/media/README.md)). Photos go through the media-library upload, not this
PATCH. File replace is that upload / replace, not this body.

Typical PATCH is **under 10 KB** (one headline is hundreds of bytes; a rich-text click-off is a
few KB). A busy coalesced window stays in that band. A **1 MB** body would mean we shipped the
whole unpublished website or a `data:` image — both are bugs. The API rejects a PATCH body over
**64 KB** (`413`); slot `max_length` and typed structs reject earlier. `GET` hydrates one website
page (tens of KB of JSON: copy, ids, public URLs). Website publication is a small POST; Go builds
the website manifest from Postgres and writes R2 — the owner does not upload HTML.

Typing (`text` / `rich_text` website slots, SEO copy, website form field labels): PATCH on
**click-off** (blur), not per keystroke and not on an idle-while-typing timer. The canvas
already has the text. Discrete patches (image, reorder, add/remove) skip the field and queue
immediately. Both go through the frontend safety timer (one in flight, **500ms** min gap,
coalesce). Flush on leaving the website page, website publication, and page hide / unload —
those wait on the in-flight copy-out rather than opening a second connection.

The jsonb columns (`website_slots.value`, `website_sections.props` / `design`) are in-place
`UPDATE`s of one row. There is no unpublished snapshot per edit, so we do not append a page- or
site-sized jsonb blob per keystroke. Click-off plus the safety timer is what keeps TOAST and
WAL down. Website edit history appends typed increments for the copy-out (one field / slot /
structure change), not a second fold. Website publication still writes one `website_manifest`
jsonb per website version (kept, never overwritten).

`base_edit_history_head` must match `website_settings.edit_history_head`. Match → apply, append
the batch, return the new head. Mismatch → `409` `code=edit_history_conflict` (body may echo
server `edit_history_head`). The frontend rehydrates once with `include_edit_history=true` for
the selected website page. Do not merge by hand. Do not keep painting a stale stack. Website
assistant Apply sends the same `base_edit_history_head` on its existing apply request; same
success / `409` shape. PATCH (including undo copy-out) is `409` if a website assistant run is
applying.

Do not periodically hash the unpublished website or the undo log. Equality is only the acked
`edit_history_head`. The frontend is ahead when it has dirty or queued keys — that is local-first,
not a bug. Two tabs, Apply, or another device moving the head are the mismatch cases. No timer
ping. The next copy-out after a long hide still carries `base_edit_history_head`.

The API allows **30** website-editor PATCH requests per tenant per **10 seconds**. Above that:
`429` and `Retry-After`. That cap is a backstop (second tab, website-assistant burst). A single
website editor must not hit it: the 500ms safety timer tops out around 20 sends / 10s. On `429`
the website editor backs off and retries; it does not spin. Website assistant applies
([assistant.md](assistant.md)) use the same upsert path and the same cap. Streaming model tokens
never write jsonb.

### Leave guard

If the focused field is dirty, a PATCH is queued or in flight, a media-library upload is in
progress, or the last copy-out / upload failed (still uncopied), do not let the owner leave
immediately.

- **In-app** (another CMS route, browser back): confirm first — same idea as Gmail’s “discard
  edits?”. Copy: edits are still being copied. Stay, or leave anyway.
- **Tab close / reload**: `beforeunload`. Modern browsers show their own string; do not depend
  on custom text.
- Prefer finishing the copy-out, then navigate, so the confirm is the exception.
- Confirming leave discards only what has not been copied; an in-flight request may still
  finish. Website publication flushes first and does not show discard.

Slot `value` stays bounded by the website component contract (`max_length` and typed structs).
Reject oversized jsonb at the API; do not store it. Reject a PATCH over 64 KB.

## Undo / redo (in memory)

Undo and redo are **in-memory**. There is no `POST /undo` or `POST /redo`. The database stores
the fold (live unpublished rows) and the **record** (`edit_history`). It does not perform undo.

1. If the focused field is dirty and not yet copied out: Ctrl+Z restores **in-memory** text
   only. Same as not PATCHing while typing. Not a website edit history batch yet.
2. Otherwise Ctrl+Z applies that batch’s `before` to the in-memory projection (local-first).
   Redo (Ctrl+Shift+Z) applies `after`. Then copy-out with the **existing PATCH** (dirty keys,
   safety timer, leave guard, 10s error) so the fold matches. That PATCH appends a new
   website edit history row (the record of the copy-out) and returns a new `edit_history_head`.
3. The frontend keeps undo/redo stacks in RAM. Hydrate (`include_edit_history`) **seeds** those
   stacks from the last 200 batches so Ctrl+Z can go farther than this tab’s RAM. After
   reload, redo of a not-yet-copied local undo is gone; undo still walks the hydrated record.
4. Empty stack: no-op. Website publication rollback is unrelated. Undo is not Reject.

After PATCH / Apply: do not re-GET the log. Merge only `batch_id` and `edit_history_head`.
After in-memory undo/redo, the following PATCH is the same merge. Do not replace the
projection from the PATCH body.

## What each action does

All website editor actions are CRUD on the unpublished website records. Website publication writes
a website version.

| Action | Mutation (unpublished website rows) |
| --- | --- |
| edit text / image in a website slot | `website_slots.value` |
| change design controls / visibility | `website_sections.design` / `status` |
| reorder website sections | `website_sections.position` |
| add / remove a website section | `website_sections` + `website_slots` |
| add a website page | `website_pages` + `website_sections` + `website_slots`; append a top-level page node on `menus.footer` (and `menus.top_menu` unless legal or cap) |
| edit top menu / footer tree or bar CTAs | `website.menus` (`top_menu` / `footer` / `show_phone` / `show_email`) |
| swap a website component | `website_sections.component_id` (preserving compatible website slots) |
| change the website style catalog preset | `website_settings` (applied only on explicit apply) |

Website publication writes `website_publications` + `website_manifest` (a website version).

The contractor website application (`apps/contractor-website`) does **no per-edit work**. Live
GET reads prebuilt HTML in R2 `latest/` ([cloudflare.md](cloudflare.md)). Website preview calls
`GET /api/v1/public/site/resolve`. Editing mutates the in-memory projection, then copies unpublished
rows via PATCH; the live website changes only on website publication. The website editor canvas
renders the unpublished website (React + that package), not through Astro. That canvas is not a
website preview. The frontend holds one working projection; it does not accumulate unpublished
documents in memory.
