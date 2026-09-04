# Projects — persistence

The contractor’s jobs with photos. Website sections and ads reference
these rows; they do not copy them into `website.projects`.

Conventions:
[persistence conventions](../../../general-architecture/persistence.md)
(Postgres schema `business_profile`). Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).
Live-profile tables share this namespace
([details persistence](../details/persistence.md)). Cover photos are
[media library](../../other/media/persistence.md) items. Extract
identity and Project skip:
[ETL persistence](../../etl/persistence.md).

## Tables

### `projects`

- **Columns:** `id` uuid pk, `tenant_id` fk, `title` text,
  `description` text, `cover_media_asset_id` uuid nullable fk,
  `status` text, `algorithm` text nullable, `schema_revision` int
  nullable, `origin` text, `created_at` timestamptz, `updated_at`
  timestamptz
- **Enums:** `status` → `draft` / `active` / `archived`; `origin` →
  `facebook` / `instagram` / `website_crawl` / `review` / `owner`
- **Uniques:** `id`
- **Written by:** `CreateProject`; `UpdateProject`; `ApproveProject`;
  `ArchiveProject`; `UnarchiveProject`; ETL transform
  (`status=active`, `created_by=business_research`); client interview
  Archive (`algorithm=human`)
- **Notes:** Qualified `business_profile.projects`. `title`
  `minLength` 1, `maxLength` 80; `description` `minLength` 1,
  `maxLength` 2000. No `facebook_post_id`, `instagram_post_id`, crawl
  URL, or `business_profile_review_id` columns. No nullable
  `source_id`. Owner CMS `POST /v1/projects` still inserts a **project
  draft**. ETL insert is `status=active`. Archive is not delete:
  archived rows stay so the owner can Unarchive. No dual
  `published_*` columns. No `project_drafts` table. Website
  publication bakes **active** only. Pending Ask-first description
  hunks are not a table; they live on `/cms/projects/{id}` until
  **Apply** PATCHes `description`.

### `project_sources`

- **Columns:** `project_id` fk, `source_id` fk → `etl.sources`,
  `tenant_id` fk
- **Enums:** none
- **Uniques:** `(project_id, source_id)`
- **Written by:** ETL transform
- **Notes:** ETL-inserted Projects have **at least one** cite. Owner
  project drafts have **none** (not generated from extract). Same
  crawl URL, Extract + HTML both yes → two rows, one Project. Archive
  keeps the cites so re-import does not insert a second Project
  (`llm_source_to_project_classifications` still points at this id).

## Indexes

Lookup: `(tenant_id, status)` on `projects`. Unique:
`project_sources` `(project_id, source_id)`.
