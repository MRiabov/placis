# Media — data model

The photo library. Website sections and ads reference these rows; they do not copy them.
Conventions: [data-model conventions](../../../general-architecture/data-model.md)
(Postgres schema `media_library`). Bytes live in
[files](../../../general-architecture/files-and-s3.md).

The file on a media library item is never replaced. An edit (owner replace or AI cleanup) creates
a new row; uses keep pointing at the old item until they are retargeted to the copy.

- `media_assets` — `id`, `tenant_id` fk, `asset_type` (`image`/`logo`/`document`/
  `generated_image`), `source` (`upload`/`generated`/`imported`/`external`), `supplied_by`
  (`owner`/`business_research`/`ai`), `parent_media_asset_id` nullable fk, `created_by`
  (`owner`/`ai`/`done_for_you`), `status` (`active`/`archived`), `file_id` nullable (never
  replaced after insert), `source_url`, `media_caption`,
  `crop_mode` (`full`/`rect`), `crop_x`, `crop_y`, `crop_width`, `crop_height` (0–1, null when
  `full`), `focal_x`, `focal_y` (0–1),
  `review_status` (`pending_review`/`approved`/`rejected`), `created_at`

A cleanup copy inherits `supplied_by` from the parent. A generated image is `supplied_by=ai`.
