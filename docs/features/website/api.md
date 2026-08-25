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

### GET /v1/website/editor/pages

- **Auth:** Clerk JWT, active tenant
- **Callers:** website editor workspace (website page list).
- **Response:** list of unpublished website page `*Read` summaries (id, path, title, `page_type`,
  status).

### POST /v1/website/editor/pages

- **Auth:** Clerk JWT, active tenant
- **Callers:** add a website page.
- **Idempotency-Key:** yes.
- **Request:** `path`, `title`, `page_type`, SEO columns.

### GET /v1/website/editor/pages/{page_id}

- **Auth:** Clerk JWT, active tenant
- **Callers:** canvas hydrate (once per website page select / reload).
- **Query:** `include_edit_history=true` only on open hydrate or after `409 edit_history_conflict`.
  Switching website page: query off.
- **Response:** unpublished website page `*Read`: `path`, `title`, `page_type`, `status`, SEO
  columns (`seo_title`, `seo_description`, `seo_og_title`, `seo_og_description`,
  `seo_canonical_url`, `seo_noindex`, `seo_primary_keyword`), `validation`,
  website-publication-blocker count, `publication.has_unpublished_changes`, sections/slots
  with catalog-discriminated `props` / `design` / `value`. Embeds tenant-scoped website styles,
  top menu, footer, and website forms so the canvas can paint. May embed display name /
  marketing phone for website placeholders; Details owns those writes.
- **Must not:** `/pages/{id}/seo` as a separate route; `slot_type=json`; return
  `website_manifest`.

### PATCH /v1/website/editor/pages/{page_id}

- **Auth:** Clerk JWT, active tenant
- **Callers:** website editor. At most one PATCH in flight; 500ms coalesce of save-on-click-off
  and discrete actions ([editing.md](editing.md)).
- **Idempotency-Key:** yes.
- **Request:** `base_edit_history_head` plus **dirty keys only** — per-section / per-slot, dirty
  page metadata (title, path, SEO), website form patches, section create/swap/visibility/design,
  `ordered_section_ids[]`. Body cap 64 KB. Image website slots send a media library item id, not
  bytes. Example:

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
  `POST …/slots/{key}/asset` — those edits are fields on this body.

### GET /v1/website/editor/settings / PATCH /v1/website/editor/settings

- **Auth:** Clerk JWT, active tenant
- **Callers:** website styles workspace. **Explicit apply**, not save on click-off.
- **PATCH Idempotency-Key:** yes.
- **Request/response:** named website styles (`preset_id`, `primary`, `neutral`, `accent`,
  `radius`, `density`). Extra keys 4xx.

### GET /v1/website/editor/top-menu / PATCH /v1/website/editor/top-menu

- **Auth:** Clerk JWT, active tenant
- **Callers:** top menu tree editor.
- **PATCH Idempotency-Key:** yes.
- **Body:** named menu tree fields (extra keys 4xx).

### GET /v1/website/editor/footer / PATCH /v1/website/editor/footer

- **Auth:** Clerk JWT, active tenant
- **Callers:** footer tree editor.
- **PATCH Idempotency-Key:** yes.
- **Body:** named menu tree fields (extra keys 4xx).

## Complete — website assistant

One in-flight run per tenant (includes onboarding website copy generation). Tools never do
website publication.

### POST /v1/website/editor/pages/{page_id}/assistant

- **Auth:** Clerk JWT, active tenant
- **Callers:** website assistant chat; onboarding 06 headless.
- **Idempotency-Key:** yes.
- **Request:** plan vs continuous; Ask first vs instant apply. Plan text is `string` +
  `maxLength`.
- **Must not:** return `ai_generations` blobs.

### POST /v1/website/editor/pages/{page_id}/assistant/apply

- **Auth:** Clerk JWT, active tenant
- **Idempotency-Key:** yes.
- **Request:** `base_edit_history_head`. One-way. Second transition `409`. **No revert.**

### POST /v1/website/editor/pages/{page_id}/assistant/reject

- **Auth:** Clerk JWT, active tenant
- **Idempotency-Key:** yes.
- **Behavior:** one-way reject. Second transition `409`.

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
- **Behavior:** copy that owner website version onto `latest/`, purge. `409` if
  `published_by=onboarding` or the id is not an owner row.

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
- **Response:** hostname, type, status, DNS rows (copyable). No GoDaddy/nameserver mutation.

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
- assistant/revert
- per-website-page website publication
- `POST …/pages/{id}/sections`, `PATCH …/sections/order`, `DELETE …/sections/{id}`,
  `POST …/slots/{key}/asset`
- Don't say session: `realtime-voice-session` (later)
- `content-contract` as an HTTP resource (website component catalog files)
- `/certification-selections` (certifications live on [details](../other/details/api.md))
- `/v1/website/editor/assets`, `/v1/website/editor/files/…` (media library owns upload)
- `/v1/website/editor/business-profile` (Details owns `/v1/business-profile`)
