# Media library E2E and integration tests

Playwright e2e drives `frontend-2` against the real Go API and real
Postgres. Integration is **one side**. Backend: `humatest`,
Testcontainers Postgres and Testcontainers MinIO, fake LLM, prefer fake
Clerk. Frontend: Vitest `HappyPathMediaFull` (MSW, no Go). Persist names
tables from [persistence.md](persistence.md).

## E2E

### Upload, attach, crop, replace, cleanup, reject

#### Setup

Activated tenant. Unpublished website page with an image website slot
(from website 02). Zero `media_assets`. Playwright. LLM faked. R2 PUT /
GET faked. Worker not required (no publication).

#### Exercise

1. Open `/cms/media`. Empty thumbs.
2. File picker / drop. `MediaAssetCreate` → `MediaAssetUploadRead`.
   Browser PUT `upload_url`. `POST …/confirm-upload`.
3. Faked `describe_image` writes `media_asset_classifications`
   and sets `processing_status=ready`. If auto-cleanup ran, the child
   is selected (star when `parent_media_asset_id` set and `file_id` ≠
   parent).
4. Open `/cms/website`. Content attach of that item onto the image
   website slot (same `media_assets` rows as `/cms/media`). Discrete
   PATCH, not text click-off.
5. Back on `/cms/media`, crop click-off (`UpdateMediaAsset`). The row
   is referenced, so copy-on-write: child shares `file_id` and
   `thumbnail_file_id`.
6. Replace the selected item: `start-replace-upload` → PUT →
   confirm-upload on the **child**. Parent `file_id` unchanged.
7. Prompted cleanup (`CleanupMediaAsset`). Sweep **Reject**
   (`RejectMediaAsset`). Accept is not HTTP.

#### Verify

- After start-upload, before confirm: list omits the row; local file
  URL on the tile; `GetMediaAsset` still returns `uploading`.
- After confirm: `delivery_url` and `thumbnail_url` non-null and
  **different**. Three `files` rows: `original_file_id` (PUT file;
  `content_type` need not be WebP), `file_id` and `thumbnail_file_id`
  `image/webp`. Image thumbnail is not `/cdn-cgi/image/` on the
  original. `review_status=approved`. HTTP `MediaAssetRead` has no
  `media_caption`.
- After `DescribeImage`: latest `media_asset_classifications` has
  `media_caption` set, `photo_kind` `logo` or `photo`;
  `media_assets.processing_status=ready`. HTTP `MediaAssetRead` has
  `photo_kind` and no `media_caption`. Large view uses `delivery_url`;
  grid tile uses `thumbnail_url`.
- Website slot `media_asset_id` is the attached id.
- Crop of the attached row inserts a child; parent crop unchanged;
  website slot still on the parent until retargeted. Child has a
  copied `media_asset_classifications` row (same `content_hash`, no
  new LLM). Child shares `original_file_id`, `file_id`, and
  `thumbnail_file_id`.
- Replace child: `parent_media_asset_id` set, `review_status=approved`,
  new `file_id` after confirm; parent `file_id` unchanged.
- Cleanup child: `pending_review`, new `file_id`,
  `cleaned_up_with_ai=true`, `supplied_by` / `created_by` match
  parent, `ai_use_ledger_entries` `entry_kind=spend`
  `usage_category=image`. Schema `jobs` has `describe_image` on the
  child.
- Reject: child `status=archived`, `review_status=rejected`; website
  slot retargets to parent; response `MediaAssetRejectRead`.
- Ads auto-approve of a cleanup copy is ads e2e (`ApproveAd`), not
  this file.

#### Mocked

LLM (`describe_image`, cleanup generate). R2. Not Postgres. Not Clerk.

## Integration

### HappyPathMediaFull

Frontend. Vitest `HappyPathMediaFull`. Not OpenAPI 1:1.

#### Setup

Frontend (jsdom / Vitest, MSW, no Go). Tenant active. Empty library in
MSW fixtures.

#### Exercise

Open `/cms/media`. Empty thumbs. File picker / drop. MSW
`POST /v1/media-assets/start-upload`, then PUT is the browser (not MSW
Go). `POST /v1/media-assets/{id}/confirm-upload`. Grid shows. Crop
click-off. MSW `GET /v1/media-assets`, `PATCH /v1/media-assets/{id}`.

#### Verify

UI: grid tile uses `thumbnail_url`; large view uses `delivery_url`.
HTTP `MediaAssetRead` has no `media_caption`. MSW saw those
Method+path strings. Postgres rows are the backend test.

#### Fail

PATCH 4xx: inline error.

#### Mocked

All HTTP via MSW.

### TestHappyPathV1MediaAssetsReturnsList

Backend. Go `TestHappyPathV1MediaAssetsReturnsList`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Fake LLM.
Prefer fake Clerk. No `frontend-2`. Tenant active. One `ready` item
and one `uploading` item (`file_id` null).

#### Exercise

`GET /v1/media-assets`. Request `MediaAssetListGet`. Response
`MediaAssetRead[]`.

#### Verify

200. Body is `MediaAssetRead[]`. The `ready` item is present
(`photo_kind` set or null; no `media_caption`). The `uploading` item
is omitted.

#### Mocked

LLM unused. Not MinIO (Testcontainers). Prefer fake Clerk.

### TestHappyPathV1MediaAssetsStartUpload

Backend. Go `TestHappyPathV1MediaAssetsStartUpload`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Fake LLM.
Prefer fake Clerk. No `frontend-2`. Tenant active. Zero
`media_assets`.

#### Exercise

`POST /v1/media-assets/start-upload`. Request `MediaAssetCreate`.
Response `MediaAssetUploadRead`.

#### Verify

200. Body has `id` and `upload_url`. Then
`GET /v1/media-assets/{id}` returns `uploading`. List omits the row.

#### Fail

Missing `content_type` → 400.

#### Mocked

LLM unused. Not MinIO (Testcontainers). Prefer fake Clerk.

### TestHappyPathV1MediaAssetsIdConfirmUpload

Backend. Go `TestHappyPathV1MediaAssetsIdConfirmUpload`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Fake LLM.
Prefer fake Clerk. No `frontend-2`. Start-upload already wrote the
row (`uploading`). Test PUT to `upload_url` (MinIO real).

#### Exercise

`POST /v1/media-assets/{id}/confirm-upload`. Empty body. Response
`MediaAssetRead`.

#### Verify

200. Body `processing_status=processing`, `delivery_url` and
`thumbnail_url` set, no `media_caption`. Then
`GET /v1/media-assets/{id}` returns the same.

#### Fail

Already-`failed` → `400`. Unknown id → `404`.

#### Mocked

LLM unused. Not MinIO (Testcontainers). Prefer fake Clerk.

### TestHappyPathV1MediaAssetsReturnsItem

Backend. Go `TestHappyPathV1MediaAssetsReturnsItem`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Fake LLM.
Prefer fake Clerk. No `frontend-2`. An `uploading` row exists
(`file_id` null).

#### Exercise

`GET /v1/media-assets/{id}`. Response `MediaAssetRead`.

#### Verify

200. Body is that `uploading` row. No `media_caption`.

#### Fail

Unknown id → `404`.

#### Mocked

LLM unused. Not MinIO (Testcontainers). Prefer fake Clerk.

### TestHappyPathV1MediaAssetsPatch

Backend. Go `TestHappyPathV1MediaAssetsPatch`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Fake LLM.
Prefer fake Clerk. No `frontend-2`. A `ready` + `approved`
unreferenced item.

#### Exercise

`PATCH /v1/media-assets/{id}`. Request `MediaAssetUpdate`. Response
`MediaAssetRead`.

#### Verify

200. Then `GET /v1/media-assets/{id}` returns the new crop / focal.
No `media_caption` on the body.

#### Fail

Bad crop → `400`. Unknown id → `404`.

#### Mocked

LLM unused. Not MinIO (Testcontainers). Prefer fake Clerk.

### TestHappyPathV1MediaAssetsIdStartReplaceUpload

Backend. Go `TestHappyPathV1MediaAssetsIdStartReplaceUpload`. OpenAPI
1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Fake LLM.
Prefer fake Clerk. No `frontend-2`. A `ready` parent.

#### Exercise

`POST /v1/media-assets/{id}/start-replace-upload`. Response
`MediaAssetUploadRead`.

#### Verify

200. Body is the child `id` + `upload_url`. Then
`GET /v1/media-assets/{child id}` is `uploading`. Parent
`GET /v1/media-assets/{id}` `delivery_url` unchanged.

#### Fail

Unknown id → `404`.

#### Mocked

LLM unused. Not MinIO (Testcontainers). Prefer fake Clerk.

### TestHappyPathV1MediaAssetsIdImageEdits

Backend. Go `TestHappyPathV1MediaAssetsIdImageEdits`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Fake LLM.
Prefer fake Clerk. No `frontend-2`. A `ready` parent. Usage credit
available.

#### Exercise

`POST /v1/media-assets/{id}/image-edits`. Request
`MediaAssetImageEditCreate`. Response child `MediaAssetRead`.

#### Verify

200. Then `GET /v1/media-assets/{child id}` is `pending_review`,
`cleaned_up_with_ai=true`. Parent GET `delivery_url` unchanged.

#### Fail

Empty prompt → `400`. `402` `usage_credit_exhausted`. Unknown id →
`404`.

#### Mocked

LLM (cleanup generate). Not MinIO (Testcontainers). Prefer fake
Clerk.

### TestHappyPathV1MediaAssetsIdReject

Backend. Go `TestHappyPathV1MediaAssetsIdReject`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Fake LLM.
Prefer fake Clerk. No `frontend-2`. A `pending_review` child with a
parent.

#### Exercise

`POST /v1/media-assets/{id}/reject`. Response `MediaAssetRejectRead`.

#### Verify

200. Body has parent `MediaAssetRead` plus
`rejected_media_asset_id`. Then `GET /v1/media-assets/{id}` is
`archived` + `rejected`. Parent GET still `approved`.

#### Fail

`409` `not_pending_review`. `409` `in_use`.

#### Mocked

LLM unused. Not MinIO (Testcontainers). Prefer fake Clerk.

### Two-tenant isolation

#### Setup

Two activated tenants A and B. A has completed start-upload +
confirm-upload (A’s `media_assets` + original `files` + canonical
WebP `files` + image-thumbnail `files`). B has zero `media_assets`.

#### Exercise

As B: `GET /v1/media-assets`, `GET /v1/media-assets/{A’s id}`,
`POST …/{A’s id}/confirm-upload`, PUT A’s `upload_url`,
`PATCH` / `image-edits` / `reject` / `start-replace-upload` on A’s id.

#### Verify

404 or forbidden. Never A’s `MediaAssetRead`. B’s list empty. A’s
`media_assets` and `files` rows unchanged. A’s
`media_asset_classifications` unchanged. A’s queries stay
`tenant_id = A`.

#### Fail

B must not receive A’s `upload_url` or `delivery_url`.

#### Mocked

R2. Not Postgres.

### Start media asset upload

#### Setup

`tenants` (`status=active`). Zero `media_assets`. Schema `jobs`: no
`describe_image`.

#### Exercise

`POST /v1/media-assets/start-upload` (`StartMediaAssetUpload`).
Request `MediaAssetCreate`.

#### Verify

- `media_assets`: one row, `asset_type=image`, `source=upload`,
  `supplied_by=owner`, `status=active`, `review_status=approved`,
  `processing_status=uploading`, `file_id` null, `thumbnail_file_id`
  null, `original_file_id` null, `cleaned_up_with_ai=false`,
  `created_by=owner`, `crop_mode=full`, `focal_x=0.5`, `focal_y=0.5`.
- `files`: one row, `scan_status=pending`, `owner_type=media_asset`,
  `owner_id` = that `media_assets.id`.
- Response `MediaAssetUploadRead`: `id` of that row, `upload_url` set.
- `GET /v1/media-assets` omits this row.
- `GET /v1/media-assets/{id}` returns it (`uploading`).
- No `describe_image` job. `file_id` still null. Zero
  `media_asset_classifications`.

`POST /v1/media-assets/{id}/start-replace-upload` while the parent is
still `uploading` inserts a second `media_assets` row
(`parent_media_asset_id` = first id, `approved` + `uploading`); parent
`file_id` still null.

#### Fail

Missing `content_type` → 400; zero `media_assets`; no `files`. Photo
on this POST → 400; still zero rows. Collection `POST /v1/media-assets`
does not exist.

#### Mocked

Nothing (no LLM). Object-storage PUT is the browser, not this invoke.

### Confirm media asset upload

#### Setup

`StartMediaAssetUpload` already wrote `media_assets` (`uploading`,
`file_id` null) and `files`. Test PUTs the photo to `upload_url`
(faked object storage).

#### Exercise

`POST /v1/media-assets/{id}/confirm-upload`
(`ConfirmMediaAssetUpload`). Empty body.

#### Verify

- Same `media_assets` id: `original_file_id` set, `file_id` set,
  `thumbnail_file_id` set, `processing_status=processing`,
  `review_status=approved`.
- `files`: original `scan_status=clean`; canonical WebP
  (`file_id`, `image/webp`); image thumbnail (`thumbnail_file_id`,
  `image/webp`). `thumbnail_url` ≠ `delivery_url`. `thumbnail_url` is
  not a `/cdn-cgi/image/` URL. HTTP `MediaAssetRead` has no
  `media_caption`.
- Schema `jobs`: one `describe_image` (`tenant_id`, `media_asset_id`).
- HTTP returns before `DescribeImage` finishes. Still zero
  `media_asset_classifications`.
- Second confirm while job pending/running: `200` same row; still one
  `describe_image`.
- Two confirms on two ids, same tenant: two `describe_image` jobs
  (unique is not `tenant_id` alone).
- Photo on this POST → 400; row still `uploading`; no job.

#### Fail

Scan fail (no PUT, or dirty scan) → upload failed
(`processing_status=failed`; no `describe_image`; `file_id` still
null). Decode/encode fail → same. Already-`failed` confirm → `400`.
Unknown id → `404`; no extra row. **Try again** is another
`POST /v1/media-assets/start-upload` (new id); the `failed` row remains
until Reject / sweep.

#### Mocked

Object-storage GET/scan. Not the LLM (that is `DescribeImage`).

### Describe image

#### Setup

`ConfirmMediaAssetUpload` already wrote `media_assets` (`processing`,
`file_id` set, `thumbnail_file_id` set, `review_status=approved`) and
`describe_image` in schema `jobs`. No `ai.threads` / `ai_generations`
for `media_cleanup` yet.

#### Exercise

River worker for `describe_image` (`DescribeImage`).

#### Verify

- Original: one `media_asset_classifications` row (`media_caption`
  set, `photo_kind` `logo` or `photo`, every `*_severity` present
  (`low` / `medium` / `high` or null), `content_hash` of this
  `file_id`, `algorithm` / `schema_revision` / `ai_generation_id`
  set). `media_assets.processing_status=ready`,
  `review_status=approved`. Same `file_id` as confirm-upload. No
  `media_assets.media_caption` / `media_assets.photo_kind`.
- `ai.threads` / `ai_generations`: `thread_kind=media_cleanup`
  (reasoning + output + tool calls).
- Auto-cleanup (latest `photo_kind=photo` and clutter / busy
  background / poor lighting / color cast not null): second
  `media_assets` row, `parent_media_asset_id` = original, new
  `file_id`, `pending_review`, `cleaned_up_with_ai=true`,
  `supplied_by` / `created_by` match original, `thumbnail_file_id`
  set. Original still `ready` + `approved`. Child has a
  `describe_image` job (new classification after that job).
- Latest `photo_kind=logo`: still one `media_assets` row.
- Two `processing` rows, same tenant: both jobs run; unique
  `(tenant_id, media_asset_id)`; not serialized on `tenant_id`.
- ETL path: transform inserts `media_assets` + `files`, **calls**
  `WriteCanonicalWebP` then `WriteImageThumbnail`, **inserts**
  `describe_image`, returns without waiting. No classification yet was
  the insert condition. Latest classification exists → skip insert.
- Latest classification already matches `algorithm` +
  `schema_revision`: skip (no second generate).

#### Fail

LLM error → row stays `processing`; no `media_asset_classifications`
row; retries same `media_asset_id`; sibling photos unchanged. Retries
exhaust → captioning-failed (`processing_status=failed`, `file_id`
set); no classification row; sweep must not delete this row.

#### Mocked

LLM (media caption + `submit_image_visual_issues`). Cleanup generate
when auto-cleanup runs.

### PATCH crop / focal

#### Setup

A `ready` + `approved` owner row with one `media_asset_classifications`
row. Unreferenced (no website slot / ad placement). A second row
referenced by a website slot.

#### Exercise

`PATCH /v1/media-assets/{id}` (`UpdateMediaAsset`) with crop / focal
only. Second invoke: same body on the referenced row. Third invoke:
body includes `media_caption`.

#### Verify

- Unreferenced: mutate crop/focal in place; one `media_assets` row;
  classification row count unchanged.
- Referenced: copy-on-write child; website slot stays on the parent;
  child has a copied classification (same `content_hash`, no LLM).
- Body with `media_caption` → rejected (field gone). No
  `algorithm=human` row. GET / list `MediaAssetRead` has no
  `media_caption`.

#### Mocked

Nothing (no LLM).

### Create generated media asset

#### Setup

Activated tenant. Zero `media_assets`. Schema `jobs`: no
`describe_image`.

#### Exercise

`CreateGeneratedMediaAsset` (website 03 / assistant `generate_image`).
Tool `media_caption` set.

#### Verify

- `media_assets`: `asset_type=generated_image`, `source=generated`,
  `supplied_by=ai`, `created_by=ai`, `pending_review`,
  `processing_status=ready`, `cleaned_up_with_ai=false`.
- One `media_asset_classifications` row:
  `algorithm=copy_requested_media_caption`, `photo_kind=photo`,
  `media_caption` = tool value, severities null.
- Zero `describe_image`. HTTP `MediaAssetRead` has `photo_kind=photo`
  and no `media_caption`.

#### Mocked

Image generate. Not the captioning LLM.

### Replace after ready

#### Setup

A `ready` + `approved` owner row with `file_id` and `thumbnail_file_id`
set.

#### Exercise

`POST /v1/media-assets/{id}/start-replace-upload` then PUT then
`confirm-upload` on the **child**.

#### Verify

Child `parent_media_asset_id` = parent, `review_status=approved`,
`uploading` then `processing`. New `file_id` after confirm. Parent
`file_id` and `thumbnail_file_id` unchanged. Confirm **inserts**
`describe_image` on the child (new classification after that job; not
a copy of the parent’s).

#### Fail

Unknown / archived parent → `404`. Photo on start-replace POST → 400;
parent unchanged.

#### Mocked

R2 PUT. Not the LLM until confirm inserts `describe_image`.

### Prompted cleanup usage credit

#### Setup

A `ready` + `approved` row. Remaining usage credit 0
(`bill_usage=billed` would 402).

#### Exercise

`POST /v1/media-assets/{id}/image-edits` (`CleanupMediaAsset`) with a
non-empty prompt.

#### Verify

`402` `usage_credit_exhausted`. No child `media_assets`. No
`ai_use_ledger_entries` spend. Parent `file_id` unchanged.

Usage credit remaining: child `pending_review`, new `file_id`,
`cleaned_up_with_ai=true`, `WriteCanonicalWebP` then
`WriteImageThumbnail` on the child, spend row `usage_category=image`.
**inserts** `describe_image` on the child. Does not retarget website
slots or ad placements.
Empty prompt → `400`; no child.

#### Mocked

LLM on the success case only.

### Reject

#### Setup

Cleanup child `pending_review` with `parent_media_asset_id` set. A
website slot (or `ad_image_placements`) points at the child.

#### Exercise

`POST /v1/media-assets/{child}/reject` (`RejectMediaAsset`).

#### Verify

Child `status=archived`, `review_status=rejected`. `files` rows kept.
Website slots and ad placements retarget to parent. Response
`MediaAssetRejectRead` (parent + `rejected_media_asset_id`). Already
archived+rejected → `200`.

#### Fail

Reject an `approved` row → `409` `not_pending_review`. Attached row
with no parent → `409` `in_use`. `DELETE` does not exist.

#### Mocked

Nothing.

### Sweep stale uploads

#### Setup

One `media_assets` `uploading`, `file_id` null, `created_at` older
than the website-editor leave-guard window. One fresh `uploading` +
null `file_id` inside the window. One `ready` row. One upload-failed
(`failed` + null `file_id`) older than the window. One
captioning-failed (`failed` + `file_id` set) older than the window.

#### Exercise

River job kind `sweep_stale_media_uploads` (in-process `cmd/api`
workers, not crontab).

#### Verify

Stale `uploading` row deleted. Stale upload-failed row deleted. Fresh
`uploading` row kept. `ready` row kept. Captioning-failed row kept.
List still omits in-flight rows without this job (no age math in list).

#### Mocked

Nothing.
