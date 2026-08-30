# Projects — persistence

The contractor’s jobs with photos. Website sections and ads reference these
rows; they do not copy them into `website.projects`.

Conventions: [persistence conventions](../../../general-architecture/persistence.md) (Postgres schema `business_profile`).
Schema `details` still holds `business_profiles` and the other list tables until
[ETL ADR 9](../../etl/ADR.md). Cover photos are [media library](../../other/media/persistence.md) items. Extract identity and
Project skip:
[ETL persistence](../../etl/persistence.md).

- `projects` — qualified `business_profile.projects`. `id`, `tenant_id` fk,
  `title` (`minLength` 1, `maxLength` 80), `description` (`minLength` 1,
  `maxLength` 2000), `cover_media_asset_id` nullable fk, `status`
  (`draft` / `active` / `archived`), `algorithm` nullable, `schema_revision`
  nullable, `origin` (`facebook` / `instagram` / `website_crawl` / `review` /
  `owner`), timestamps

  No `facebook_post_id`, `instagram_post_id`, crawl URL, or
  `business_profile_review_id` columns. No nullable `source_id`.

- `project_sources` — `project_id` fk, `source_id` fk → `etl.sources`,
  `tenant_id` fk. Unique `(project_id, source_id)`. ETL-inserted Projects have
  **at least one** cite. Owner project drafts have **none** (not generated
  from extract). Same crawl URL, Extract + HTML both yes → two rows, one
  Project. Archive keeps the cites so re-import does not insert a second
  Project (`llm_source_to_project_classifications` still points at this id).

ETL insert is `status=active` (`created_by=business_research`). Owner CMS
`POST /v1/projects` still inserts a **project draft**. Client interview Archive
sets `algorithm=human` and `archived`.

Pending Ask-first description hunks are not a table. They live on
`/cms/projects/{id}` until **Apply** PATCHes `description`. Archive is not
delete: archived rows stay so the owner can Unarchive. No dual `published_*`
columns. No `project_drafts` table. Website publication bakes **active** only.
