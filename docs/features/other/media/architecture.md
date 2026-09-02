# Media — Architecture

How a photo enters the media library, becomes ready, and is edited.
Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).

## Named identifiers

Named functions (same spelling in spec, Go, and tests):

- `StartMediaAssetUpload` — `internal/media/`. Route
  `POST /v1/media-assets/start-upload`.
- `ConfirmMediaAssetUpload` — `internal/media/`; **calls**
  `WriteCanonicalWebP` then `WriteImageThumbnail`. Route
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
  `generate_image` **calls** this (`supplied_by=ai`, `created_by=ai`,
  `pending_review`). **calls** `WriteCanonicalWebP` then
  `WriteImageThumbnail`. **writes** `media_asset_classifications`
  (`algorithm=copy_requested_media_caption`, `photo_kind=photo`). Must
  not **insert** `describe_image`. No
  `POST /v1/media-assets/generate`.
- `ApproveMediaAsset` — not media HTTP. `ApproveAd` **calls** it for
  `pending_review` items on that ad’s placements. `PublishWebsite`
  **calls** it for `pending_review` items on the published dump. Owner
  upload / owner replace write `approved` themselves. Sweep Accept is
  not a Route.
- `WriteCanonicalWebP` — not a Route. Go encodes canonical WebP from
  the scanned original; inserts a `files` row; sets
  `media_assets.file_id`. Callers: `ConfirmMediaAssetUpload`,
  `CleanupMediaAsset`, ETL transform insert,
  `CreateGeneratedMediaAsset`. Crop-only copy **shares** the parent’s
  `file_id`. Not Cloudflare Image Resizing.
- `WriteImageThumbnail` — not a Route. Go encodes a small WebP from
  the canonical `file_id`; inserts a `files` row; sets
  `media_assets.thumbnail_file_id`. Same callers as
  `WriteCanonicalWebP`. Crop-only copy **shares** the parent’s
  `thumbnail_file_id`. Not `DescribeImage`. Not Cloudflare Image
  Resizing.

## The content model

A **media asset** is one item in the media library. It points at three
**File** rows after confirm: scanned original (`original_file_id`,
Internal backup), canonical WebP (`file_id`, `delivery_url`), image
thumbnail (`thumbnail_file_id`, `thumbnail_url`). Website slots and ads
placements store `media_asset_id`; they do not copy the file.

- **media asset** — `media_assets`: `asset_type` (`image` /
  `generated_image`), `source`, `supplied_by`, `created_by`, `status`,
  `review_status`, `processing_status`, `cleaned_up_with_ai`, crop,
  focal. No media caption / photo kind columns.
- **media asset classification** — `media_asset_classifications`:
  media caption, `photo_kind` (`logo` / `photo`), visual-issue
  severities. Current = latest `created_at`. HTTP hydrates
  `photo_kind` from this join. Omit `media_caption` on HTTP. No
  pointer on `media_assets`.
- **File** — `files`: original (`original_file_id`), canonical WebP
  (`file_id`), image-thumbnail (`thumbnail_file_id`). HTTP
  `delivery_url` / `thumbnail_url` are the two WebPs.
- **`status`** — `active` / `archived`. Reject archives a copy.
- **`review_status`** — owner upload and owner replace are
  `approved`. Cleanup / generate are `pending_review` until
  `ApproveAd` / `PublishWebsite` **call** `ApproveMediaAsset`.
- **`processing_status`** — `uploading` → `processing` → `ready`, or
  `failed` (upload failed vs captioning failed). Not review, not
  archive.

Copy-on-write is inside those functions. Cleanup is **two rows**: the
original stays `ready` + `approved`; the child has a new original +
canonical + thumbnail, `pending_review`, `cleaned_up_with_ai=true`.
`/cms/media` lists both and selects the child. A non-original tile is
UI: `parent_media_asset_id` set **and** `file_id` ≠ parent’s `file_id`
(crop-only children share the file — no star).

Callers: `/cms/media`, website editor Content, assistant
`cleanup_image` / `generate_image` / `update_slot`, ads Review
**inline AI assistance**, Details logo picker, Projects cover overlay.
Ads does not own a second library.

## Upload, confirm, describe

1. **Start upload** — `StartMediaAssetUpload` inserts
   `uploading` + `approved` and returns `upload_url`. Browser PUTs.
   List omits the row. `GetMediaAsset` still returns it. Same
   `Idempotency-Key` returns the same id + `upload_url`.
2. **Confirm upload** — `ConfirmMediaAssetUpload` **GET**s the PUT
   object, scans, attaches `original_file_id`, **calls**
   `WriteCanonicalWebP` then `WriteImageThumbnail` (PUT those WebPs),
   sets `processing`, **inserts** `describe_image`, returns **200**
   `MediaAssetRead` (`thumbnail_url` / `delivery_url` set) **before**
   `DescribeImage`. Already `failed` → 400. `/cms/media`, the website
   editor drop / file picker, and ads **+ Add** / drop (and replace
   confirm on the child) swap the local file URL for `thumbnail_url`
   from that body. Must not wait on the media caption. Must not resend
   the photo on confirm. Poll `GET /v1/media-assets/{id}` for `ready` /
   captioning-failed / auto-cleanup child this slice.
3. **Describe image** — `DescribeImage` **writes** `media_asset_classifications`
   (media caption, `photo_kind` `logo` or `photo`, visual-issue severities),
   sets `ready`, and may **call** `CleanupMediaAsset` for first-upload
   auto-cleanup when latest `photo_kind=photo`. Skip `logo`. ETL transform
   **inserts** `describe_image` per new imported row with no classification yet.
   Worker skips a new LLM row when latest matches `algorithm`+`schema_revision`.
4. **Generate** — `CreateGeneratedMediaAsset` **writes** the
   classification from the tool `media_caption` (`photo_kind=photo`,
   `algorithm=copy_requested_media_caption`) and is `ready` without
   `describe_image`.
5. **Edit** — crop / replace / cleanup / Reject are Routes. PATCH is
   crop / focal only.

Abort Uploading… is cancel of that PUT. No abort Route.
`sweep_stale_media_uploads` deletes leftover `uploading` **or**
upload-failed (`failed` + null `file_id`) rows after the leave-guard
window (in-process River on `cmd/api`, not crontab). Must not delete
captioning-failed (`failed` + `file_id` set).

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
