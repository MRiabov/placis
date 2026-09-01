# Website HTTP

Conventions: [HTTP conventions](../../general-architecture/api.md).
Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).
Unpublished website, website editor tools, website publication, Connect
website address. Field authority for the website-editor PATCH body
remains [editing.md](editing.md); this file locks DTO names and routes.

**Auth default:** Clerk JWT, active tenant. Mutating Routes send
`Idempotency-Key`. **Unactivated (app origin only):** unpublished GET
(pages list, page by id, menus) allows onboarding session token or
Clerk. PATCH pages / menus allows Clerk + unactivated tenant only
(Assistant apply). Onboarding session token must not PATCH. Settings /
styles / publication stay active tenant. Preview website address: no
website-editor GET/PATCH.

Live business profile: [details](../business-profile/details/api.md).
Projects: [projects](../business-profile/projects/api.md). Media library:
[media library](../other/media/api.md). Website form submit:
[leads](../other/leads/api.md).

Live HTML GET on `{website_prefix}.preview.placis.com` never calls Go.
Go **calls** two Worker operations (not on `cmd/api`, not public
OpenAPI, not a live GET): `websiteRender` (03) and `websitePublication`
(04). Same Astro engine. Not one union with a flag.

Serve-only jsonb (not a DTO field dump): slot `value` is a union on
`slot_type` (`text`/`rich_text` → string; `image` → media library item
id + crop/focal; `link` → url + label; `list` → typed array; **do not
expose `slot_type=json`**). `edit_history` `before`/`after` is that same
union. Section `props` is `oneOf` by `component_id` (unknown →
`unsupported_component` and no props object). Section `design` is named
design-control fields. Extra keys 4xx. `website_manifest` is **omit**
from website-editor GET/PATCH. LLM traces omit. Worker
`media_asset_urls` is media library item id → public delivery URL;
**omit** from website-editor GET/PATCH. Exact set of ids (missing,
spare, image file in the JSON, or expiring signed URL is 4xx).

CMS unpublished `website_*` / `website.menus` / `website_settings`
writes are only `POST` / `PATCH` on `/v1/website/editor/…` from
`frontend-2`. Onboarding 05/06 write them in River, not via these
routes.

## DTOs

### Website editor

| DTO | Fields | Description |
| --- | --- | --- |
| `WebsiteEditorGet` | `publication_id`, `include_edit_history` | Query; not both |
| `WebsitePageSummaryRead` | `id`, `path`, `title`, `page_type`, `status` | Pages list row |
| `WebsitePageRead` | `path`, `title`, `page_type`, `status`, `seo_title`, `seo_description`, `seo_og_title`, `seo_og_description`, `seo_canonical_url`, `seo_noindex`, `seo_primary_keyword`, `validation`, `blockers: []WebsitePageBlockerRead`, `publication: WebsitePublicationRead`, `sections: []WebsiteSectionRead`, `website_styles: WebsiteSettingsRead`, `menus: WebsiteMenusRead`, `forms: []WebsiteFormRead`, `website_business_profile: WebsiteBusinessProfileRead` | Canvas hydrate |
| `WebsitePageCreate` | `path`, `title`, `page_type`, `seo_title`, `seo_description`, `seo_og_title`, `seo_og_description`, `seo_canonical_url`, `seo_noindex`, `seo_primary_keyword` | Create page |
| `WebsitePageUpdate` | `base_edit_history_head`, `ai_generation_id`, `ordered_section_ids`, `review_ids`, `sections: []WebsiteSectionRead`, `title`, `seo_title`, `seo_description`, `seo_og_title`, `seo_og_description`, `seo_canonical_url`, `seo_noindex`, `seo_primary_keyword`, `forms: []WebsiteFormRead` | Dirty PATCH body |
| `WebsiteSectionRead` | `id`, `component_id`, `component_version`, `position`, `status`, `props`, `design`, `slots: []WebsiteSlotRead` | Section on a page |
| `WebsiteSlotRead` | `key`, `type`, `value`, `status` | One slot |
| `WebsiteFormRead` | `id`, `form_key`, `title`, `submit_action`, `privacy_notice`, `fields` | Form on page GET |
| `WebsitePageBlockerRead` | `code`, `entity_type`, `entity_id` | Jumpable unpublished blocker |
| `WebsiteEditApplyRead` | `edit_history_head`, `batch_id` | PATCH ack |
| `WebsiteSettingsRead` | `preset_id`, `primary`, `neutral`, `accent`, `radius`, `density` | Website styles |
| `WebsiteSettingsUpdate` | `base_edit_history_head`, `preset_id`, `primary`, `neutral`, `accent`, `radius`, `density` | Styles PATCH |
| `WebsiteMenusRead` | `top_menu`, `footer`, `show_phone`, `show_email`, `show_contact` | One menus row |
| `WebsiteMenusUpdate` | `base_edit_history_head`, `top_menu`, `footer`, `show_phone`, `show_email`, `show_contact` | Menus PATCH |
| `WebsiteUrlRead` | `id`, `href`, `label` | Combobox row |
| `WebsiteUrlCreate` | `href`, `label` | Type-to-create URL |
| `WebsiteBusinessProfileRead` | Common variable fields ([variables.md](variables.md)) | Resolve struct; CMS + Worker `$ref` |

`website_business_profile` is required. Nested profile objects match
dotted Common variable paths. Extra keys 4xx. Not the Details
`GET /v1/business-profile` `*Read`. Do **not** create
`/v1/website/editor/business-profile`.

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
| `WebsitePublicationRequest` | `dump`, `profile: WebsiteBusinessProfileRead`, `media_asset_urls`, `strip`, `website_prefix`, `version_number` | `websitePublication` body |
| `WebsitePublicationResponse` | | No image, no HTML body |

## Routes

### Website editor

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/website/editor/pages` | CMS workspace; unpaid preview | `WebsiteEditorGet` | `WebsitePageSummaryRead` | `website_pages` | | Optional `publication_id` owner version | `409` onboarding row | Preview host GET |
| `POST /v1/website/editor/pages` | add page | `WebsitePageCreate` | `WebsitePageRead` | | `website_pages`, `website.menus` | Append menu node | | |
| `GET /v1/website/editor/pages/{page_id}` | canvas hydrate; unpaid preview | `WebsiteEditorGet` | `WebsitePageRead` | `website_pages`, `website_sections`, `website_slots`, `website.menus`, `website_settings`, `website_forms`, `website_slot_reviews`, `website_publications` | | Optional `publication_id` or `include_edit_history` | `404`/`409`/`400` | `/pages/{id}/seo`; `slot_type=json`; return `website_manifest`; both query flags |
| `PATCH /v1/website/editor/pages/{page_id}` | website editor | `WebsitePageUpdate` | `WebsiteEditApplyRead` | `website_pages`, `website_settings`, `edit_history` | `website_slots`, `website_sections`, `website_pages`, `website_forms`, `website_form_fields`, `website_form_field_options`, `website.menus`, `edit_history`, `website_settings.edit_history_head` | Dirty keys only; 500ms coalesce | `409 edit_history_conflict`, `413`, `429` | See overflow |
| `GET /v1/website/editor/settings` | Website styles | `WebsiteEditorGet` | `WebsiteSettingsRead` | `website_settings` | | Optional `publication_id` | `409`/`400` | Logo on this body |
| `PATCH /v1/website/editor/settings` | Website styles apply | `WebsiteSettingsUpdate` | `WebsiteEditApplyRead` | | `website_settings`, `edit_history` | Explicit apply | `409 edit_history_conflict` | |
| `GET /v1/website/editor/menus` | menu editors; unpaid preview | `WebsiteEditorGet` | `WebsiteMenusRead` | `website.menus` | | Optional `publication_id` | `409`/`400` | `/top-menu` or `/footer` |
| `PATCH /v1/website/editor/menus` | menu editors | `WebsiteMenusUpdate` | `WebsiteEditApplyRead` | | `website.menus`, `edit_history` | One row | `409 edit_history_conflict` | Menus on page PATCH |
| `GET /v1/website/editor/urls` | URL combobox | | `WebsiteUrlRead` | `website_urls` | | | | `POST /pages` from picker |
| `POST /v1/website/editor/urls` | type to create | `WebsiteUrlCreate` | `WebsiteUrlRead` | | `website_urls` | | | Create a website page |

### PATCH /v1/website/editor/pages/{page_id}

Dirty keys only. Archive of a website page strips that page node from
`website.menus`. Body cap 64 KB. Image website slots send a media
library item id. No GET-after-PATCH. `review_ids` over the website
component max is `400`. Must not: predecessor `POST …/sections`,
`PATCH …/sections/order`, `DELETE …/sections/{id}`,
`POST …/slots/{key}/asset`. Top menu / footer are `/menus`. Unactivated
PATCH: Clerk only; onboarding session token **403**.

### Website publication

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/website/publications` | publication dropdown | | `WebsitePublicationRead` | `website_publications` | | Omit onboarding rows in rollback UI | | Return `website_manifest` |
| `POST /v1/website/publications` | CMS Publish | `WebsitePublicationCreate` | `WebsitePublicationRead` | `website_pages`, `website_sections`, `website_slots`, `website.menus`, `website_settings`, `website_forms` | `website_publications`, `website_publication_issues` | **calls** `websitePublication`; **sends** `WebsitePublicationRequest`; `published_by=owner` | `402 subscription_canceled` | |
| `POST /v1/website/publications/{id}/rollback` | live rollback | | `WebsitePublicationRead` | `website_publications` | `website_publications` | Copy that owner version onto that host `latest/` | `402`, `409` onboarding id | Rewrite unpublished rows |
| `GET /v1/website/addresses` | dropdown + Connect | | `WebsiteAddressRead` | `website_addresses` | | Does not create subdomain | | |
| `POST /v1/website/addresses` | Connect modal | `WebsiteAddressCreate` | `WebsiteAddressRead` | | `website_addresses` | `type=custom` only | | `type=subdomain`; reserve `website_prefix` |
| `GET /v1/website/addresses/{id}` | poll until `active` | | `WebsiteAddressRead` | `website_addresses` | | DNS rows copyable | | Nameserver mutation |

### Worker

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /internal/website-render` | website 03 | `WebsiteRenderRequest` | `WebsiteRenderResponse` | | | Worker op `websiteRender` | Extra keys 4xx | Write R2; persist HTML onto slots; image files in JSON; `websitePublication` |
| `POST /internal/website-publication` | website 04 | `WebsitePublicationRequest` | `WebsitePublicationResponse` | | R2 `latest/` | Worker op `websitePublication` | Extra keys 4xx | Return image render; persist HTML onto slots; image files in JSON; `websiteRender` |

Worker auth is out of the JSON body (shared secret / service binding).
Not on `cmd/api`. Not `GET /openapi.json`. Maps are keyed by website
page id → typed page schema (`additionalProperties` is that schema,
never `true`).

## Do not create

- `/v1/tenants/{website_prefix}/website/…`
- `/v1/public/site/…` (including resolve, meta, sitemap, assets)
- leftover `/preview/{token}/` HTML or `GET …/public/site/resolve`
- `POST /v1/website/addresses` with `type=subdomain`
- blueprints, posts, careers
- `/undo` `/redo` `/edit-history`
- `POST /v1/website/publications/{id}/restore-unpublished`
- `GET /v1/website/publications/{id}/pages`
- `/v1/website/editor/top-menu`, `/v1/website/editor/footer`
- `/v1/website/editor/assistant` and `…/clear` — routes live in
  [assistant HTTP](../assistant/api.md)
- `/v1/website/editor/assistant/record-apply` and `…/record-reject` —
  routes live in [assistant HTTP](../assistant/api.md)
- `/v1/website/editor/pages/{page_id}/assistant` and `…/record-apply` /
  `…/record-reject`
- per-website-page website publication
- `POST …/pages/{id}/sections`, `PATCH …/sections/order`,
  `DELETE …/sections/{id}`, `POST …/slots/{key}/asset`
- `POST …/assistant/cancel`
- leftover realtime-voice HTTP path
- `content-contract` as an HTTP resource
- `/certification-selections`
- `/v1/website/editor/assets`, `/v1/website/editor/files/…`
- `/v1/website/editor/business-profile`
