# Projects — persistence

The contractor’s jobs with photos. Website sections and ads reference these
rows; they do not copy them into `website.projects`.

Conventions: [persistence conventions](../../../general-architecture/persistence.md) (Postgres schema `business_profile`).
Schema `details` still holds `business_profiles` and the other list tables until
[ETL ADR 9](../../etl/ADR.md). Cover photos are [media library](../../other/media/persistence.md) items.

- `projects` — qualified `business_profile.projects`. `id`, `tenant_id` fk,
  `title` (`minLength` 1, `maxLength` 80), `description` (`minLength` 1,
  `maxLength` 2000), `cover_media_asset_id` nullable fk, `status`
  (`draft` / `active` / `archived`), `algorithm` nullable, `schema_revision`
  nullable, `origin` (`facebook` / `instagram` / `website_crawl` / `review` /
  `owner`), source key unique per tenant when set:
  `facebook_post_id` **or** `instagram_post_id` **or** canonical crawl
  `source_page_url` **or** `business_profile_review_id` (owner-created rows
  have none), timestamps

ETL insert is `status=active` (`created_by=business_research`). Owner CMS
`POST /v1/projects` still inserts a **project draft**. Client interview Archive
sets `algorithm=human` and `archived` (unique source key kept so re-import does
not duplicate).

Pending Ask-first description hunks are not a table. They live on
`/cms/projects/{id}` until **Apply** PATCHes `description`. Archive is not
delete: archived rows stay so the owner can Unarchive. No dual `published_*`
columns. No `project_drafts` table. Website publication bakes **active** only.
