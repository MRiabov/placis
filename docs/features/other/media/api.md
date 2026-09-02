# Media library HTTP

Conventions: [HTTP conventions](../../../general-architecture/api.md).
Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).
This resource **owns upload**. The `files` table stays
([files-and-s3.md](../../../general-architecture/files-and-s3.md));
there is **no** `/v1/files` HTTP. The file on an item is never replaced
in place; edits copy (`parent_media_asset_id`).

**Auth default:** Clerk JWT, active tenant. Mutating Routes send
`Idempotency-Key`. No freeform jsonb on these DTOs. Upload `upload_url`
is `string` + `maxLength` (URL). Crop/focal are bounded numbers (0–1).
Media caption is `string` + `maxLength` 500. Cleanup prompt is
`string` + `minLength` 1 + `maxLength` 500.

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
   attach `file_id`; **calls** `WriteImageThumbnail`; `processing`;
   **inserts** `describe_image`.

**Owner replace** (same handshake on a child; not PATCH):

1. `POST /v1/media-assets/{id}/start-replace-upload` — insert child
   (`parent_media_asset_id`, `review_status=approved`,
   `uploading`); return child `id` + `upload_url`. No photo on this POST.
2. Browser **PUT** to `upload_url`.
3. `POST /v1/media-assets/{child_id}/confirm-upload` — same function
   as first upload. Parent `file_id` is unchanged.

`PATCH /v1/media-assets/{id}` is media caption / crop / focal only.

**URLs on HTTP.** `delivery_url` is the original (`file_id`) for the
large view and Worker `media_asset_urls`. `thumbnail_url` is the image
thumbnail for grid tiles. Both nullable public non-expiring; null while
`file_id` is null. `upload_url` is PUT-only on `MediaAssetUploadRead`,
not on `MediaAssetRead`. No `logo_url`.

There is **no** media approve Route. `ApproveAd` and `PublishWebsite`
**call** `ApproveMediaAsset`. Sweep Accept is not HTTP. Website page
GET does not embed `media_assets[]`; the website editor lists via
`GET /v1/media-assets`.

`DescribeImage` is River job kind `describe_image`
([jobs.md](../../../general-architecture/jobs.md#describe_image)).

## DTOs

| DTO | Fields | Description |
| --- | --- | --- |
| `MediaAssetListGet` | `status`, `review_status` | Query; `status` defaults `active`; `review_status` optional |
| `MediaAssetRead` | `id`, `asset_type`, `source`, `supplied_by`, `parent_media_asset_id`, `status`, `media_caption`, `crop_mode`, `crop_x`, `crop_y`, `crop_width`, `crop_height`, `focal_x`, `focal_y`, `review_status`, `processing_status`, `photo_kind`, `created_at`, `delivery_url`, `thumbnail_url` | Item hydrate; GET by id; list row; image-edits / PATCH / confirm-upload / reject-parent response. Omit skip keys, `content_hash`, `file_id`, `thumbnail_file_id`, `*_severity` |
| `MediaAssetCreate` | `original_filename`, `content_type` | `start-upload` body. No owner `media_caption`. Always `asset_type=image` |
| `MediaAssetUploadRead` | `id`, `upload_url` | `start-upload` and `start-replace-upload` response. **PUT** URL, same grain as `AdDownloadRead.url`. Not `delivery_url` |
| `MediaAssetUpdate` | `media_caption`, `crop_mode`, `crop_x`, `crop_y`, `crop_width`, `crop_height`, `focal_x`, `focal_y` | PATCH omit = no change. No file / no `upload_url` |
| `MediaAssetImageEditCreate` | `prompt` | `minLength` 1, `maxLength` 500 |
| `MediaAssetRejectRead` | parent `MediaAssetRead` fields + `rejected_media_asset_id` | After Reject; UI reselects the parent |

Extra keys 4xx. List returns `MediaAssetRead[]`.

## Routes

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/media-assets` | `/cms/media`; website editor Content; ads picker (`review_status=approved`); Details logo picker; Projects cover overlay | `MediaAssetListGet` | `MediaAssetRead[]` | `media_assets`, `media_asset_classifications` | | Unpaginated. `status` defaults `active`. Omits `file_id` null + `processing_status=uploading` (in-flight tile is the local file URL). Hydrates `media_caption` / `photo_kind` from latest classification | | Paginate; embed `media_assets[]` on website page GET; age math for stale uploads |
| `POST /v1/media-assets/start-upload` | `/cms/media` upload; website editor drop / file picker; ads **+ Add** / drop | `MediaAssetCreate` | `MediaAssetUploadRead` | | `media_assets`, `files` | **calls** `StartMediaAssetUpload`; row `uploading` + `review_status=approved`; `id` + `upload_url`; no photo body | | Collection create; accept the photo; enqueue captioning; set `file_id`; **call** `WriteImageThumbnail` |
| `POST /v1/media-assets/{id}/confirm-upload` | After PUT succeeds | | `MediaAssetRead` | `media_assets`, `files` | `media_assets`, `files` | **calls** `ConfirmMediaAssetUpload`; empty body; scan; attach `file_id`; **calls** `WriteImageThumbnail`; `processing`; **inserts** `describe_image` | `404`; scan fail → `failed` | Accept the photo; wait for the media caption |
| `GET /v1/media-assets/{id}` | Poll Uploading… / Processing… / Failed; `/cms/media` selection | | `MediaAssetRead` | `media_assets`, `media_asset_classifications` | | Still returns an `uploading` row so the uploading browser can poll. Hydrates `media_caption` / `photo_kind` from latest classification | `404` | Omit in-flight the way list does |
| `PATCH /v1/media-assets/{id}` | Crop / focal click-off on `/cms/media`; media caption | `MediaAssetUpdate` | `MediaAssetRead` | `media_assets`, `media_asset_classifications` | `media_assets`, `media_asset_classifications` | **calls** `UpdateMediaAsset`; copy-on-write inside the function. Caption **inserts** a human classification. **Not** replace | `400` bad crop; `404` | Replace file; `upload_url` on the body |
| `POST /v1/media-assets/{id}/start-replace-upload` | `/cms/media` replace | | `MediaAssetUploadRead` | `media_assets` | `media_assets`, `files` | **calls** `StartMediaAssetReplaceUpload`; child `approved` + `uploading`; parent `file_id` unchanged; PUT then confirm-upload on the **child** | `404` | Replace parent `file_id`; accept the photo |
| `POST /v1/media-assets/{id}/image-edits` | `/cms/media` promptable cleanup; assistant `cleanup_image`; ads Review **inline AI assistance** (then ads placement PATCH) | `MediaAssetImageEditCreate` | child `MediaAssetRead` | `media_assets` | `media_assets`, `files`, `ai_use_ledger_entries` | **calls** `CleanupMediaAsset`; **calls** `AssertUsageCredit` then `RecordAIUseSpend` (`usage_category=image`); copy-on-write; child new `file_id`, `pending_review`; **calls** `WriteImageThumbnail` on the child; does not retarget uses | `400` empty prompt; `404`; `402` `usage_credit_exhausted` | Ads cleanup verb; Accept HTTP; first-upload auto (that is `DescribeImage`) |
| `POST /v1/media-assets/{id}/reject` | `/cms/media` sweep **Reject**; ads Review sweep **Reject** | | `MediaAssetRejectRead` | `media_assets` | `media_assets` | **calls** `RejectMediaAsset`; archives copy; retargets uses to parent | `409` `not_pending_review`; `409` `in_use`; already archived+rejected → `200` | `DELETE`; `PATCH review_status` |

### POST /v1/media-assets/start-upload

No photo body. Inserts `files` (`scan_status=pending`,
`visibility=public`) and `media_assets` (`asset_type=image`,
`source=upload`, `supplied_by=owner`, `created_by=owner`,
`status=active`, `review_status=approved`,
`processing_status=uploading`, `file_id` null, `thumbnail_file_id`
null, `crop_mode=full`, `focal_x=0.5`, `focal_y=0.5`). Response
`MediaAssetUploadRead`. Must not **insert** `describe_image`. Retry is
a new start-upload (new id). List omits this row; `GetMediaAsset`
still returns it. Abort is cancel of the PUT. Stale rows:
`sweep_stale_media_uploads`.

### PATCH /v1/media-assets/{id}

Omit = no change. `media_caption` `minLength` 1, `maxLength` 500.
When the PATCH includes `media_caption`, writes
`media_asset_classifications` (`algorithm=human`; copy latest
`photo_kind` / severities / `content_hash`; no LLM). Crop / focal
mutate `media_assets`. `crop_mode` `full` / `rect`. Crop numbers 0–1;
**null** when `full`; all four required when `rect`; width/height
`> 0`; `x+width ≤ 1`, `y+height ≤ 1`. Focal 0–1 in **full-image**
coordinates (not crop-rect). Default on a new row: `0.5`, `0.5`.

Referenced (website-section image, `logo_media_asset_id`,
`ad_image_placements`): insert a child, return it. The `/cms/media`
widget selects the child. Copy the parent’s latest classification onto
the child’s `media_asset_id` (no LLM). Unreferenced: mutate crop/focal
**in place**.

### POST /v1/media-assets/{id}/confirm-upload

Empty body; does not accept the photo. Go never saw the upload body.
Scan, attach `file_id`, **calls** `WriteImageThumbnail` (second `files`
row), set `processing`, **inserts** `describe_image` unique
`(tenant_id, media_asset_id)` while pending/running. HTTP returns
`MediaAssetRead` before `DescribeImage` finishes. Already
`processing` / `ready` → `200` same row; do not insert a second job.
Scan fail → `processing_status=failed`; no job; `file_id` still null.
**Try again** on `failed` is another
`POST /v1/media-assets/start-upload` (new id). The `failed` row stays
until Reject / `sweep_stale_media_uploads`. List still shows Failed.
No refresh PUT URL. Owner row stays `review_status=approved`.

### POST /v1/media-assets/{id}/image-edits

Child `parent_media_asset_id={id}`, inherits `supplied_by`. Parent
file is never replaced. `/cms/media` selects the child. Website
assistant / ads UI then point **that** website-section image or
`ad_image_placements` row at the child. Other uses stay on the
parent. **Calls** `AssertUsageCredit` then `RecordAIUseSpend`
(`usage_category=image`). `402` `usage_credit_exhausted`. First-upload
tailored cleanup is **not** this route (`DescribeImage` **calls** the
same function, no owner prompt). Accept after the sweep is **not** a
route.

### POST /v1/media-assets/{id}/reject

Pre: `status=active` and `review_status=pending_review`. Do:
`status=archived`, `review_status=rejected`. Do not delete the `files`
row. If `parent_media_asset_id` is set, retarget website-section
images, `logo_media_asset_id`, and `ad_image_placements` from this id
to the parent. Response: parent `MediaAssetRead` when a parent exists
(UI reselects it), plus `rejected_media_asset_id`.

**Not media HTTP** (other resources, or in-process **calls**):

- **Attach** — website `PATCH /v1/website/editor/pages/{page_id}` /
  assistant `update_slot`; ads
  `PATCH …/variants/{variant_id}`; Details
  `PATCH /v1/business-profile` (`logo_media_asset_id` /
  `founder_media_asset_id`); Projects `PATCH` `cover_media_asset_id`.
- **`generate_image`** — assistant tool / website 03 **calls**
  `CreateGeneratedMediaAsset`.
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
- `/v1/website/editor/assets`
- `/v1/website/editor/files/…`
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
- replace-on-PATCH / `upload_url` on `MediaAssetUpdate`
- a `thumbnails` table
- Cloudflare Image Resizing / `/cdn-cgi/image/` for CMS tiles
- `asset_type=document` / `asset_type=logo`
