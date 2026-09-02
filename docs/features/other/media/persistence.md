# Media — persistence

The photo library. Website sections and ads reference these rows; they
do not copy them. Conventions:
[persistence conventions](../../../general-architecture/persistence.md)
(Postgres schema `media_library`). Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).
Classifier output is a dedicated table in this schema, not columns on
`media_assets` and not a table in `ai`
([classifications and predictions](../../../general-architecture/persistence.md#classifications-and-predictions)).
Original, canonical WebP, and image-thumbnail files live in
[files](../../../general-architecture/files-and-s3.md). ETL import
identity lives in `etl.imported_media`, not here.

The file on a media library item is never replaced. An edit creates a
new row (`parent_media_asset_id`); website slots and ad placements keep
pointing at the old item until they are retargeted to the copy.

Classifier output (media caption, photo kind, visual-issue severities)
is **not** on `media_assets`. It lives on
`media_asset_classifications` (one-to-many). There is no pointer on
the asset. Current = latest row for that `media_asset_id` by
`created_at`. Media caption is Internal (not HTTP). HTTP hydrates
`photo_kind` from this join.

## Tables

### `media_assets`

- **Columns:** `id` uuid, `tenant_id` uuid fk, `asset_type` text,
  `source` text, `supplied_by` text, `parent_media_asset_id` uuid
  nullable fk → `media_assets`, `created_by` text, `status` text,
  `original_file_id` uuid nullable fk → `files`, `file_id` uuid
  nullable fk → `files`, `thumbnail_file_id` uuid nullable fk →
  `files`, `cleaned_up_with_ai` bool (default false), `source_url`
  text nullable, `crop_mode` text, `crop_x` numeric nullable,
  `crop_y` numeric nullable, `crop_width` numeric nullable,
  `crop_height` numeric nullable (0–1, null when `full`), `focal_x`
  numeric, `focal_y` numeric (0–1), `review_status` text,
  `processing_status` text, `created_at` timestamptz
- **Enums:** `asset_type` → `image` / `generated_image`; `source` →
  `upload` / `generated` / `imported`; `supplied_by` → `owner` /
  `business_research` / `ai`; `created_by` → `owner` / `ai` /
  `business_research`; `status` → `active` / `archived`; `crop_mode`
  → `full` / `rect`; `review_status` → `pending_review` / `approved`
  / `rejected`; `processing_status` → `uploading` / `processing` /
  `ready` / `failed`
- **Uniques:** `id`
- **Written by:** `StartMediaAssetUpload`; `ConfirmMediaAssetUpload`;
  `StartMediaAssetReplaceUpload`; `WriteCanonicalWebP` (`file_id`);
  `WriteImageThumbnail` (`thumbnail_file_id`); `DescribeImage`
  (`processing_status=ready` or captioning-failed); `UpdateMediaAsset`
  (crop / focal); `CleanupMediaAsset`; `RejectMediaAsset`;
  `ApproveMediaAsset` (called from `ApproveAd` / `PublishWebsite`, not
  a Route); `CreateGeneratedMediaAsset`; River job kind
  `sweep_stale_media_uploads`; ETL transforms (imported insert +
  **calls** `WriteCanonicalWebP` then `WriteImageThumbnail` +
  **inserts** `describe_image`)
- **Notes:** Owner `start-upload` always writes `asset_type=image`,
  `created_by=owner`, `cleaned_up_with_ai=false`. There is no
  `asset_type=document` and no `asset_type=logo`. Logo vs photo is
  latest `media_asset_classifications.photo_kind`. Details
  `logo_media_asset_id` is attach. `original_file_id`, `file_id`, and
  `thumbnail_file_id` are Internal (not HTTP). `original_file_id` is
  the scanned PUT/import (backup; not served this slice). `file_id` is
  the canonical WebP (`delivery_url`). `thumbnail_file_id` is the tile
  WebP downscaled from that canonical (`thumbnail_url`). Hash and
  classify `file_id`. `processing_status` is not `review_status` and
  not `status`. No `media_caption` / `photo_kind` / `content_hash` /
  `*_severity` columns here. Generate: `created_by=ai`,
  `supplied_by=ai`. ETL imported: `created_by=business_research`,
  `supplied_by=business_research`. Cleanup child: inherit parent
  `created_by` / `supplied_by`; `cleaned_up_with_ai=true`. Owner
  upload / replace / generate write `cleaned_up_with_ai=false`. Crop
  of a cleaned child copies `true`.

#### Copy-on-write

- **Crop / focal** (`UpdateMediaAsset`) — child keeps the parent’s
  `original_file_id`, `file_id`, and `thumbnail_file_id`. Stay
  `approved` if the parent is. Copy `cleaned_up_with_ai`. If this row
  is unreferenced, mutate crop/focal in place (the crop overlay click-off
  must not stack unused copies). If referenced (website-section image,
  `logo_media_asset_id`, `ad_image_placements`), insert the child;
  website slots and ad placements keep the parent until retargeted.
  Copy the parent’s **latest** classification onto the new
  `media_asset_id` (same payload, new id, no LLM).
- **AI cleanup** (`CleanupMediaAsset`) — **reads** parent
  `original_file_id` (not the lossy WebP). Child gets a new original +
  new canonical + new thumbnail, `pending_review`, inherits
  `supplied_by` and `created_by`, `cleaned_up_with_ai=true`.
  **inserts** `describe_image` on the child (new hash, new
  classification). Reject archives that copy (`status=archived`,
  `review_status=rejected`) and retargets website slots and ad
  placements to the parent. Accept is not a write.
- **Owner replace** — child gets a new original / canonical /
  thumbnail after confirm, `review_status=approved` (owner-uploaded),
  `processing_status=uploading` until confirm-upload,
  `cleaned_up_with_ai=false`. Parent `file_id` is never replaced.
  Confirm on the child **inserts** `describe_image` (new hash, new
  classification).
- **Attach** — no new row; the website slot (or ad placement) points at
  an existing item.

#### Processing status

A new upload is `uploading` while `file_id` is null (browser PUT in
flight). After confirm scan: attach `original_file_id`, **calls**
`WriteCanonicalWebP` then `WriteImageThumbnail`, set `processing`,
**inserts** `describe_image`. `DescribeImage` **writes** the first
classification, then `ready` — latest classification exists (media
caption + `photo_kind`). Generated items are `ready` because
`CreateGeneratedMediaAsset` **writes** a classification at create.
Same `processing_status=failed`; always name which:

- **Upload failed** — confirm scan or decode/encode failed. `file_id`
  null (original may still be dirty/unattached). Overlay “Couldn't
  upload that photo — try again”. New `start-upload`. List shows that
  Failed tile. Sweep deletes these rows (`failed` + null `file_id`)
  older than the leave-guard window.
- **Captioning failed** — confirm succeeded, `describe_image` retries
  exhausted. `file_id` and thumbnail set. Overlay “Couldn't write that
  media caption”. No HTTP this slice to caption again. Sweep must not
  delete these rows.

The live website still requires `ready` + `approved` items. Ads LLM
picks from that same pool (latest **media caption** on
`media_asset_classifications`); a photo the owner adds to an ad is
usable once `file_id` is set, including captioning-failed, even if
captioning is still `processing`.

Visual-issue severities are Internal (`submit_image_visual_issues` on
the captioning pass, `parallel_tool_calls=true`). Every argument is
present: `low` / `medium` / `high` or null. Tool `clutter` maps to
column `clutter_severity` (same for the other seven). Auto-run
tailored light cleanup on first upload from latest `clutter_severity`,
`busy_background_severity`, `poor_lighting_severity`,
`color_cast_severity` when not null (high first), only when feature
flag `media_auto_cleanup` is on (default off). Suggest only:
`blur`, `overlay_text`, `subject_too_small`, `low_resolution` — no
auto-upres. First-upload auto-cleanup runs only when that flag is on
**and** latest `photo_kind=photo`. Skip `logo` and no classification
yet. Owner upload and owner replace write `review_status=approved`.
Cleanup /
`CreateGeneratedMediaAsset` write `pending_review` until `ApproveAd` or
`PublishWebsite` **calls** `ApproveMediaAsset`.

#### Canonical WebP and image thumbnail

After scan, attach `original_file_id`. `WriteCanonicalWebP` **writes**
`file_id` (`image/webp`; stills; first frame if animated). Then
`WriteImageThumbnail` downscales **that** WebP into
`thumbnail_file_id`. In-process Go on confirm / ETL insert / cleanup /
generate. Not the browser. Not Cloudflare Image Resizing. Decode or
encode fail → upload failed. Crop-only children share all three ids.
`content_hash` is checksum of canonical `file_id`. Website publication
04 same-host WebP is the live contractor site, not this library write.
Instagram / image-edit that reads `original_file_id` is later work.

#### Imported media

ETL rows are `source=imported`, `supplied_by=business_research`,
`created_by=business_research`. External ids live in
`etl.imported_media`, not a second column on this row. Parent extracts
are `imported_media_sources` (≥1 `etl.sources` id). A later extract
does not insert a second item for the same `(tenant_id,
imported_media_kind, external_id)`, including when this row is
`archived`. Owner uploads are not `imported_media` and have no source
junction. After insert of `media_assets` + original `files`, transform
**calls** `WriteCanonicalWebP` then `WriteImageThumbnail`, then
**inserts** `describe_image` per new row with no classification yet.
Do not wait for the job. `DescribeImage` **writes**
`media_asset_classifications`. `force` is ETL `StartRun` / transform
only; the River job has no `force`.

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
- **Enums:** `photo_kind` → `logo` / `photo`; `algorithm` is open text
  (known this slice: `copy_requested_media_caption`; DescribeImage
  writes its own algorithm id the same way ETL transform does); each
  `*_severity` → `low` / `medium` / `high` or null
- **Uniques:** `id`. Not unique on `media_asset_id` (many rows per
  item).
- **Written by:** `DescribeImage` (insert only); `CreateGeneratedMediaAsset`
  (`algorithm=copy_requested_media_caption`, `photo_kind=photo`,
  severities null, `ai_generation_id` of that generate); `UpdateMediaAsset`
  (copy latest onto the crop child `media_asset_id`, no LLM)
- **Notes:** Current for attach / auto-cleanup is the latest
  `created_at` for that `media_asset_id`. No pointer on
  `media_assets`. `DescribeImage` never updates an old row. Skip a
  new LLM insert when latest matches `algorithm` + `schema_revision`.
  `content_hash` is the hash of **this** canonical `file_id` at
  classify time. `ai_generation_id` is the LLM call (omit on a crop
  copy). `media_caption`, `content_hash`, `algorithm`,
  `schema_revision`, `ai_generation_id`, and `*_severity` are Internal
  (not HTTP). HTTP hydrates `photo_kind` from this join.

## Indexes

- `media_assets` `(tenant_id)`
- `media_assets` `(tenant_id, processing_status, created_at)` —
  `sweep_stale_media_uploads` deletes `uploading` **or** upload-failed
  (`failed` + null `file_id`) older than the website-editor
  leave-guard window
- `media_asset_classifications` `(tenant_id, media_asset_id,
  created_at DESC)` — current = latest
