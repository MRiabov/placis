# Media — persistence

The photo library. Website sections and ads reference these rows; they
do not copy them. Conventions:
[persistence conventions](../../../general-architecture/persistence.md)
(Postgres schema `media_library`). Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).
Original and image-thumbnail files live in
[files](../../../general-architecture/files-and-s3.md). ETL import
identity lives in `etl.imported_media`, not here.

The file on a media library item is never replaced. An edit creates a
new row (`parent_media_asset_id`); uses keep pointing at the old item
until they are retargeted to the copy.

## Tables

### `media_assets`

- **Columns:** `id` uuid, `tenant_id` uuid fk, `asset_type` text,
  `source` text, `supplied_by` text, `parent_media_asset_id` uuid
  nullable fk → `media_assets`, `created_by` text, `status` text,
  `file_id` uuid nullable fk → `files`, `thumbnail_file_id` uuid
  nullable fk → `files`, `source_url` text nullable, `media_caption`
  text nullable, `crop_mode` text, `crop_x` numeric nullable, `crop_y`
  numeric nullable, `crop_width` numeric nullable, `crop_height`
  numeric nullable (0–1, null when `full`), `focal_x` numeric,
  `focal_y` numeric (0–1), `review_status` text, `processing_status`
  text, `photo_kind` text nullable, `photo_kind_algorithm` text
  nullable, `photo_kind_schema_revision` int nullable, `content_hash`
  text nullable, `clutter_severity` text nullable,
  `busy_background_severity` text nullable, `poor_lighting_severity`
  text nullable, `color_cast_severity` text nullable, `blur_severity`
  text nullable, `overlay_text_severity` text nullable,
  `subject_too_small_severity` text nullable,
  `low_resolution_severity` text nullable, `created_at` timestamptz
- **Enums:** `asset_type` → `image` / `generated_image`; `source` →
  `upload` / `generated` / `imported` / `external`; `supplied_by` →
  `owner` / `business_research` / `ai`; `created_by` → `owner` / `ai` /
  `done_for_you`; `status` → `active` / `archived`; `crop_mode` →
  `full` / `rect`; `review_status` → `pending_review` / `approved` /
  `rejected`; `processing_status` → `uploading` / `processing` /
  `ready` / `failed`; `photo_kind` → `hero` / `project` / `service` /
  `founder` / `logo`; each `*_severity` → `low` / `medium` / `high` or
  null
- **Uniques:** `id`
- **Written by:** `StartMediaAssetUpload`; `ConfirmMediaAssetUpload`;
  `StartMediaAssetReplaceUpload`; `WriteImageThumbnail`
  (`thumbnail_file_id`); `DescribeImage`; `UpdateMediaAsset`;
  `CleanupMediaAsset`; `RejectMediaAsset`; `ApproveMediaAsset` (called
  from `ApproveAd` / `PublishWebsite`, not a Route);
  `CreateGeneratedMediaAsset`; River job kind
  `sweep_stale_media_uploads`; ETL transforms (imported insert +
  **calls** `WriteImageThumbnail` + **inserts** `describe_image`); ETL
  [photo classification](../../etl/pipeline/photo-classification.md)
  (`photo_kind*` only)
- **Notes:** Owner `start-upload` always writes `asset_type=image`.
  There is no `asset_type=document` and no `asset_type=logo`. ETL
  `photo_kind=logo` and Details `logo_media_asset_id` stay as attach.
  Skip keys, `content_hash`, `file_id`, `thumbnail_file_id`, and
  `*_severity` are Internal (not HTTP). `processing_status` is not
  `review_status` and not `status`.

### Copy-on-write

- **Crop / focal** — child keeps the parent’s `file_id` and
  `thumbnail_file_id`. Stay `approved` if the parent is. If this row is
  unreferenced, mutate crop/focal in place (the widget click-off must
  not stack unused copies). If referenced, insert the child; uses keep
  the parent until retargeted.
- **AI cleanup** — child gets a new `file_id`, `pending_review`,
  inherits `supplied_by`. `WriteImageThumbnail` writes the child’s
  thumbnail. Reject archives that copy (`status=archived`,
  `review_status=rejected`) and retargets uses to the parent. Accept is
  not a write.
- **Owner replace** — child gets a new `file_id`,
  `review_status=approved` (owner-uploaded), `processing_status=uploading`
  until confirm-upload. Parent `file_id` is never replaced.
- **Attach** — no new row; the website slot (or ad placement) points at
  an existing item.

### Processing status

A new upload is `uploading` while `file_id` is null (browser PUT in
flight), then `processing` while `DescribeImage` writes the media caption
and visual-issue severities, then `ready` — the media caption
is always there once ready. Failed upload is `failed`. The live website
only uses `ready` + `approved` items. Ads LLM picks use that same pool;
a photo the owner adds to an ad is usable once the photo is uploaded,
even if captioning is still `processing`.

Visual-issue severities are Internal (`submit_image_visual_issues` on
the captioning pass, `parallel_tool_calls=true`). Every argument is
present: `low` / `medium` / `high` or null. Auto-run tailored light
cleanup on first upload from `clutter`, `busy_background`,
`poor_lighting`, `color_cast` when not null (high first). Suggest only:
`blur`, `overlay_text`, `subject_too_small`, `low_resolution` — no
auto-upres. First-upload auto-cleanup skips `photo_kind=logo`. Owner
upload and owner replace write `review_status=approved`. Cleanup /
`CreateGeneratedMediaAsset` write `pending_review` until `ApproveAd` or
`PublishWebsite` **calls** `ApproveMediaAsset`.

### Image thumbnail

`thumbnail_file_id` is the compressed WebP of **this row’s** `file_id`
for CMS / ads / Details / Projects grid tiles. Distinct from the
original File. Not a second `media_assets` row and not a `thumbnails`
table. `WriteImageThumbnail` is in-process Go (not River, not
Cloudflare Image Resizing). Crop-only children share the parent’s
`thumbnail_file_id`. Null while `file_id` is null.

### Imported media

ETL rows are `source=imported`, `supplied_by=business_research`.
External ids live in `etl.imported_media`, not a second column on this
row. Parent extracts are `imported_media_sources` (≥1 `etl.sources`
id). A later extract does not insert a second item for the same
`(tenant_id, imported_media_kind, external_id)`, including when this
row is `archived`. Owner uploads are not `imported_media` and have no
source junction. After insert of `media_assets` + original `files`,
transform **calls** `WriteImageThumbnail`, **calls** photo
classification, then **inserts** `describe_image` per new row with
empty `media_caption` (skip if the media caption is already set). Do not wait
for the job.

## Indexes

- `(tenant_id)`
- `(tenant_id, processing_status, created_at)` — `sweep_stale_media_uploads`
  deletes `uploading` + null `file_id` older than the website-editor
  leave-guard window
