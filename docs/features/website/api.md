# Website HTTP

Conventions: [HTTP conventions](../../general-architecture/api.md). Unpublished website, website editor tools,
website publication, Connect website address. Field authority for the
website-editor PATCH body remains [editing.md](editing.md); this file locks the routes.

Live business profile: [details](../business-profile/details/api.md). Projects: [projects](../business-profile/projects/api.md). Media library:
[media library](../other/media/api.md). Website form submit: [leads](../other/leads/api.md).

Live HTML GET on `{website_prefix}.preview.placis.com` never calls Go.
**Do not create** `/v1/public/site/…` (including leftover resolve). Go calls
two Worker operations (not on `cmd/api`, not public OpenAPI, not a live
GET, not leftover `/preview/{token}/`):

- **`websiteRender`** — 03; website image render; does not write R2
- **`websitePublication`** — 04; website HTML render; writes HTML to R2;
  does not return a website image render

Same Astro engine. Not one union with a flag. Website form POST is
[leads](../other/leads/api.md).

## Serve only types on HTTP

| Location | Persistence | HTTP |
| --- | --- | --- |
| Website slot `value` | jsonb | Discriminated union on `slot_type`: `text`/`rich_text` → string + `maxLength`; `image` → media library item id + crop/focal; `link` → url + label; `list` → typed array. **Do not expose `slot_type=json`.** |
| Website section `props` | jsonb | `oneOf` by `component_id`. Extra keys 4xx. Unknown `component_id` → `unsupported_component` + no props object. |
| Website section `design` | jsonb | Named design-control fields. Extra keys 4xx. |
| Website edit history `before`/`after` | jsonb | Same union as the live field. |
| Website manifest | jsonb `website.v1` | **Omit** from website-editor GET/PATCH. Publication `*Read` is metadata only. |
| Website styles | columns + bounded jsonb | Named fields: `preset_id`, `primary`, `neutral`, `accent`, `radius`, `density`. Extra keys 4xx. |
| Website assistant plan | text | `string` + `maxLength`. Markdown. |
| LLM traces | jsonb | **Omit.** Activity cards are named event structs. |
| Top menu / footer | `website.menus` jsonb trees | Named node fields (extra keys 4xx). |
| Website business profile | live business profile + projects + ranked reviews + media library URLs | `WebsiteBusinessProfileRead` — Common variables struct ([variables.md](variables.md)). Extra keys 4xx. Not the Details editor `GET /v1/business-profile` `*Read`. |
| Worker `media_asset_urls` | `files` public delivery URL | Map keyed by media library item id → URL (`minLength` 1, `maxLength` 2048). **Omit** from website-editor GET/PATCH. |

## `WebsiteBusinessProfileRead`

One Go struct. `$ref` in CMS OpenAPI **and** the Worker internal OpenAPI
file. Not a third endpoint. Not named `WebsiteRenderProfile`.
**Render** stays on `websiteRender`.

The website-placeholder resolve struct: every Common variable in
[variables.md](variables.md). Named fields, not `map[string]any`. Nested
objects match the dotted paths (`services.featured`, `projects.recent`,
`reviews` as the ranked pool for `{{reviews.1}}` …). Extra keys 4xx.

Callers:

- CMS canvas and wait teaser (paint in `frontend-2`)
- `websiteRender` `profile`
- `websitePublication` `profile`

This is **not** the Details editor `GET /v1/business-profile` `*Read`
(Facebook card, `top_reviews_provisional`, profile
history). Details owns writes. Do **not** create
`/v1/website/editor/business-profile`. Do not dump the ads **top reviews**
list. No field named `look`.

`{{logo_url}}` is the URL emitted from `logo_media_asset_id` (media library
file). Not a hotlink and not a `website_settings` URL.

Wait teaser does not get a new GET. Unpublished page GET already allows
an onboarding session token; that hydrate **embeds** this type. Do not
put it on onboarding `GET …/profile` (that GET is not Details).

## Complete — unpublished website

CMS unpublished `website_*` / `website.menus` / `website_settings` writes are
only `POST` / `PATCH` on `/v1/website/editor/…` from `frontend-2`. No other
`/v1` route upserts those rows. Onboarding 05/06 write them in River, not via
these routes.

**Unactivated (app origin only):** unpublished **GET** (pages list, page by id,
menus) allows onboarding session token or Clerk. **PATCH** (pages, menus)
allows Clerk + unactivated tenant only (Assistant apply). Onboarding session
token must not PATCH. Settings / styles / publication stay **active tenant**.
Preview website address: no website-editor GET/PATCH.

### GET /v1/website/editor/pages

- **Auth:** Clerk JWT, active tenant **or** (app origin) onboarding session
  token / Clerk JWT unactivated tenant
- **Callers:** CMS website editor workspace; unpaid website preview
  (`/onboarding/preview-and-edit/`).
- **Query:** optional `publication_id` (`website_publications` id from the
  dropdown). Omitted: unpublished list (`status=unpublished`). Set: that owner
  website version’s page summaries. `409` if `published_by=onboarding` or the id
  is not an owner row. Unactivated callers omit `publication_id`.
- **Response:** list of website page `*Read` summaries (id, path, title,
  `page_type`, status).
- **Must not:** allow this GET on `{website_prefix}.preview.placis.com`.

### POST /v1/website/editor/pages

- **Auth:** Clerk JWT, active tenant
- **Callers:** add a website page.
- **Idempotency-Key:** yes.
- **Request:** `path`, `title`, `page_type`, SEO columns.

### GET /v1/website/editor/pages/{page_id}

- **Auth:** Clerk JWT, active tenant **or** (app origin) onboarding session
  token / Clerk JWT unactivated tenant
- **Callers:** canvas hydrate (once per website page select / reload). Reset to
  an owner website version: same GET, then PATCH dirty keys ([editing.md](editing.md)).
- **Query:** optional `publication_id` (`website_publications` id). Omitted:
  unpublished `*Read`. Set: that owner website version’s `*Read`. `409` if
  `published_by=onboarding` or the id is not an owner row. `404` if `page_id` is
  not in that website version. Do not send `include_edit_history` with
  `publication_id` (`400`). `include_edit_history=true` only on unpublished open
  hydrate or after `409 edit_history_conflict`. Switching website page: both
  queries off.
- **Response:** website page `*Read`: `path`, `title`, `page_type`, `status`,
  SEO columns (`seo_title`, `seo_description`, `seo_og_title`,
  `seo_og_description`, `seo_canonical_url`, `seo_noindex`,
  `seo_primary_keyword`), `validation`, unpublished `blockers[]` (`code`,
  `message`, jump target — website section in Content, or `/cms/media`).
  **Compute realtime; do not persist** (not `website_publication_issues`).
  `publication.has_unpublished_changes` (unpublished vs live, even when
  `publication_id` is set), sections with catalog-discriminated `props` /
  `design` / `value`. Embeds tenant-scoped website styles, top menu, footer,
  website forms, and **`website_business_profile`**
  (`WebsiteBusinessProfileRead`, required) so the canvas can paint website
  placeholders. Details owns those writes. Reviews website
  sections include that section’s ordered pool ids (`website_slot_reviews`), not
  the ads **top reviews** list. Pool cards for Content “add from the pool” come
  from Details `GET /v1/business-profile/reviews`.
- **Must not:** `/pages/{id}/seo` as a separate route; `slot_type=json`; return
  `website_manifest`.

### PATCH /v1/website/editor/pages/{page_id}

- **Auth:** Clerk JWT, active tenant **or** (app origin) Clerk JWT unactivated
  tenant. Onboarding session token **403**. Preview website address **403**.
- **Callers:** website editor. At most one PATCH in flight; 500ms coalesce of
  save-on-click-off and discrete actions ([editing.md](editing.md)).
- **Idempotency-Key:** yes.
- **Request:** `base_edit_history_head` plus **dirty keys only** — per-section /
  per-slot, dirty page metadata (title, path, SEO, `status`
  `unpublished`/`archived`), website form patches, section
  create/swap/visibility/design, `ordered_section_ids[]`, and a reviews website
  section’s ordered `review_ids[]` (from the pool, length ≤ that website
  component’s max; over max is `400`). Archive of a website page strips that
  page node from `website.menus` ([persistence.md](persistence.md)). Body cap 64 KB. Image
  website slots send a media library item id, not the file. Example:

```json
{ "base_edit_history_head": "<uuid>", "sections": [
  { "id": "<section id>", "slots": [
    { "key": "headline", "type": "text", "value": "Roof repairs across Dublin", "status": "unpublished" }
  ] }
] }
```

- **Response:** `{ edit_history_head, batch_id }` plus assigned ids on create.
  No GET-after-PATCH. Do not round-trip the `*Read`.
- **Errors:** `409 edit_history_conflict`, `413`, `429` with `Retry-After`.
- **Must not:** predecessor `POST …/sections`, `PATCH …/sections/order`,
  `DELETE …/sections/{id}`, `POST …/slots/{key}/asset` — those edits are fields
  on this body. Top menu / footer are `/menus`, not this body.

### GET /v1/website/editor/settings / PATCH /v1/website/editor/settings

- **Auth:** Clerk JWT, active tenant
- **Callers:** website styles workspace. **Explicit apply**, not save on
  click-off.
- **GET query:** optional `publication_id` (same as page GET). Same `409` /
  `400` as page GET.
- **PATCH Idempotency-Key:** yes.
- **PATCH request:** `base_edit_history_head` plus dirty named website styles
  (`preset_id`, `primary`, `neutral`, `accent`, `radius`, `density`). Extra keys
  4xx. Logo is not on this body — `logo_media_asset_id` on Details. Publication
  may emit a URL only from that media library file.
- **PATCH response:** `{ edit_history_head, batch_id }`. Same
  `409 edit_history_conflict` as the website page PATCH.

### GET /v1/website/editor/menus / PATCH /v1/website/editor/menus

- **Auth:** Clerk JWT, active tenant
- **Callers:** top menu and footer tree editors. One resource — one
  `website.menus` row (`top_menu`, `footer`, `show_phone`, `show_email`,
  `show_contact`).
- **GET query:** optional `publication_id` (same as page GET). Same `409` /
  `400` as page GET.
- **PATCH Idempotency-Key:** yes.
- **Request:** `base_edit_history_head` plus dirty keys only (`top_menu` and/or
  `footer` and/or `show_phone` / `show_email` / `show_contact`). Extra keys 4xx.
- **Response:** `{ edit_history_head, batch_id }`. Same
  `409 edit_history_conflict` as the website page PATCH.
- **Must not:** `/top-menu` or `/footer` as peer routes; menus fields on the
  website page PATCH.

### GET /v1/website/editor/urls / POST /v1/website/editor/urls

- **Auth:** Clerk JWT, active tenant
- **Callers:** top menu / footer URL combobox (Existing URLs / type to create).
- **POST Idempotency-Key:** yes.
- **Request:** `href` (URL, `maxLength` 2048), optional `label` (`maxLength`
  80).
- **Must not:** create a website page; `POST /pages` from this picker.

## Complete — website editor tools (via the assistant)

Website editor tools never do website publication. CMS unpublished writes stay
on website page PATCH and `/menus`. Assistant HTTP: [assistant HTTP](../assistant/api.md). Apply path
and 06: [assistant architecture](../assistant/architecture.md), [assistant.md](assistant.md).

### GET /v1/website/editor/assistant

**Do not create.** Use [GET /v1/assistant/thread](../assistant/api.md).

### POST /v1/website/editor/assistant

**Do not create.** Use [GET /v1/assistant/thread/ws](../assistant/api.md). Page-scoped and
`/v1/website/editor/assistant` HTTP is retired. `update_details` still writes
the live business profile immediately (shared Details tool), then the shared
notification.

### POST /v1/website/editor/assistant/clear

**Do not create.** Use [POST /v1/assistant/thread/new](../assistant/api.md).

### POST /v1/website/editor/assistant/record-apply

**Do not create.** Use [POST /v1/assistant/record-apply](../assistant/api.md).

### POST /v1/website/editor/assistant/record-reject

**Do not create.** Use [POST /v1/assistant/record-reject](../assistant/api.md).

## Complete — website publication and Connect website address

Onboarding 08/09 also write `website_publications` (`published_by=onboarding`).
Those rows are not this CMS POST. They are never website-rollback targets.

### GET /v1/website/publications / POST /v1/website/publications

- **Auth:** Clerk JWT, active tenant
- **Callers:** website publication dropdown (whole website, not per website
  page).
- **POST Idempotency-Key:** yes.
- **POST request:** `website_address_id` (the host row they clicked). Writes
  that host’s R2 tree and purges **that** host. Hosts can diverge.
- **POST:** `published_by=owner`. **402** `subscription_canceled` when
  `tenants.subscription_status` is not `active`. Not
  `usage_credit_exhausted`. Website slot and media library blockers stay 4xx
  from validation; this is the pay gate. Website editor PATCH is not this
  code.
- **GET list:** metadata `*Read` (`version_number`, `status`, `active`,
  `published_by`, `website_address_id`, times). **Omit** `website_manifest`.
  Rollback UI uses `published_by=owner` only — omit onboarding 08/09 and
  05-retry rows.

### POST /v1/website/publications/{id}/rollback

- **Auth:** Clerk JWT, active tenant
- **Idempotency-Key:** yes.
- **Callers:** website publication dropdown — **live** website rollback.
- **Behavior:** copy that owner website version onto **that host’s** `latest/`,
  purge that host. **402** `subscription_canceled` when the subscription is not
  `active` (same pay gate as POST publications). `409` if
  `published_by=onboarding` or the id is not an owner row. Does not rewrite
  unpublished website rows.
- **Response:** that publication `*Read` (`active=true`, `version_number`,
  times). The dropdown updates from this body — no extra GET required.

### GET /v1/website/addresses / POST /v1/website/addresses

- **Auth:** Clerk JWT, active tenant
- **Callers:** publication dropdown (list hosts) and Connect website address
  modal.
- **GET:** `type=subdomain` (preview website address; reserved at onboarding 07
  — this GET does not create it) and `type=custom` (website addresses they
  connected).
- **POST:** Connect website address only (`type=custom`, hostname they supply,
  e.g. `acme.ie`). Does not reserve `tenants.website_prefix` or insert
  `type=subdomain`. Website publication does not attach a website address.
- **POST Idempotency-Key:** yes.

### GET /v1/website/addresses/{id}

- **Auth:** Clerk JWT, active tenant
- **Callers:** poll a connected website address until `active`.
- **Response:** hostname, type, status, DNS rows (type, Host, Value; copyable).
  No GoDaddy/nameserver mutation.

CMS voice realtime connection: [POST /v1/assistant/voice/realtime-connection](../assistant/api.md).
Onboarding guide: [POST /v1/onboarding/assistant/voice/realtime-connection](../onboarding/api.md).

## Complete — Worker internal (not `cmd/api`)

Go is the caller. The Worker implements these routes. Same Astro engine;
**not** one union with a flag. Authenticated internal (shared secret /
service binding). Auth is **out of** the JSON body. Binding **name** is
not this file. Not on `cmd/api`. Not `GET /openapi.json`. **Do not
create** `/v1/public/site/…`. Do not put these on live GET.

Go structs are the source. Worker typegens **both** operations from a
**separate** OpenAPI file. `apps/contractor-website` `openapi-typescript`
on that file only. CI: export + typegen no diff; OpenAPI constraints
on these DTOs (same as CMS: no `map[string]any`, no
`additionalProperties: true`).

**Known omission:** the Worker is the HTTP server; that side usually owns
OpenAPI. Product owner chose Go as source (not an agent) so
`WebsiteBusinessProfileRead` stays one struct (CMS + Worker `$ref`) and
export stays the huma pipeline. That inversion may cause issues.

Maps are `map` keyed by **website page id** → typed page schema. OpenAPI
`additionalProperties` is that page schema, never `true`.

### `media_asset_urls`

Required on **both** Worker requests. Same field, same engine lookup.

Map keyed by **media library item id** → that item’s **public delivery
URL** (`string`, URL, `minLength` 1, `maxLength` 2048). OpenAPI
`additionalProperties` is that URL schema, never `true`. Extra request
keys 4xx.

**Exact set** (a missing referenced id and a spare id are both 4xx):

- every image website slot `media_asset_id` on `pages` and, after
  `update_slot`, `before_pages`
- every image website slot `media_asset_id` on `top_menu_section` /
  `footer_section`
- Details `logo_media_asset_id` when `{{logo_url}}` is in those dumps or
  in `profile`
- any other media library item id on `profile` that paints (project
  cover, certification badge) if that field is an id, not already a URL

Turn 1 with only `{{images.*}}` / `{{logo_url}}` and no attached ids →
`{}` is valid. After attach, that id **must** be in the map.

URL is the public delivery URL for that item’s `files` row
([files](../../general-architecture/files-and-s3.md)) — not an expiring
signed URL, not Railway, not a Maps/Facebook hotlink. Worker **GET**s it
(same-account R2). Go does not put the file in the JSON.

Crop / focal stay on the image website slot. `{{images.*}}` /
`{{logo_url}}` stay tokens in slots; those URLs stay on
`WebsiteBusinessProfileRead`. Website-editor GET does **not** embed this
map.

`generate_image` is a website-editor / media-library tool. It is **not**
either endpoint. **Must not:** a model-invoked screenshot tool. First view
and `update_slot` already return the pictures.

| Caller | Operation id | Path | Request | Response |
| --- | --- | --- | --- | --- |
| 03 | `websiteRender` | `POST /internal/website-render` | `WebsiteRenderRequest` | `WebsiteRenderResponse` |
| 04 | `websitePublication` | `POST /internal/website-publication` | `WebsitePublicationRequest` | `WebsitePublicationResponse` |

The Worker has **no Postgres**. Timeouts follow each operation’s SLO
table ([03](pipeline/03-website-copy-generation.md),
[04](pipeline/04-website-publication.md)).

### `POST /internal/website-render` (`websiteRender`)

- **Callers:** website 03 (turn 1 first view; after each `update_slot`).
- **Must not:** write R2, WebP, or purge; persist a website image render or
  HTML onto unpublished website slots; call `websitePublication`; put
  image files in the JSON.
- **Request (`WebsiteRenderRequest`):**
  - `profile` — `WebsiteBusinessProfileRead`
  - `media_asset_urls` — exact set ([above](#media_asset_urls))
  - `website_styles` — current **website style** (`preset_id` + bounded
    overrides)
  - `menus` — **top menu** and **footer** trees + bar flags
    (`website.menus`)
  - `top_menu_section` / `footer_section` — the two site-wide **website
    sections** (`page_id` null) that paint the top menu and the footer
    (website component, design, slots). They are on every website page’s
    picture.
  - `pages` — map of website page id → unpublished **website page** dump
    (path, `page_type`, SEO, ordered website sections: `component_id`,
    design, slot values as they are now). Tokens still in slots. 1..N
    entries = this batch.
  - After `update_slot` only: `before_pages` — same map shape, dumps
    **before** that edit, same website page ids. One round trip.
- No `page_paths`. No field named `look`. No `strip`. No R2. Turn 1
  example: up to 8 website pages in `pages` (“8” is an example).
- **Response (`WebsiteRenderResponse`):** `pages` as the **same map**
  (website page id → `WebsiteRenderPage`: a website image render). First
  view: `image`. After `update_slot`: `before_image` + `after_image`. Not
  HTML on the inference.

### `POST /internal/website-publication` (`websitePublication`)

- **Callers:** website 04 (onboarding 08/09 and CMS Publish).
- **Must not:** return a website image render; persist resolved HTML onto
  unpublished website slots; call `websiteRender`; put image files in the
  JSON.
- **Request (`WebsitePublicationRequest`):** `dump` (`website.v1` — that
  dump **is** the latest design, including **website styles**, **top
  menu**, **footer**, and website pages) + `profile`
  (`WebsiteBusinessProfileRead`) + `media_asset_urls` + `strip` +
  `website_prefix` + `version_number`. Keep `pages[]` as a **list** on
  `website.v1` ([manifest.md](manifest.md)); do not dict the publication
  dump.
- **Response (`WebsitePublicationResponse`):** closed result of that
  **write** (no website image render, no HTML body). Extra keys 4xx.

## Do not create

- `/v1/tenants/{website_prefix}/website/…`
- `/v1/public/site/…` (including resolve, meta, sitemap, assets)
- leftover `/preview/{token}/` HTML or `GET …/public/site/resolve`
- `POST /v1/website/addresses` with `type=subdomain` (reserved at 08 share or
  09)
- blueprints, posts, careers
- `/undo` `/redo` `/edit-history`
- `POST /v1/website/publications/{id}/restore-unpublished` (editor GET
  `publication_id`, then PATCH)
- `GET /v1/website/publications/{id}/pages` (use editor GET `publication_id`)
- `/v1/website/editor/top-menu`, `/v1/website/editor/footer` (use `/menus`)
- `/v1/website/editor/pages/{page_id}/assistant` and `…/record-apply` /
  `…/record-reject` (use [assistant HTTP](../assistant/api.md))
- `/v1/website/editor/assistant` and `…/clear` (use [assistant HTTP](../assistant/api.md))
- per-website-page website publication
- `POST …/pages/{id}/sections`, `PATCH …/sections/order`,
  `DELETE …/sections/{id}`, `POST …/slots/{key}/asset`
- `POST …/pages/{page_id}/assistant` (use `/v1/assistant/thread/ws`)
- `POST …/assistant/cancel` (the run ends when it finishes or fails)
- Don't say session: `realtime-voice-session` as a path name (use
  `/v1/assistant/voice/realtime-connection`)
- `content-contract` as an HTTP resource (website component catalog files)
- `/certification-selections` (certifications live on [details](../business-profile/details/api.md))
- `/v1/website/editor/assets`, `/v1/website/editor/files/…` (media library owns
  upload)
- `/v1/website/editor/business-profile` (Details owns `/v1/business-profile`)
