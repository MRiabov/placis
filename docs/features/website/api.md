# Website HTTP

Conventions: [HTTP conventions](../../general-architecture/api.md). Unpublished website,
website assistant, website publication, Connect website address, projects. Field authority for
the website-editor PATCH body remains [editing.md](editing.md); this file locks the routes.

Live business profile: [details](../other/details/api.md). Media library:
[media library](../other/media/api.md). Website form submit: [leads](../other/leads/api.md).

Live HTML GET on `{website_prefix}.preview.placis.com` never calls Go. **Do not create**
`/v1/public/site/…` (including leftover resolve). Website publication writes R2 through an
authenticated internal render (not public OpenAPI) — that is not a live GET and not leftover
`/preview/{token}/`. Website form POST is [leads](../other/leads/api.md).

## Serve only types on HTTP

| Location | Persistence | HTTP |
| --- | --- | --- |
| Website slot `value` | jsonb | Discriminated union on `slot_type`: `text`/`rich_text` → string + `maxLength`; `image` → media library item id + crop/focal; `link` → url + label; `list` → typed array. **Do not expose `slot_type=json`.** |
| Website section `props` | jsonb | `oneOf` by `component_id`. Extra keys 4xx. Unknown `component_id` → `unsupported_component` + no props bag. |
| Website section `design` | jsonb | Named design-control fields. Extra keys 4xx. |
| Website edit history `before`/`after` | jsonb | Same union as the live field. |
| Website manifest | jsonb `website.v1` | **Omit** from website-editor GET/PATCH. Publication `*Read` is metadata only. |
| Website styles | columns + bounded jsonb | Named fields: `preset_id`, `primary`, `neutral`, `accent`, `radius`, `density`. Extra keys 4xx. |
| Website assistant plan | text | `string` + `maxLength`. Markdown. |
| LLM traces | jsonb | **Omit.** Activity cards are named event structs. |
| Top menu / footer | `website.menus` jsonb trees | Named node fields (extra keys 4xx). |

## Complete — unpublished website

CMS unpublished `website_*` / `website.menus` / `website_settings` writes are only `POST` /
`PATCH` on `/v1/website/editor/…` from `frontend-2`. No other `/v1` route upserts those rows.
Onboarding 05/06 write them in River, not via these routes.

### GET /v1/website/editor/pages

- **Auth:** Clerk JWT, active tenant
- **Callers:** website editor workspace (website page list).
- **Query:** optional `publication_id` (`website_publications` id from the dropdown). Omitted:
  unpublished list (`status=unpublished`). Set: that owner website version’s page summaries.
  `409` if `published_by=onboarding` or the id is not an owner row.
- **Response:** list of website page `*Read` summaries (id, path, title, `page_type`,
  status).

### POST /v1/website/editor/pages

- **Auth:** Clerk JWT, active tenant
- **Callers:** add a website page.
- **Idempotency-Key:** yes.
- **Request:** `path`, `title`, `page_type`, SEO columns.

### GET /v1/website/editor/pages/{page_id}

- **Auth:** Clerk JWT, active tenant
- **Callers:** canvas hydrate (once per website page select / reload). Reset to an owner
  website version: same GET, then PATCH dirty keys ([editing.md](editing.md)).
- **Query:** optional `publication_id` (`website_publications` id). Omitted: unpublished
  `*Read`. Set: that owner website version’s `*Read`. `409` if `published_by=onboarding` or
  the id is not an owner row. `404` if `page_id` is not in that website version. Do not send
  `include_edit_history` with `publication_id` (`400`). `include_edit_history=true` only on
  unpublished open hydrate or after `409 edit_history_conflict`. Switching website page: both
  queries off.
- **Response:** website page `*Read`: `path`, `title`, `page_type`, `status`, SEO
  columns (`seo_title`, `seo_description`, `seo_og_title`, `seo_og_description`,
  `seo_canonical_url`, `seo_noindex`, `seo_primary_keyword`), `validation`,
  website-publication-blocker count, `publication.has_unpublished_changes` (unpublished vs
  live, even when `publication_id` is set), sections/slots with catalog-discriminated
  `props` / `design` / `value`. Embeds tenant-scoped website styles, top menu, footer, and
  website forms so the canvas can paint. May embed display name / marketing phone for website
  placeholders; Details owns those writes. Reviews website sections include that section’s
  ordered pool ids (`website_slot_reviews`), not the ads **top reviews** list. Pool cards for
  Content “add from the pool” come from Details `GET /v1/business-profile/reviews`.
- **Must not:** `/pages/{id}/seo` as a separate route; `slot_type=json`; return
  `website_manifest`.

### PATCH /v1/website/editor/pages/{page_id}

- **Auth:** Clerk JWT, active tenant
- **Callers:** website editor. At most one PATCH in flight; 500ms coalesce of save-on-click-off
  and discrete actions ([editing.md](editing.md)).
- **Idempotency-Key:** yes.
- **Request:** `base_edit_history_head` plus **dirty keys only** — per-section / per-slot, dirty
  page metadata (title, path, SEO, `status` `unpublished`/`archived`), website form patches,
  section create/swap/visibility/design, `ordered_section_ids[]`, and a reviews website
  section’s ordered `review_ids[]` (from the pool, length ≤ that website component’s max;
  over max is `400`). Archive of a website page strips that page node from `website.menus`
  ([persistence.md](persistence.md)). Body cap 64 KB. Image website
  slots send a media library item id, not bytes. Example:

```json
{ "base_edit_history_head": "<uuid>", "sections": [
  { "id": "<section id>", "slots": [
    { "key": "headline", "type": "text", "value": "Roof repairs across Dublin", "status": "unpublished" }
  ] }
] }
```

- **Response:** `{ edit_history_head, batch_id }` plus assigned ids on create. No GET-after-PATCH.
  Do not round-trip the `*Read`.
- **Errors:** `409 edit_history_conflict`, `413`, `429` with `Retry-After`.
- **Must not:** predecessor `POST …/sections`, `PATCH …/sections/order`, `DELETE …/sections/{id}`,
  `POST …/slots/{key}/asset` — those edits are fields on this body. Top menu / footer are
  `/menus`, not this body.

### GET /v1/website/editor/settings / PATCH /v1/website/editor/settings

- **Auth:** Clerk JWT, active tenant
- **Callers:** website styles workspace. **Explicit apply**, not save on click-off.
- **GET query:** optional `publication_id` (same as page GET). Same `409` / `400` as page GET.
- **PATCH Idempotency-Key:** yes.
- **PATCH request:** `base_edit_history_head` plus dirty named website styles (`preset_id`,
  `primary`, `neutral`, `accent`, `radius`, `density`). Extra keys 4xx.
- **PATCH response:** `{ edit_history_head, batch_id }`. Same `409 edit_history_conflict` as
  the website page PATCH.

### GET /v1/website/editor/menus / PATCH /v1/website/editor/menus

- **Auth:** Clerk JWT, active tenant
- **Callers:** top menu and footer tree editors. One resource — one `website.menus` row
  (`top_menu`, `footer`, `show_phone`, `show_email`, `show_contact`).
- **GET query:** optional `publication_id` (same as page GET). Same `409` / `400` as page GET.
- **PATCH Idempotency-Key:** yes.
- **Request:** `base_edit_history_head` plus dirty keys only (`top_menu` and/or `footer`
  and/or `show_phone` / `show_email` / `show_contact`). Extra keys 4xx.
- **Response:** `{ edit_history_head, batch_id }`. Same `409 edit_history_conflict` as the
  website page PATCH.
- **Must not:** `/top-menu` or `/footer` as peer routes; menus fields on the website page PATCH.

## Complete — website assistant

One in-flight run per tenant (includes onboarding website copy generation). Tools never do
website publication. CMS unpublished writes are the existing website page PATCH and `/menus`
— not a second apply path. The website editor owns the working copy: Apply mutates the
in-memory projection, then copy-out is the ordinary PATCH (`ai_generation_id` on those dirty
keys so `edit_history` is `edited_by=agent`). Instant apply PATCHes as tools succeed. Ask first
**Apply** / **Reject** only `record-apply` / `record-reject` (activity metadata).

Onboarding 06 is the exception: the River job writes unpublished rows headless (no
`frontend-2`). While 06 is in flight, CMS PATCH and this assistant POST are `409`.

### POST /v1/website/editor/pages/{page_id}/assistant

- **Auth:** Clerk JWT, active tenant
- **Callers:** website assistant chat in `frontend-2`. Onboarding 06 does not call this POST
  (River writes unpublished rows headless).
- **Idempotency-Key:** yes.
- **Request:** plan vs continuous; Ask first vs instant apply; **Follow** (`follow`, boolean,
  default `false`). Plan text is `string` + `maxLength`. `follow: true` is refused (`4xx`);
  the owner cannot turn Follow on.
- **Response:** named activity / tool event structs. Proposed edits, not applied rows. Each
  tool event has `summary` (`string` + `maxLength`): the owner line, backend-constructed
  ([assistant.md](assistant.md)). The UI renders `summary` only. Never render `action` /
  tool names (`update_slot`, …). Icon is from a closed kind: write = pencil, thinking =
  lightbulb. There is no search/grep tool.
- **Must not:** return `ai_generations` blobs; write unpublished rows from this POST in the CMS.

### POST /v1/website/editor/pages/{page_id}/assistant/record-apply

- **Auth:** Clerk JWT, active tenant
- **Idempotency-Key:** yes.
- **Callers:** Ask first **Apply** after the website editor PATCHed (or queued) the dirty keys.
- **Request:** metadata only (`ai_generation_id` of the pending batch). No unpublished payload,
  no `base_edit_history_head` — the PATCH already took the head.
- **Behavior:** activity card terminal. **Must not** upsert website pages / sections / slots /
  menus and **must not** append `edit_history`. Second transition `409`. **No revert.**

### POST /v1/website/editor/pages/{page_id}/assistant/record-reject

- **Auth:** Clerk JWT, active tenant
- **Idempotency-Key:** yes.
- **Callers:** Ask first **Reject**. The website editor drops pending edits in memory; no PATCH.
- **Request:** metadata only (`ai_generation_id`).
- **Behavior:** activity card terminal. **Must not** write unpublished rows or `edit_history`.
  Second transition `409`.

## Complete — website publication and Connect website address

Onboarding 07/08 also write `website_publications` (`published_by=onboarding`). Those rows are
not this CMS POST. They are never website-rollback targets.

### GET /v1/website/publications / POST /v1/website/publications

- **Auth:** Clerk JWT, active tenant
- **Callers:** website publication dropdown (whole website, not per website page).
- **POST Idempotency-Key:** yes.
- **POST request:** no destination body. One `latest/` tree. Purge the preview website address
  and every `active` website address. Destinations are not independent website versions.
- **POST:** `published_by=owner`.
- **GET list:** metadata `*Read` (`version_number`, `status`, `active`, `published_by`, times).
  **Omit** `website_manifest`. Rollback UI uses `published_by=owner` only — omit onboarding
  07/08 and 05-retry rows.

### POST /v1/website/publications/{id}/rollback

- **Auth:** Clerk JWT, active tenant
- **Idempotency-Key:** yes.
- **Callers:** website publication dropdown — **live** website rollback.
- **Behavior:** copy that owner website version onto `latest/`, purge. `409` if
  `published_by=onboarding` or the id is not an owner row. Does not rewrite unpublished
  website rows.
- **Response:** that publication `*Read` (`active=true`, `version_number`, times). The
  dropdown updates from this body — no extra GET required.

### GET /v1/website/addresses / POST /v1/website/addresses

- **Auth:** Clerk JWT, active tenant
- **Callers:** publication dropdown (list hosts) and Connect website address modal.
- **GET:** `type=subdomain` (preview website address; reserved at onboarding 07 — this GET does
  not create it) and `type=custom` (website addresses they connected).
- **POST:** Connect website address only (`type=custom`, hostname they supply, e.g. `acme.ie`).
  Does not reserve `tenants.website_prefix` or insert `type=subdomain`. Website publication
  does not attach a website address.
- **POST Idempotency-Key:** yes.

### GET /v1/website/addresses/{id}

- **Auth:** Clerk JWT, active tenant
- **Callers:** poll a connected website address until `active`.
- **Response:** hostname, type, status, DNS rows (type, Host, Value; copyable). No GoDaddy/nameserver mutation.

## Complete — projects

Owned by the Projects screen (Profile group). Table is `website.projects`. Not nested under
the website editor and not under the business profile.

### GET /v1/projects / POST /v1/projects

- **Auth:** Clerk JWT, active tenant
- **Callers:** `/cms/projects`.
- **POST Idempotency-Key:** yes.
- **Request (create):** title, description, cover media library item id.

### GET /v1/projects/{id} / PATCH /v1/projects/{id} / DELETE /v1/projects/{id}

- **Auth:** Clerk JWT, active tenant
- **PATCH Idempotency-Key:** yes.

## Do not create

- `/v1/tenants/{website_prefix}/website/…`
- `/v1/public/site/…` (including resolve, meta, sitemap, assets)
- leftover `/preview/{token}/` HTML or `GET …/public/site/resolve`
- `POST /v1/website/addresses` with `type=subdomain` (reserved at 07)
- blueprints, posts, careers
- `/undo` `/redo` `/edit-history`
- `POST /v1/website/publications/{id}/restore-unpublished` (editor GET `publication_id`, then PATCH)
- `GET /v1/website/publications/{id}/pages` (use editor GET `publication_id`)
- `/v1/website/editor/top-menu`, `/v1/website/editor/footer` (use `/menus`)
- `assistant/apply`, `assistant/reject` that write unpublished rows (use `record-apply` /
  `record-reject` + PATCH)
- assistant/revert
- per-website-page website publication
- `POST …/pages/{id}/sections`, `PATCH …/sections/order`, `DELETE …/sections/{id}`,
  `POST …/slots/{key}/asset`
- Don't say session: `realtime-voice-session` (later)
- `POST …/assistant/cancel` (the run ends when it finishes or fails)
- `content-contract` as an HTTP resource (website component catalog files)
- `/certification-selections` (certifications live on [details](../other/details/api.md))
- `/v1/website/editor/assets`, `/v1/website/editor/files/…` (media library owns upload)
- `/v1/website/editor/business-profile` (Details owns `/v1/business-profile`)
