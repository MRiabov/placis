# Media library HTTP

Conventions: [HTTP conventions](../../../general-architecture/api.md).
Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).
This resource **owns upload**. The `files` table stays
([files and S3](../../../infrastructure/files-and-s3.md));
there is **no** `/v1/files` HTTP. The file on an item is never replaced
in place; edits copy (`parent_media_asset_id`).

**Auth default:** Clerk JWT, active tenant. Mutating Routes send
`Idempotency-Key`. Unactivated onboarding uses
[`/v1/onboarding/media-assets/…`](../../onboarding/api.md) (list,
start-upload, confirm-upload; onboarding session token). These CMS
routes stay **403** unactivated. No freeform jsonb on these DTOs. Upload
`upload_url` is `string` + `maxLength` (URL). Crop/focal are bounded
numbers (0–1). Cleanup prompt is `string` + `minLength` 1 +
`maxLength` 500. Media caption is not on owner HTTP.

Cleanup is this resource. Ads placements and website slots
**reference** a `media_asset_id`; they do not own a second cleanup
HTTP. Ads Review **inline AI assistance** and the website editor
`cleanup_image` are callers of these routes, then they retarget
**that** placement or website-section image.

**First upload** (two hops, then PUT):

1. `POST /v1/media-assets/start-upload` — insert the row
   (`processing_status=uploading`, `review_status=approved`); return
   `id` + `upload_url`. No photo on this POST.
2. Browser **PUT** to `upload_url` (R2 / MinIO). Go never sees the
   body.
3. `POST /v1/media-assets/{id}/confirm-upload` — empty body; scan;
   attach `original_file_id`; **calls** `WriteCanonicalWebP` then
   `WriteImageThumbnail`; `processing`; **inserts** `describe_image`.

**Owner replace** (same handshake on a child; not PATCH):

1. `POST /v1/media-assets/{id}/start-replace-upload` — insert child
   (`parent_media_asset_id`, `review_status=approved`,
   `uploading`); return child `id` + `upload_url`. No photo on this POST.
2. Browser **PUT** to `upload_url`.
3. `POST /v1/media-assets/{child_id}/confirm-upload` — same function
   as first upload. Parent `file_id` is unchanged.

`PATCH /v1/media-assets/{id}` is crop / focal only.

**URLs on HTTP.** `delivery_url` is the canonical WebP (`file_id`) for
the large view and Worker `media_asset_urls`. `thumbnail_url` is the
image thumbnail for grid tiles. Both nullable public non-expiring; null
while `file_id` is null. PUT/import files stay on `original_file_id`
(Internal; not served). `upload_url` is PUT-only on
`MediaAssetUploadRead`, not on `MediaAssetRead`. No `logo_url`. PUT
`content_type` need not be WebP.

There is **no** media approve Route. `ApproveAd` and `PublishWebsite`
**call** `ApproveMediaAsset`. Sweep Accept is not HTTP. Website page
GET does not embed `media_assets[]`; the website editor lists via
`GET /v1/media-assets`.

`DescribeImage` is River job kind `describe_image`
([jobs.md](jobs.md#describe_image)).

## DTOs

| DTO | Fields | Description |
| --- | --- | --- |
| `MediaAssetListGet` | `status`, `review_status` | Query; `status` defaults `active` (`active` / `archived`); `review_status` optional (`pending_review` / `approved` / `rejected`) |
| `MediaAssetRead` | `id`, `asset_type`, `source`, `supplied_by`, `parent_media_asset_id`, `status`, `crop_mode`, `crop_x`, `crop_y`, `crop_width`, `crop_height`, `focal_x`, `focal_y`, `review_status`, `processing_status`, `photo_kind`, `cleaned_up_with_ai`, `created_at`, `delivery_url`, `thumbnail_url` | Item hydrate; GET by id; list row; image-edits / PATCH / confirm-upload / reject-parent response. `photo_kind` nullable until a classification exists. Omit `media_caption`, skip keys, `content_hash`, `file_id`, `original_file_id`, `thumbnail_file_id`, `algorithm`, `schema_revision`, `*_severity` |
| `MediaAssetCreate` | `original_filename`, `content_type` | `start-upload` body. No owner `media_caption`. Always `asset_type=image` |
| `MediaAssetUploadRead` | `id`, `upload_url` | `start-upload` and `start-replace-upload` response. **PUT** URL, same shape as `AdDownloadRead.url`. Not `delivery_url` |
| `MediaAssetUpdate` | `crop_mode`, `crop_x`, `crop_y`, `crop_width`, `crop_height`, `focal_x`, `focal_y` | PATCH omit = no change. No file / no `upload_url` / no `media_caption` |
| `MediaAssetImageEditCreate` | `prompt` | `minLength` 1, `maxLength` 500 |
| `MediaAssetRejectRead` | parent `MediaAssetRead` fields + `rejected_media_asset_id` | After Reject; UI reselects the parent |

Extra keys 4xx. List returns `MediaAssetRead[]`.

## Routes

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/media-assets` | `/cms/media`; website editor Content; ads picker (`review_status=approved`); Details logo picker; Projects cover overlay | `MediaAssetListGet` | `MediaAssetRead[]` | `media_assets`, `media_asset_classifications` | | Unpaginated. `status` defaults `active`. Omits `file_id` null + `processing_status=uploading` (in-flight tile is the local file URL). Hydrates `photo_kind` from latest classification | | Paginate; embed `media_assets[]` on website page GET; age math for stale uploads |
| `POST /v1/media-assets/start-upload` | `/cms/media` upload; website editor drop / file picker; ads **+ Add** / drop | `MediaAssetCreate` | `MediaAssetUploadRead` | | `media_assets`, `files` | **calls** `StartMediaAssetUpload`; row `uploading` + `review_status=approved`; `id` + `upload_url`; no photo body. Same `Idempotency-Key` returns the same id + `upload_url` | | Collection create; take the photo body; enqueue captioning; set `file_id`; **call** `WriteImageThumbnail` |
| `POST /v1/media-assets/{id}/confirm-upload` | After PUT succeeds | | `MediaAssetRead` | `media_assets`, `files` | `media_assets`, `files` | **calls** `ConfirmMediaAssetUpload`; empty body; scan; attach `original_file_id`; **calls** `WriteCanonicalWebP` then `WriteImageThumbnail`; `processing`; **inserts** `describe_image` | `404`; scan/decode fail → upload failed; already `failed` → `400` | Take the photo body; wait for the media caption |
| `GET /v1/media-assets/{id}` | Poll Uploading… / Processing… / Failed; `/cms/media` selection | | `MediaAssetRead` | `media_assets`, `media_asset_classifications` | | Still returns an `uploading` row so the uploading browser can poll. Hydrates `photo_kind` from latest classification | `404` | Omit in-flight the way list does |
| `PATCH /v1/media-assets/{id}` | Crop / focal click-off on `/cms/media` | `MediaAssetUpdate` | `MediaAssetRead` | `media_assets`, `media_asset_classifications` | `media_assets`, `media_asset_classifications` | **calls** `UpdateMediaAsset`; copy-on-write inside the function. Crop/focal only. **Not** replace | `400` bad crop; `404` | Replace file; `upload_url` on the body; `media_caption` |
| `POST /v1/media-assets/{id}/start-replace-upload` | `/cms/media` replace | | `MediaAssetUploadRead` | `media_assets` | `media_assets`, `files` | **calls** `StartMediaAssetReplaceUpload`; child `approved` + `uploading`; parent `file_id` unchanged; PUT then confirm-upload on the **child**. Same `Idempotency-Key` returns the same child id + `upload_url` | `404` | Replace parent `file_id`; take the photo body |
| `POST /v1/media-assets/{id}/image-edits` | `/cms/media` promptable cleanup; assistant `cleanup_image`; ads Review **inline AI assistance** (then ads placement PATCH) | `MediaAssetImageEditCreate` | child `MediaAssetRead` | `media_assets` | `media_assets`, `files`, `ai_use_ledger_entries` | **calls** `CleanupMediaAsset`; `bill_usage=billed` (`usage_category=image`); copy-on-write; child new original + canonical + thumbnail, `pending_review`, `cleaned_up_with_ai=true`; inherit `supplied_by` / `created_by`; **calls** `WriteCanonicalWebP` then `WriteImageThumbnail` on the child; **inserts** `describe_image` on the child; does not retarget website slots or ad placements | `400` empty prompt; `404`; `402` `usage_credit_exhausted` | Ads cleanup verb; Accept HTTP; first-upload auto (that is `DescribeImage`) |
| `POST /v1/media-assets/{id}/reject` | `/cms/media` sweep **Reject**; ads Review sweep **Reject** | | `MediaAssetRejectRead` | `media_assets` | `media_assets` | **calls** `RejectMediaAsset`; archives copy; retargets website slots and ad placements to parent | `409` `not_pending_review`; `409` `in_use`; already archived+rejected → `200` | `DELETE`; `PATCH review_status` |

### POST /v1/media-assets/start-upload

No photo body. **persists into** `media_assets` then `files`
(`original_filename`, `content_type`, `owner_type=media_asset`,
`owner_id` = that `media_assets.id`, `scan_status=pending`,
`visibility=public`). Row: `asset_type=image`, `source=upload`,
`supplied_by=owner`, `created_by=owner`, `status=active`,
`review_status=approved`, `processing_status=uploading`,
`original_file_id` null, `file_id` null, `thumbnail_file_id` null,
`cleaned_up_with_ai=false`, `crop_mode=full`, `focal_x=0.5`,
`focal_y=0.5`. Response `MediaAssetUploadRead`. Must not **insert**
`describe_image`. Same `Idempotency-Key` returns the same id +
`upload_url`. A new attempt **without** that key (abort, sweep,
scan-failed) is a new start-upload (new id). List omits this row;
`GetMediaAsset` still returns it. Abort is cancel of the PUT. Stale
rows: `sweep_stale_media_uploads`.

### PATCH /v1/media-assets/{id}

Omit = no change. Crop / focal persist into `media_assets`.
`crop_mode` `full` / `rect`. Crop numbers 0–1; **null** when `full`;
all four required when `rect`; width/height `> 0`; `x+width ≤ 1`,
`y+height ≤ 1`. Focal 0–1 in **full-image** coordinates (not
crop-rect). Default on a new row: `0.5`, `0.5`. Must not include
`media_caption`.

Referenced (website-section image, `logo_media_asset_id`,
`ad_image_placements`): insert a child, return it. The `/cms/media`
crop overlay selects the child. Copy the parent’s latest classification onto
the child’s `media_asset_id` (no LLM). Unreferenced: mutate crop/focal
**in place**.

### POST /v1/media-assets/{id}/confirm-upload

Empty body; does not take the photo body. Go never saw the upload body.
Scan, attach `original_file_id`, **calls** `WriteCanonicalWebP` then
`WriteImageThumbnail`, set `processing`, **inserts** `describe_image`
unique `(tenant_id, media_asset_id)` while pending/running. HTTP
returns `MediaAssetRead` before `DescribeImage` finishes. Already
`processing` / `ready` → `200` same row; do not insert a second job.
Already `failed` → `400`. Scan or decode/encode fail → upload failed
(`processing_status=failed`; no job; `file_id` still null). **Try
again** on upload-failed is another
`POST /v1/media-assets/start-upload` (new id). The `failed` row stays
until Reject / `sweep_stale_media_uploads`. List still shows Failed.
No refresh PUT URL. Owner row stays `review_status=approved`.

### POST /v1/media-assets/{id}/image-edits

Child `parent_media_asset_id={id}`, inherits `supplied_by` and
`created_by`, `cleaned_up_with_ai=true`. **Reads** parent
`original_file_id`. Parent file is never replaced. `/cms/media`
selects the child. Website assistant / ads UI then point **that**
website-section image or `ad_image_placements` row at the child. Other
website slots and ad placements stay on the parent. Cleanup generate
`bill_usage=billed` (`usage_category=image`).
`402` `usage_credit_exhausted`. **inserts** `describe_image` on the
child. First-upload tailored cleanup is **not** this route
(`DescribeImage` **calls** the same function, no owner prompt, only
when feature flag `media_auto_cleanup` is on; default off). Accept
after the sweep is **not** a route.

### POST /v1/media-assets/{id}/reject

Pre: `status=active` and `review_status=pending_review`. Do:
`status=archived`, `review_status=rejected`. Do not delete the `files`
row. If `parent_media_asset_id` is set, retarget website-section
images, `logo_media_asset_id`, and `ad_image_placements` from this id
to the parent. Response: parent `MediaAssetRead` when a parent exists
(UI reselects it), plus `rejected_media_asset_id`.

**Not media HTTP** (other resources, or in-process **calls**):

- **Attach** — website
  `PATCH /v1/websites/{website_prefix}/editor/pages/{page_id}` /
  assistant `update_slot`; ads
  `PATCH …/variants/{variant_id}`; Details
  `PATCH /v1/business-profile` (`logo_media_asset_id` /
  `founder_media_asset_id`); Projects `PATCH` `cover_media_asset_id`.
- **`generate_image`** — assistant tool / website 03 **calls**
  `CreateGeneratedMediaAsset` (`supplied_by=ai`, `created_by=ai`,
  `pending_review`, `processing_status=ready` after
  `WriteCanonicalWebP` then `WriteImageThumbnail`). Persists the tool
  `media_caption` into `media_asset_classifications`
  (`photo_kind=photo`, `algorithm=copy_requested_media_caption`). Must
  not **insert** `describe_image`. No first-upload auto-cleanup.
  Caller `bill_usage` and `thread_id`: CMS `billed`
  (`usage_category=image`); onboarding `unbilled`. Website 03 inherits
  the job `bill_usage`. **calls** `AssertUsageCredit` on billed (via
  `ai`). Remaining 0 billed: HTTP **402** `usage_credit_exhausted`;
  billed 03 job fail. Spend **persists into**
  `ai_use_ledger_entries` inside `ai`, not media.
- **`cleanup_image`** — assistant tool **calls** `CleanupMediaAsset`,
  then website or ads PATCH retargets.
- **Upload the photo** — browser PUT to `upload_url`, not Go.
- **ApproveMediaAsset** — `ApproveAd` / `PublishWebsite` **call**
  `ApproveMediaAsset`.
- **Abort Uploading…** — cancel of that PUT. Circle-and-cross;
  list omits the row; `sweep_stale_media_uploads` deletes after the
  leave-guard window.

## Do not create

- `/v1/files`
- `/v1/websites/{website_prefix}/editor/assets`
- `/v1/websites/{website_prefix}/editor/files/…`
- a second ads-only library
- `POST /v1/ads/{ad_id}/variants/{variant_id}/cleanup`
- `POST /v1/ads/…/reject` or `/accept`
- `POST /v1/media-assets` (collection create)
- `POST /v1/media-assets/{id}/complete`
- `POST /v1/media-assets/{id}/upload`
- `POST /v1/media-assets/get-upload-url`
- `POST /v1/media-assets/{id}/start-upload` (retry on same id)
- `POST /v1/media-assets/files/{id}/signed-url`
- `POST /v1/media-assets/{id}/approve`
- `POST /v1/media-assets/{id}/accept`
- `POST /v1/media-assets/{id}/crop`
- `POST /v1/media-assets/{id}/generate`
- `POST /v1/media-assets/{id}/attach`
- `POST /v1/media-assets/{id}/abort`
- `DELETE /v1/media-assets/{id}` (Reject archives)
- `PATCH review_status` as a free field
- replace-on-PATCH / `upload_url` / `media_caption` on
  `MediaAssetUpdate`
- a `thumbnails` table
- Cloudflare Image Resizing / `/cdn-cgi/image/` for CMS tiles
- `asset_type=document` / `asset_type=logo`
