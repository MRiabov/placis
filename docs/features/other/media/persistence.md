# Media — persistence

The photo library. Website sections and ads reference these rows; they
do not copy them. Conventions:
[persistence conventions](../../../general-architecture/persistence.md)
(Postgres schema `media_library`). Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).
Classifier output is a dedicated table in this schema, not columns on
`media_assets` and not a table in `ai`
([classifications and predictions](../../../general-architecture/persistence.md#classifications-and-predictions)).
Original and image-thumbnail files live in
[files](../../../general-architecture/files-and-s3.md). ETL import
identity lives in `etl.imported_media`, not here.

The file on a media library item is never replaced. An edit creates a
new row (`parent_media_asset_id`); uses keep pointing at the old item
until they are retargeted to the copy.

Classifier output (media caption, photo kind, visual-issue severities)
is **not** on `media_assets`. It lives on
`media_asset_classifications` (one-to-many). There is no pointer on
the asset. Current = latest row for that `media_asset_id` by
`created_at`.

## Tables

### `media_assets`

- **Columns:** `id` uuid, `tenant_id` uuid fk, `asset_type` text,
  `source` text, `supplied_by` text, `parent_media_asset_id` uuid
  nullable fk → `media_assets`, `created_by` text, `status` text,
  `file_id` uuid nullable fk → `files`, `thumbnail_file_id` uuid
  nullable fk → `files`, `source_url` text nullable, `crop_mode` text,
  `crop_x` numeric nullable, `crop_y` numeric nullable, `crop_width`
  numeric nullable, `crop_height` numeric nullable (0–1, null when
  `full`), `focal_x` numeric, `focal_y` numeric (0–1),
  `review_status` text, `processing_status` text, `created_at`
  timestamptz
- **Enums:** `asset_type` → `image` / `generated_image`; `source` →
  `upload` / `generated` / `imported` / `external`; `supplied_by` →
  `owner` / `business_research` / `ai`; `created_by` → `owner` / `ai` /
  `done_for_you`; `status` → `active` / `archived`; `crop_mode` →
  `full` / `rect`; `review_status` → `pending_review` / `approved` /
  `rejected`; `processing_status` → `uploading` / `processing` /
  `ready` / `failed`
- **Uniques:** `id`
- **Written by:** `StartMediaAssetUpload`; `ConfirmMediaAssetUpload`;
  `StartMediaAssetReplaceUpload`; `WriteImageThumbnail`
  (`thumbnail_file_id`); `DescribeImage` (`processing_status=ready`);
  `UpdateMediaAsset` (crop / focal); `CleanupMediaAsset`;
  `RejectMediaAsset`; `ApproveMediaAsset` (called from `ApproveAd` /
  `PublishWebsite`, not a Route); `CreateGeneratedMediaAsset`; River
  job kind `sweep_stale_media_uploads`; ETL transforms (imported
  insert + **calls** `WriteImageThumbnail` + **inserts**
  `describe_image`)
- **Notes:** Owner `start-upload` always writes `asset_type=image`.
  There is no `asset_type=document` and no `asset_type=logo`. Logo vs
  photo is latest `media_asset_classifications.photo_kind`. Details
  `logo_media_asset_id` is attach. `file_id` and `thumbnail_file_id`
  are Internal (not HTTP). `processing_status` is not `review_status`
  and not `status`. No `media_caption` / `photo_kind` /
  `content_hash` / `*_severity` columns here.

### `media_asset_classifications`

- **Columns:** `id` uuid, `tenant_id` uuid fk, `media_asset_id` uuid
  fk → `media_assets`, `media_caption` text, `photo_kind` text,
  `content_hash` text, `algorithm` text, `schema_revision` int,
  `ai_generation_id` uuid nullable fk → `ai.ai_generations`,
  `clutter_severity` text nullable,
  `busy_background_severity` text nullable,
  `poor_lighting_severity` text nullable, `color_cast_severity` text
  nullable, `blur_severity` text nullable, `overlay_text_severity`
  text nullable, `subject_too_small_severity` text nullable,
  `low_resolution_severity` text nullable, `created_at` timestamptz
- **Enums:** `photo_kind` → `logo` / `photo`; `algorithm` includes
  `human`; each `*_severity` → `low` / `medium` / `high` or null
- **Uniques:** `id`. Not unique on `media_asset_id` (many rows per
  item).
- **Written by:** `DescribeImage` (insert only); `UpdateMediaAsset`
  when the PATCH includes `media_caption` (insert `algorithm=human`);
  crop copy-on-write (copy latest onto the child `media_asset_id`, no
  LLM)
- **Notes:** Current for HTTP / attach / auto-cleanup is the latest
  `created_at` for that `media_asset_id`. No pointer on
  `media_assets`. `DescribeImage` never updates an old row. Skip a
  new LLM insert when latest matches `algorithm` + `schema_revision`
  and `force` is false, or latest is `algorithm=human`.
  `content_hash` is the hash of **this** `file_id` at classify time.
  `ai_generation_id` is the LLM call (omit on `human` and on a crop
  copy). `content_hash`, `algorithm`, `schema_revision`,
  `ai_generation_id`, and `*_severity` are Internal (not HTTP).
  HTTP `media_caption` / `photo_kind` hydrate from this join.

### Copy-on-write

- **Crop / focal** — child keeps the parent’s `file_id` and
  `thumbnail_file_id`. Stay `approved` if the parent is. If this row is
  unreferenced, mutate crop/focal in place (the widget click-off must
  not stack unused copies). If referenced, insert the child; uses keep
  the parent until retargeted. Copy the parent’s **latest**
  classification onto the new `media_asset_id` (same payload, new id,
  no LLM).
- **AI cleanup** — child gets a new `file_id`, `pending_review`,
  inherits `supplied_by`. `WriteImageThumbnail` writes the child’s
  thumbnail. **inserts** `describe_image` on the child (new hash, new
  classification). Reject archives that copy (`status=archived`,
  `review_status=rejected`) and retargets uses to the parent. Accept is
  not a write.
- **Owner replace** — child gets a new `file_id`,
  `review_status=approved` (owner-uploaded), `processing_status=uploading`
  until confirm-upload. Parent `file_id` is never replaced. Confirm on
  the child **inserts** `describe_image` (new hash, new classification).
- **Attach** — no new row; the website slot (or ad placement) points at
  an existing item.

### Processing status

A new upload is `uploading` while `file_id` is null (browser PUT in
flight), then `processing` while `DescribeImage` **inserts** the first
classification, then `ready` — latest classification (media caption +
`photo_kind`) is always there once ready. Failed upload is `failed`.
The live website only uses `ready` + `approved` items. Ads LLM picks
use that same pool; a photo the owner adds to an ad is usable once the
photo is uploaded, even if captioning is still `processing`.

Visual-issue severities are Internal (`submit_image_visual_issues` on
the captioning pass, `parallel_tool_calls=true`). Every argument is
present: `low` / `medium` / `high` or null. Auto-run tailored light
cleanup on first upload from latest `clutter`, `busy_background`,
`poor_lighting`, `color_cast` when not null (high first). Suggest only:
`blur`, `overlay_text`, `subject_too_small`, `low_resolution` — no
auto-upres. First-upload auto-cleanup runs only when latest
`photo_kind=photo`. Skip `logo` and no classification yet. Owner
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
transform **calls** `WriteImageThumbnail`, then **inserts**
`describe_image` per new row with no classification yet (skip if
latest classification exists and is not stale). Do not wait for the
job. `DescribeImage` writes `media_asset_classifications`.

## Indexes

- `media_assets` `(tenant_id)`
- `media_assets` `(tenant_id, processing_status, created_at)` —
  `sweep_stale_media_uploads` deletes `uploading` + null `file_id`
  older than the website-editor leave-guard window
- `media_asset_classifications` `(tenant_id, media_asset_id,
  created_at DESC)` — current = latest
