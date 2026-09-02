# Media — Architecture

How a photo enters the media library, becomes ready, and is edited.
Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).

## Named identifiers

Named functions (same spelling in spec, Go, and tests):

- `StartMediaAssetUpload` — `internal/media/`. Route
  `POST /v1/media-assets/start-upload`.
- `ConfirmMediaAssetUpload` — `internal/media/`; **calls**
  `WriteImageThumbnail`. Route
  `POST /v1/media-assets/{id}/confirm-upload`.
- `DescribeImage` — River job kind `describe_image`
  ([jobs.md](../../../general-architecture/jobs.md#describe_image)).

CMS HTTP: one function per Routes verb+noun (`ListMediaAssets`,
`GetMediaAsset`, `UpdateMediaAsset`, `StartMediaAssetReplaceUpload`,
`CleanupMediaAsset`, `RejectMediaAsset`). Tables:
[persistence.md](persistence.md). DTOs and Routes: [api.md](api.md).
Prompts: `internal/media/prompts.yaml` (`prompt_id` matches
`thread_kind=media_cleanup`).

**Not Routes, still named:**

- `CreateGeneratedMediaAsset` — assistant / website 03
  `generate_image` **calls** this (`supplied_by=ai`,
  `pending_review`). **calls** `WriteImageThumbnail`. No
  `POST /v1/media-assets/generate`.
- `ApproveMediaAsset` — not media HTTP. `ApproveAd` **calls** it for
  `pending_review` items on that ad’s placements. `PublishWebsite`
  **calls** it for `pending_review` items on the published dump. Owner
  upload / owner replace write `approved` themselves. Sweep Accept is
  not a Route.
- `WriteImageThumbnail` — not a Route. Go encodes a small WebP from
  the original file; inserts a `files` row; sets
  `media_assets.thumbnail_file_id`. Callers: `ConfirmMediaAssetUpload`,
  `CleanupMediaAsset`, ETL transform insert, `CreateGeneratedMediaAsset`.
  Crop-only copy **shares** the parent’s `thumbnail_file_id`. Not
  `DescribeImage`. Not Cloudflare Image Resizing.

## The content model

A **media asset** is one item in the media library. It points at a
**File** (original) and may point at an **image thumbnail** File (grid
tiles). Website slots and ads placements store `media_asset_id`; they
do not copy the file.

- **media asset** — `media_assets`: `asset_type` (`image` /
  `generated_image`), `source`, `supplied_by`, `status`,
  `review_status`, `processing_status`, crop, focal. No media caption
  / photo kind columns.
- **media asset classification** — `media_asset_classifications`:
  media caption, `photo_kind` (`logo` / `photo`), visual-issue
  severities. Current = latest `created_at`. HTTP hydrates
  `media_caption` / `photo_kind` from this join. No pointer on
  `media_assets`.
- **File** — `files`: original file (`file_id`) and image-thumbnail
  file (`thumbnail_file_id`). HTTP `delivery_url` /
  `thumbnail_url`.
- **`status`** — `active` / `archived`. Reject archives a copy.
- **`review_status`** — owner upload and owner replace are
  `approved`. Cleanup / generate are `pending_review` until
  `ApproveAd` / `PublishWebsite` **call** `ApproveMediaAsset`.
- **`processing_status`** — `uploading` → `processing` → `ready`, or
  `failed`. Not review, not archive.

Copy-on-write is inside those functions. Cleanup is **two rows**: the
original stays `ready` + `approved`; the child has a new `file_id` and
`pending_review`. `/cms/media` lists both and selects the child. A
non-original tile is UI: `parent_media_asset_id` set **and** `file_id`
≠ parent’s `file_id` (crop-only children share the file — no star).

Callers: `/cms/media`, website editor Content, assistant
`cleanup_image` / `generate_image` / `update_slot`, ads Review
**inline AI assistance**, Details logo picker, Projects cover overlay.
Ads does not own a second library.

## Upload, confirm, describe

1. **Start upload** — `StartMediaAssetUpload` inserts
   `uploading` + `approved` and returns `upload_url`. Browser PUTs.
   List omits the row. `GetMediaAsset` still returns it.
2. **Confirm upload** — `ConfirmMediaAssetUpload` scans, attaches
   `file_id`, **calls** `WriteImageThumbnail`, sets `processing`,
   **inserts** `describe_image`.
3. **Describe image** — `DescribeImage` writes
   `media_asset_classifications` (media caption, `photo_kind` `logo`
   or `photo`, visual-issue severities), sets `ready`, and may **call**
   `CleanupMediaAsset` for first-upload auto-cleanup when latest
   `photo_kind=photo`. Skip `logo`. ETL transform **inserts** the same
   job per new imported row with no classification yet.
4. **Edit** — crop / replace / cleanup / Reject are Routes.

Abort Uploading… is cancel of that PUT. No abort Route.
`sweep_stale_media_uploads` deletes leftover `uploading` + null
`file_id` rows after the leave-guard window (in-process River on
`cmd/api`, not crontab).

## Concerns

Do not invent a lineage Route or a second `media_assets` type.

1. **Parent and cleanup child can both attach.** They are two ids,
   often the same media caption. Website 03 / CMS assistant
   `update_slot` / a later ads generate (once both are `approved`) can
   put the dirty original on one website slot and the cleaned copy on another.
   `/cms/media` showing both (with a mark on the non-original) is
   intentional; picker “one lineage, one use” is **not** specified
   yet.
2. **“Do not reuse an already-attached photo” is per website page.** Website
   03’s photo pass is per website page, then later image website slots on
   **that** website page. Home first; other website pages **in parallel**. Same
   id on Home and a service website page is allowed. GET hydrates one website
   page.
3. **Ads LLM pool vs first-upload cleanup.** Pool is `ready` +
   `approved`, so until `ApproveAd` **calls** `ApproveMediaAsset` the
   cleaned child is invisible to generate and the uncleaned original
   is the pick. Consistent with pending-review; odd next to
   auto-cleanup. Same follow-up as (1) if generate should prefer the
   child.
