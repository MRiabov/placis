# Media — data model

The photo library. Website sections and ads reference these rows; they do not copy them.
Conventions: [data-model conventions](../../../general-architecture/data-model.md). Bytes live in
[files](../../../general-architecture/files-and-s3.md).

- `media_assets` — `id`, `tenant_id` fk, `asset_type` (`image`/`logo`/`document`/
  `generated_image`), `source` (`upload`/`generated`/`imported`/`external`), `status`
  (`active`/`archived`), `file_id` nullable, `source_url`, `media_caption`, `focal_point` jsonb, `crop`
  jsonb, `provenance` jsonb, `review_status` (`pending_review`/`approved`/`rejected`), `created_at`
