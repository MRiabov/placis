# Website HTTP

Conventions: [HTTP conventions](../../general-architecture/api.md).
Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).
Unpublished website, website editor tools, website publication, Connect
website address. Field authority for the website-editor PATCH body
remains [editing.md](editing.md); this file locks DTO names and routes.

The parent in nested CMS paths is `website_prefix`
([ADR](ADR.md) 27). Uuid `website_id` is internal. Unpaid canvas stays
[onboarding website editor](../onboarding/api.md) with no prefix in the
path (`onboarding_sessions.website_id`).

**Auth default:** Clerk JWT, active tenant. Mutating Routes send
`Idempotency-Key`. Unactivated **403** on this tree. Settings / styles /
publication stay active tenant. Preview website address: no
website-editor GET/PATCH.

Live business profile:
[business profile HTTP](../business-profile/details/api.md).
Projects: [projects](../business-profile/projects/api.md). Media library:
[media library](../other/media/api.md). Website form submit:
[leads](../other/leads/api.md).

Live HTML GET on `{website_prefix}.preview.placis.com` never calls Go.
Go **calls** two Worker operations (not on `cmd/api`, not public
OpenAPI, not a live GET): `websiteRender` (Website copy generation) and
`websitePublication` (Website publication). Same Astro engine. Not one
union with a flag.

Serve-only jsonb (not a DTO field dump): slot `value` is a union on
`slot_type` (`text`/`rich_text` → string; `image` → media library item
id + crop/focal; `link` → url + label; `list` → typed array).
`edit_history` `before`/`after` is that same union. Section `props` is
`oneOf` by `component_id` (unknown → `unsupported_component` and no props
object). Section `design` is named
design-control fields. Extra keys 4xx. `website_manifest` is **omit**
from website-editor GET/PATCH. LLM traces omit. Worker
`media_asset_urls` is media library item id → public delivery URL;
**omit** from website-editor GET/PATCH. Exact set of ids (missing,
spare, image file in the JSON, or expiring signed URL is 4xx).

CMS unpublished `website_*` / `website.menus` / `website_settings`
writes are only `POST` / `PATCH` on `/v1/websites/{website_prefix}/editor/…`
(active tenant). Unpaid canvas is
`POST` / `PATCH /v1/onboarding/website/editor/…`. Select and copy website
template and Website copy generation write them in River, not via these
routes.

Website editor PATCH 429 cap (30 / 10s) is **per website**.

## DTOs

### Websites

| DTO | Fields | Description |
| --- | --- | --- |
| `WebsiteRead` | `id`, `website_prefix`, `website_template_id`, `copy_generation_status` | List/poll row |
| `WebsiteCreate` | **TBD** | CMS create. [new-website-creation-flow.md](new-website-creation-flow.md) |

`copy_generation_status` → `running` / `done` / `failed`. Extra keys 4xx.
Create wait-end / retry **TBD**:
[new-website-creation-flow.md](new-website-creation-flow.md).

### Website editor

| DTO | Fields | Description |
| --- | --- | --- |
| `WebsiteEditorGet` | `publication_id`, `include_edit_history` | Query; not both |
| `WebsitePageSummaryRead` | `id`, `path`, `title`, `page_type`, `status`, `blockers: []WebsitePageBlockerRead` | Pages list row. Page-scoped `blockers[]` (not subscription) |
| `WebsitePageRead` | `path`, `title`, `page_type`, `status`, `seo_title`, `seo_description`, `seo_og_title`, `seo_og_description`, `seo_canonical_url`, `seo_noindex`, `validation`, `blockers: []WebsitePageBlockerRead`, `publication: WebsitePublicationRead`, `has_unpublished_changes`, `sections: []WebsiteSectionRead`, `website_styles: WebsiteSettingsRead`, `menus: WebsiteMenusRead`, `forms: []WebsiteFormRead`, `website_business_profile: WebsiteBusinessProfileRead` | Canvas hydrate. `has_unpublished_changes` is true when live HTML would change on republish |
| `WebsitePageCreate` | `path`, `title`, `page_type`, `seo_title`, `seo_description`, `seo_og_title`, `seo_og_description`, `seo_canonical_url`, `seo_noindex` | Create page |
| `WebsitePageUpdate` | `base_edit_history_head`, `ai_generation_id`, `ordered_section_ids`, `review_ids`, `sections: []WebsiteSectionRead`, `title`, `seo_title`, `seo_description`, `seo_og_title`, `seo_og_description`, `seo_canonical_url`, `seo_noindex`, `forms: []WebsiteFormRead` | Dirty PATCH body |
| `WebsiteSectionRead` | `id`, `component_id`, `component_version`, `position`, `status`, `props`, `design`, `slots: []WebsiteSlotRead` | Section on a page |
| `WebsiteSlotRead` | `key`, `type`, `value` | One slot |
| `WebsiteFormRead` | `id`, `form_key`, `title`, `submit_action`, `privacy_notice`, `fields` | Form on page GET |
| `WebsitePageBlockerRead` | `code`, `entity_type`, `entity_id` | Navigable unpublished blocker |
| `WebsiteEditApplyRead` | `edit_history_head`, `batch_id`, `blockers: []WebsitePageBlockerRead` | PATCH ack. Page PATCH includes `blockers[]`; menus / settings omit |
| `WebsiteEditorBlockersRead` | `blockers: []WebsitePageBlockerRead` | Open-Publish snapshot |
| `WebsiteSettingsRead` | `preset_id`, `primary`, `neutral`, `accent`, `radius`, `density` | Website styles |
| `WebsiteSettingsUpdate` | `base_edit_history_head`, `preset_id`, `primary`, `neutral`, `accent`, `radius`, `density` | Styles PATCH |
| `WebsiteMenusRead` | `top_menu`, `footer`, `show_phone`, `show_email`, `show_contact` | One menus row |
| `WebsiteMenusUpdate` | `base_edit_history_head`, `top_menu`, `footer`, `show_phone`, `show_email`, `show_contact` | Menus PATCH |
| `WebsiteUrlRead` | `id`, `href`, `label` | Combobox row |
| `WebsiteUrlCreate` | `href`, `label` | Type-to-create URL |
| `WebsiteBusinessProfileRead` | Common variable fields ([variables.md](variables.md)) | Resolve struct; CMS + Worker `$ref`. `address` is `registered_office` |

`website_business_profile` is required. Nested profile objects match
dotted Common variable paths. Extra keys 4xx. Not the Details
`GET /v1/business-profile` `*Read`. Do **not** create
`/v1/websites/{website_prefix}/editor/business-profile`.

### WebsitePageBlockerRead

`code` is one of `required_slot_unresolved`, `media_not_approved`,
`subscription_canceled`. `entity_type` / `entity_id` are the
navigate target.

- `required_slot_unresolved` — required website slot empty or unfilled
  `{{…}}`. `entity_type=website_section`, `entity_id` that website
  section. Navigate to that website section’s Content.
- `media_not_approved` — live-path media library item on **this**
  website not approved (join website slots → `media_assets`). Not
  off-canvas tenant-wide. `entity_type=media_asset`, `entity_id` that
  media library item. Content if on the canvas; else `/cms/media`.
- `subscription_canceled` — subscription not `active`.
  `entity_type=subscription`, `entity_id` the tenant. Always
  Usage & billing. Not extra usage credit.

List GET, page GET, and page PATCH ack each **calls**
`WebsitePublicationBlockers` for **that website page** (the first two codes; not
subscription). `GET /v1/websites/{website_prefix}/editor/blockers` **calls** it
for **this** `website_id` (every website page on this website, live-path
unapproved media library items on this website, and tenant subscription).
`PublishWebsite` **calls** it as the hard gate. Do not
duplicate the three `code` values per route. Editor GET
`publication_id` that is not a publication of this `{website_prefix}` is
**404**.

### Website publication

| DTO | Fields | Description |
| --- | --- | --- |
| `WebsitePublicationRead` | `version_number`, `status`, `active`, `published_by`, `website_address_id`, `published_at` | Metadata only; omit `website_manifest` |
| `WebsitePublicationCreate` | `website_address_id` | CMS Publish |
| `WebsiteAddressRead` | `hostname`, `type`, `status`, `dcv_txt_name`, `dcv_txt_value`, `cloudflare_hostname_status`, `cloudflare_ssl_status` | Host poll |
| `WebsiteAddressCreate` | `hostname` | Connect `type=custom` |

### Worker

| DTO | Fields | Description |
| --- | --- | --- |
| `WebsiteRenderRequest` | `profile: WebsiteBusinessProfileRead`, `media_asset_urls`, `website_styles: WebsiteSettingsRead`, `menus: WebsiteMenusRead`, `top_menu_section`, `footer_section`, `pages: []WebsiteRenderRequestPage`, `before_pages: []WebsiteRenderRequestPage` | `websiteRender` body |
| `WebsiteRenderRequestPage` | `id`, `path`, `sections: []WebsiteSectionRead` | Unpublished page on `pages` / `before_pages` |
| `WebsiteRenderPage` | `image`, `before_image`, `after_image` | One page picture |
| `WebsiteRenderResponse` | `pages: map[string]WebsiteRenderPage` | Worker image render; keyed by website page id |
| `WebsitePublicationRequest` | `dump`, `profile: WebsiteBusinessProfileRead`, `media_asset_urls`, `strip`, `website_prefix`, `hostname`, `version_number` | `websitePublication` body |
| `WebsitePublicationResponse` | | No image, no HTML body |

## Routes

### Websites

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/websites` | CMS | | `WebsiteRead[]` | `websites` | | This tenant | | Fat unpublished dump |
| `POST /v1/websites` | deferred create | `WebsiteCreate` | `WebsiteRead` | `websites`, `billing.subscriptions` | `websites`, `website_settings`, `website_addresses` (`type=subdomain`); **inserts** copy-pages + `website_copy_generation` (`bill_usage=billed`) | **Not this pass.** Keep the route. Body / questionnaire / template / retry **TBD** ([new-website-creation-flow.md](new-website-creation-flow.md)). Prefix + subdomain in the same transaction. After create, the deferred website list (no wait screen) | `402 website_limit_reached`; `402 usage_credit_exhausted` (no row) | Duplicate; empty unpublished website |
| `GET /v1/websites/{website_prefix}` | CMS; deferred create poll | | `WebsiteRead` | `websites` | | Copy-generation status | `404` | Onboarding SSE wait teaser |

### Website editor

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/websites/{website_prefix}/editor/pages` | CMS workspace | `WebsiteEditorGet` | `WebsitePageSummaryRead` | `website_pages`, `website_sections`, `website_slots`, `media_assets` | | Optional `publication_id` (checkout page list). Per-row page-scoped `blockers[]`. `publication_id` not of this `{website_prefix}` → **404** | `409` onboarding row; `403` unactivated; `404` | Preview host GET |
| `POST /v1/websites/{website_prefix}/editor/pages` | add page | `WebsitePageCreate` | `WebsitePageRead` | | `website_pages`, `website.menus` | Append menu node | `403` unactivated | Unpaid `create_page` (`POST /v1/onboarding/website/editor/pages`) |
| `GET /v1/websites/{website_prefix}/editor/pages/{page_id}` | canvas hydrate | `WebsiteEditorGet` | `WebsitePageRead` | `website_pages`, `website_sections`, `website_slots`, `website.menus`, `website_settings`, `website_forms`, `website_slot_reviews`, `website_publications`, `media_assets`, `business_profile.business_profiles`, `business_profile.business_profile_edits` | | Optional `publication_id` (checkout) or `include_edit_history`. Page-scoped `blockers[]`. `has_unpublished_changes` true when live HTML would change on republish (unpublished tree vs last dump, or Details / Projects / certifications writes with `created_at` after that row’s `published_at`). `publication_id` not of this `{website_prefix}` → **404** | `404`/`409`/`400`; `403` unactivated | `/pages/{id}/seo`; `/settings` GET; `/menus` GET; return `website_manifest`; both query flags; enqueue 04 from Details PATCH |
| `PATCH /v1/websites/{website_prefix}/editor/pages/{page_id}` | website editor | `WebsitePageUpdate` | `WebsiteEditApplyRead` | `website_pages`, `website_settings`, `edit_history`, `website_sections`, `website_slots`, `media_assets` | `website_slots`, `website_sections`, `website_pages`, `website_forms`, `website_form_fields`, `website_form_field_options`, `website.menus`, `edit_history`, `website_settings.edit_history_head` | Dirty keys only; 500ms coalesce; 429 per website. Checkout may send the substituted projection. Ack `blockers[]` for that whole website page | `409 edit_history_conflict`, `413`, `429`; `403` unactivated | See overflow |
| `PATCH /v1/websites/{website_prefix}/editor/settings` | Website styles apply | `WebsiteSettingsUpdate` | `WebsiteEditApplyRead` | | `website_settings`, `edit_history` | Explicit apply. Hydrate is the website page GET `website_styles`. Omit `blockers` | `409 edit_history_conflict` | `GET /settings` |
| `PATCH /v1/websites/{website_prefix}/editor/menus` | menu editors | `WebsiteMenusUpdate` | `WebsiteEditApplyRead` | | `website.menus`, `edit_history` | One row. Omit `blockers` | `409 edit_history_conflict`; `403` unactivated | `GET /menus`; menus on page PATCH |
| `GET /v1/websites/{website_prefix}/editor/urls` | URL combobox | | `WebsiteUrlRead` | `website_urls` | | | | `POST /pages` from picker |
| `POST /v1/websites/{website_prefix}/editor/urls` | type to create | `WebsiteUrlCreate` | `WebsiteUrlRead` | | `website_urls` | | | Create a website page |
| `GET /v1/websites/{website_prefix}/editor/blockers` | Publish dropdown open | | `WebsiteEditorBlockersRead` | `website_pages`, `website_sections`, `website_slots`, `media_assets`, `tenants` | | **calls** `WebsitePublicationBlockers` (this `website_id`). Flat `blockers[]` for this website’s pages plus subscription and live-path unapproved media library items on this website. Clerk, activated | `403` unactivated | Canvas hydrate; `website_manifest`; `publication_id`; unactivated; onboarding `/blockers` |

### PATCH /v1/websites/{website_prefix}/editor/pages/{page_id}

Dirty keys only. Archive of a website page strips that page node from
`website.menus`. Body cap 64 KB except checkout of an owner publication
(GET `publication_id`, then PATCH of the substituted projection; that
copy-out may be a full dirty set). Image website slots send a media
library item id. No GET-after-PATCH. `review_ids` over the website
component max is `400`. Success `WebsiteEditApplyRead` includes
`blockers[]` for **that whole website page** (**calls**
`WebsitePublicationBlockers` for that website page, same as list GET).
Menus / settings PATCH omit `blockers`.
Must not: predecessor `POST …/sections`,
`PATCH …/sections/order`, `DELETE …/sections/{id}`,
`POST …/slots/{key}/asset`. Top menu / footer are `/menus`. Unactivated
**403** (use `/v1/onboarding/website/editor/…`).

### GET /v1/websites/{website_prefix}/editor/blockers

Call when the Publish dropdown **opens**, not on a timer. Flat
`blockers[]` the dropdown concatenates: this website’s required
website slots and live-path media library items on **this** website,
plus subscription. Same three `code` values. Must not: canvas hydrate,
`website_manifest`, `publication_id`. After `/cms/media` approve, pay,
or menus, this GET is the snapshot. **calls**
`WebsitePublicationBlockers` for this `website_id`. `PublishWebsite`
**calls** the same function as the hard gate.

### Website publication

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/websites/{website_prefix}/publications` | publication dropdown | | `WebsitePublicationRead` | `website_publications` | | Omit onboarding rows in rollback UI | | Return `website_manifest` |
| `POST /v1/websites/{website_prefix}/publications` | CMS Publish | `WebsitePublicationCreate` | `WebsitePublicationRead` | `website_pages`, `website_sections`, `website_slots`, `website.menus`, `website_settings`, `website_forms` | `website_publications` | **calls** `WebsitePublicationBlockers` (this `website_id`); **calls** `websitePublication`; **sends** `WebsitePublicationRequest` (`hostname` from that `website_address_id`); `published_by=owner`. Host must belong to this website: this `{website_prefix}.preview.placis.com` or this website’s `type=custom`. Never another website’s internal Placis prefix | `402 subscription_canceled`; `404` other-website or missing `website_address_id` | Publish onto another website’s `{prefix}.preview.placis.com` |
| `POST /v1/websites/{website_prefix}/publications/{id}/rollback` | live rollback | | `WebsitePublicationRead` | `website_publications` | `website_publications` | Copy that owner version onto that host `latest/`. Host and publication must belong to this `{website_prefix}` | `402`, `409` onboarding id; `404` other-website | Rewrite unpublished rows |
| `GET /v1/websites/{website_prefix}/addresses` | dropdown + Connect | | `WebsiteAddressRead` | `website_addresses` | | Does not create subdomain | | |
| `POST /v1/websites/{website_prefix}/addresses` | Connect modal | `WebsiteAddressCreate` | `WebsiteAddressRead` | | `website_addresses` | `type=custom` only | | `type=subdomain`; reserve `website_prefix` |
| `GET /v1/websites/{website_prefix}/addresses/{id}` | poll until `active` | | `WebsiteAddressRead` | `website_addresses` | | DNS rows copyable. Other-website id → **404** | `404` | Nameserver mutation |

### Worker

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /internal/website-render` | Website copy generation | `WebsiteRenderRequest` | `WebsiteRenderResponse` | | | Worker op `websiteRender` | Extra keys 4xx | Write R2; persist HTML onto slots; image files in JSON; `websitePublication` |
| `POST /internal/website-publication` | Website publication | `WebsitePublicationRequest` | `WebsitePublicationResponse` | | R2 that host `latest/` | Worker op `websitePublication`; write `sites/hosts/{hostname}/` (CMS / after preview-host cutover) or `sites/{website_prefix}/` (unpaid until cutover) | Extra keys 4xx | Return image render; persist HTML onto slots; image files in JSON; `websiteRender`; write every active hostname |

Worker auth is out of the JSON body (shared secret / service binding).
Not on `cmd/api`. Not `GET /openapi.json`. Maps are keyed by website
page id → typed page schema (`additionalProperties` is that schema,
never `true`). `website_prefix` on `WebsitePublicationRequest` is
`websites.website_prefix`.

## Do not create

- `/v1/website/…` (flat tree; nest under `{website_prefix}`)
- `/v1/tenants/{website_prefix}/website/…`
- `/v1/public/site/…` (including resolve, meta, sitemap, assets)
- leftover `/preview/{token}/` HTML or `GET …/public/site/resolve`
- unactivated `/v1/websites/{website_prefix}/editor/…` (use
  `/v1/onboarding/website/editor/…`)
- `{website_id}` uuid in CMS paths
- `POST /v1/websites/{website_prefix}/addresses` with `type=subdomain`
- blueprints, posts, careers
- `/undo` `/redo` `/edit-history`
- `POST /v1/websites/{website_prefix}/publications/{id}/restore-unpublished`
- `GET /v1/websites/{website_prefix}/publications/{id}/pages`
- `/v1/websites/{website_prefix}/editor/top-menu`, `…/footer`
- `GET /v1/websites/{website_prefix}/editor/settings`,
  `GET /v1/websites/{website_prefix}/editor/menus` (hydrate is the website page
  GET `website_styles` / `menus`)
- `/v1/websites/{website_prefix}/editor/assistant` and `…/clear` — routes live
  in [assistant HTTP](../assistant/api.md)
- `/v1/websites/{website_prefix}/editor/assistant/record-apply` and
  `…/record-reject` — routes live in [assistant HTTP](../assistant/api.md)
- `/v1/websites/{website_prefix}/editor/pages/{page_id}/assistant` and
  `…/record-apply` / `…/record-reject`
- per-website-page website publication
- `POST …/pages/{id}/sections`, `PATCH …/sections/order`,
  `DELETE …/sections/{id}`, `POST …/slots/{key}/asset`
- `POST …/assistant/cancel`
- leftover realtime-voice HTTP path
- `content-contract` as an HTTP resource
- `/certification-selections`
- `/v1/websites/{website_prefix}/editor/assets`, `…/editor/files/…`
- `/v1/websites/{website_prefix}/editor/business-profile`
