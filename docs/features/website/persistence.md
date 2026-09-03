# Website — persistence

Website pages, website sections, website slots, website forms, top menu,
footer, website publications (each row is a website version), website
settings, website edit history, and live hostnames (`website_addresses`).
Conventions:
[persistence conventions](../../general-architecture/persistence.md)
(Postgres schema `website`). Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).

Media assets are owned by
[media library](../other/media/persistence.md). The business profile the
website templates fill is
[details](../business-profile/details/persistence.md). Projects:
[projects](../business-profile/projects/persistence.md). Website forms
write [leads](../other/leads/persistence.md). The dump shape of a website
publication is [manifest.md](manifest.md). The reserved label on the
tenant row is [auth](../other/auth/persistence.md)
(`tenants.website_prefix`).

## Tables

### `website_addresses`

- **Columns:** `id`, `tenant_id` fk, `hostname`, `type`, `status`,
  `is_primary`, `cloudflare_custom_hostname_id` nullable,
  `dcv_txt_name`, `dcv_txt_value`, `cloudflare_hostname_status`,
  `cloudflare_ssl_status`, `dns_verified_at`, `activated_at`,
  `created_at`
- **Enums:** `type` → `subdomain` / `custom`; `status` → `reserved` /
  `pending` / `active` / `failed`
- **Uniques:** `hostname`; at most one `is_primary=true` per `tenant_id`
- **Written by:** `POST /v1/onboarding/website/publications` and
  onboarding 09 (`type=subdomain`);
  `POST /v1/website/addresses` (`type=custom`)
- **Notes:** Custom Hostnames columns are Connect website address, not
  website publication.

### Preview vs custom host

`type=subdomain` is the preview website address
(`{website_prefix}.preview.placis.com`; R2 prefix is
`tenants.website_prefix`). Reserved at onboarding 08. Show it as the
default host (website preview until website activation; live website
after). `type=custom` is the hostname they supply. `is_primary` marks
sitemap and canonical: the subdomain host until a `type=custom` row is
`active`, then that website address. See [cloudflare.md](cloudflare.md).

### `website_pages`

- **Columns:** `id`, `tenant_id` fk, `path`, `title`, `page_type`,
  `status`, `seo_title`, `seo_description`, `seo_og_title`,
  `seo_og_description`, `seo_canonical_url`, `seo_noindex`,
  timestamps
- **Enums:** `page_type` → `home` / `about` / `service` / `contact` /
  `legal`; `status` → `unpublished` / `archived`
- **Uniques:** `(tenant_id, path)`
- **Written by:** `CopyWebsiteTemplatePages`; `GenerateWebsiteCopy`
  (SEO columns); `POST /v1/website/editor/pages`;
  `PATCH /v1/website/editor/pages/{page_id}`;
  `PATCH /v1/onboarding/website/editor/pages/{page_id}`

### `website_sections`

- **Columns:** `id`, `tenant_id` fk, `page_id` nullable fk,
  `component_id`, `component_version`, `position`, `status`, `props`
  jsonb oneOf `component_id`, `design` jsonb, `origin`
- **Enums:** `status` → `visible` / `hidden`; `origin` →
  `website_template` / `website_copy_generation` / `owner` /
  `business_research`
- **Uniques:** `(page_id, position)` when `page_id` is set
- **Written by:** `CopyWebsiteTemplatePages`;
  `PATCH /v1/website/editor/pages/{page_id}`;
  `PATCH /v1/onboarding/website/editor/pages/{page_id}`
- **Notes:** `page_id` null is the site-wide top-menu or footer look
  section. Structure of the bars is `website.menus`.

### `website_slots`

- **Columns:** `id`, `tenant_id` fk, `section_id` fk, `slot_key`,
  `slot_type`, `value` jsonb oneOf `slot_type`, `origin`,
  `validation_errors`
- **Enums:** `slot_type` → `text` / `rich_text` / `image` / `link` /
  `list`; `origin` → `website_template` /
  `website_copy_generation` / `owner` / `business_research`
- **Uniques:** `(section_id, slot_key)`
- **Written by:** `CopyWebsiteTemplatePages`; `GenerateWebsiteCopy`;
  `PATCH /v1/website/editor/pages/{page_id}`;
  `PATCH /v1/onboarding/website/editor/pages/{page_id}`

### `website_forms`

- **Columns:** `id`, `tenant_id` fk, `form_key`, `title`, `status`,
  `submit_action`, `privacy_notice`
- **Enums:** `status` → `active` / `disabled`; `submit_action` →
  `create_website_lead`
- **Uniques:** `(tenant_id, form_key)`
- **Written by:** `CopyWebsiteTemplatePages`;
  `PATCH /v1/website/editor/pages/{page_id}`;
  `PATCH /v1/onboarding/website/editor/pages/{page_id}`

### `website_form_fields`

- **Columns:** `id`, `tenant_id` fk, `form_id` fk, `position`,
  `field_key`, `field_type`, `label`, `required`, `placeholder`
- **Enums:** `field_type` → `text` / `textarea` / `email` /
  `marketing_phone` / `address` / `select` / `date` / `checkbox`
- **Uniques:** `(form_id, field_key)`
- **Written by:** `CopyWebsiteTemplatePages`;
  `PATCH /v1/website/editor/pages/{page_id}`;
  `PATCH /v1/onboarding/website/editor/pages/{page_id}`

### `website_form_field_options`

- **Columns:** `id`, `field_id` fk, `position`, `label`, `value`
- **Written by:** `CopyWebsiteTemplatePages`;
  `PATCH /v1/website/editor/pages/{page_id}`;
  `PATCH /v1/onboarding/website/editor/pages/{page_id}`

### `website.menus`

- **Columns:** `tenant_id` fk, `top_menu` jsonb, `footer` jsonb,
  `show_phone`, `show_email`, `show_contact`, timestamps
- **Uniques:** `tenant_id`
- **Written by:** `CopyWebsiteTemplatePages`;
  `POST /v1/website/editor/pages`;
  `PATCH /v1/website/editor/pages/{page_id}`;
  `PATCH /v1/onboarding/website/editor/pages/{page_id}`;
  `PATCH /v1/website/editor/menus`;
  `PATCH /v1/onboarding/website/editor/menus`
- **Notes:** Hide = omit from the tree. Bar CTA values are always
  `{{marketing_phone}}` / `{{marketing_email}}`.

### Menu node trees

Each of `top_menu` and `footer` is a JSON array of nodes. Depth **2**.
Closed keys only. Every node has `id` derived from its label. Unique in
that tree; collision → `-2`, `-3`. Tools match by this `id`.

Menu node kinds: `page` (`page_id`); `text` (`label`, `children`); `url`
(`label`, `href`, `url_id` fk to `website_urls`). Caps: **8** top-level
on the top menu, **12** on the footer, **8** children per parent.

On create page: append a footer `page` node (if under cap); same on the
top menu unless `legal` or cap. On archive: strip that node. Human PATCH
may replace a whole tree. Assistant `remove_entries` max 4.

### `website_settings`

- **Columns:** `id`, `tenant_id` fk, `website_template_id`, `preset_id`,
  `primary`, `neutral`, `accent`, `radius`, `density`,
  `edit_history_head` uuid nullable, timestamps
- **Uniques:** `tenant_id`
- **Written by:** `SelectWebsiteTemplate`;
  `PATCH /v1/website/editor/settings`
- **Notes:** 02 SELECTs `website_template_id` here, not `ai_generations`.
  Logo is `business_profiles.logo_media_asset_id`, not a column here.

### `website_publications`

- **Columns:** `id`, `tenant_id` fk, `version_number`, `status`,
  `active`, `manifest_version`, `website_manifest` jsonb, `published_by`,
  `website_address_id` nullable fk, `rollback_of_publication_id`
  nullable, `published_at`
- **Enums:** `status` → `published` / `archived` / `rolled_back`;
  `published_by` → `onboarding` / `owner`
- **Uniques:** `(tenant_id, version_number)`
- **Written by:** `PublishWebsite`;
  `POST /v1/onboarding/website/publications`; onboarding 09;
  `POST /v1/website/publications`;
  `POST /v1/website/publications/{id}/rollback`; `UnpublishWebsite`
  (clears `active`)
- **Notes:** Rollback lists `published_by=owner` only on that host.
  Pre-publish blockers are computed on the editor GET (`blockers[]`).
  There is no `website_publication_issues` table.

### `website_slot_reviews`

- **Columns:** `id`, `tenant_id` fk, `slot_id` fk,
  `business_profile_review_id` fk, `position`
- **Uniques:** `(slot_id, business_profile_review_id)`
- **Written by:** `PATCH /v1/website/editor/pages/{page_id}`;
  `PATCH /v1/onboarding/website/editor/pages/{page_id}` (owner
  Content / `update_reviews`)
- **Notes:** 02 does not insert these rows. 03 must not
  `update_reviews`.

### `edit_history`

- **Columns:** `id`, `tenant_id` fk, `batch_id`, `edited_by`,
  `ai_generation_id` nullable fk, `entity_type`, `entity_id`, `field`
  nullable, `op`, `before` jsonb nullable, `after` jsonb nullable,
  `created_at`
- **Enums:** `edited_by` → `human` / `agent`; `entity_type` →
  `website_page` / `website_section` / `website_slot` / `website_form` /
  `website_form_field` / `website_settings` / `website_menus`; `op` →
  `set` / `clear` / `add` / `remove` / `update`
- **Written by:** `PATCH /v1/website/editor/pages/{page_id}`;
  `PATCH /v1/onboarding/website/editor/pages/{page_id}`;
  `PATCH /v1/website/editor/settings`;
  `PATCH /v1/website/editor/menus`;
  `PATCH /v1/onboarding/website/editor/menus`;
  `GenerateWebsiteCopy` (agent batches)
- **Notes:** Keep the last **200** batches per tenant. Last writer lives
  only here. Do not keep leftover `website_assistant_threads`.

### `website_urls`

- **Columns:** `id`, `tenant_id` fk, `href`, `label`, timestamps
- **Uniques:** `(tenant_id, href)`
- **Written by:** `POST /v1/website/editor/urls`;
  `CopyWebsiteTemplatePages` when the template has `url` nodes
- **Notes:** Typing a new URL in the combobox inserts a row. Does not
  create a website page.

## Indexes

Unique: `website_addresses.hostname`, at most one `is_primary=true` per
`tenant_id`; `(tenant_id, website_pages.path)`,
`(tenant_id, website_forms.form_key)`,
`(tenant_id, website_publications.version_number)`,
`website_settings.tenant_id`, `website.menus.tenant_id`,
`(tenant_id, website_urls.href)`. Lookup:
`(tenant_id, status, created_at)` on website pages;
`(tenant_id, created_at desc)` and `(tenant_id, batch_id)` on
`edit_history`.
