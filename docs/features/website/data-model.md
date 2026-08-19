# Website — data model

Website pages, website sections, website slots, website forms, top menu, footer, website
publications (each row is a website version), projects, and certifications.
Conventions: [data-model conventions](../../general-architecture/data-model.md).

Media assets are owned by [media library](../other/media/data-model.md). The business profile the
website templates fill is [details](../other/details/data-model.md). Website forms write
[leads](../other/leads/data-model.md).

- `website_pages` — `id`, `tenant_id` fk, `path`, `title`, `page_type` (`standard`/`service`/
  `landing`/`legal`), `status` (`unpublished`/`published`/`archived`), `seo` jsonb, timestamps;
  unique `(tenant_id, path)`
- `website_sections` — `id`, `tenant_id` fk, `page_id` fk, `component_id`, `component_version`,
  `position`, `status` (`visible`/`hidden`), `props` jsonb, `design` jsonb, `source_refs` jsonb;
  unique `(page_id, position)`
- `website_slots` — `id`, `tenant_id` fk, `section_id` fk, `slot_key`, `slot_type` (`text`/
  `rich_text`/`image`/`link`/`list`/`json`), `value` jsonb, `status` (`unpublished`/`reviewed`/
  `approved`/`rejected`), `source_refs` jsonb, `validation_errors` jsonb; unique `(section_id, slot_key)`
- `website_forms` — `id`, `tenant_id` fk, `form_key`, `title`, `status` (`active`/`disabled`),
  `submit_action` (`create_website_lead`), `fields` jsonb, `privacy_notice`; unique `(tenant_id, form_key)`
- `top_menu_items` — `id`, `tenant_id` fk, `parent_id` nullable fk, `page_id` nullable fk,
  `label`, `path`, `url`, `position`, `status` (`visible`/`hidden`)
- `footer_items` — `id`, `tenant_id` fk, `parent_id` nullable fk, `page_id` nullable fk,
  `label`, `path`, `url`, `position`, `status` (`visible`/`hidden`)
- `website_publications` — one row is a website version: `id`, `tenant_id` fk, `version_number`,
  `status` (`published`/`archived`/`rolled_back`), `active`, `manifest_version`,
  `website_manifest` jsonb, `validation_report` jsonb, `published_by`,
  `rollback_of_publication_id` nullable, `published_at`; unique `(tenant_id, version_number)`
- `projects` — `id`, `tenant_id` fk, `title`, `description`, `cover_media_asset_id` nullable fk,
  `status` (`unpublished`/`published`), timestamps
- `website_certification_selections` — `id`, `tenant_id` fk, `certification_id`, `status`
  (`selected`/`removed`), `created_at`

## Indexes

Unique: `(tenant_id, website_pages.path)`, `(tenant_id, website_forms.form_key)`,
`(tenant_id, website_publications.version_number)`. Lookup: `(tenant_id, status, created_at)` on
website pages.
