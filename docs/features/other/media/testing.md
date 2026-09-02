# Media library E2E and integration tests

Playwright e2e drives `frontend-2` against the real Go API and real
Postgres. Integration is backend-only (`humatest`, real Postgres). LLM
and R2 are faked. Clerk is real. Persist grain names tables from
[persistence.md](persistence.md).

## E2E

### Upload, attach, crop, replace, cleanup, reject

#### Setup

Activated tenant. Unpublished website page with an image website slot
(from website 02). Zero `media_assets`. Playwright. LLM faked. R2 PUT /
GET faked. Worker not required (no publication).

#### Invoke

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

#### Assert

- After start-upload, before confirm: list omits the row; local file
  URL on the tile; `GetMediaAsset` still returns `uploading`.
- After confirm: `delivery_url` and `thumbnail_url` non-null and
  **different**. Image thumbnail is a second `files` row, not
  `/cdn-cgi/image/` on the original. `review_status=approved`.
- After `DescribeImage`: latest `media_asset_classifications` has
  `media_caption` set, `photo_kind` `logo` or `photo`;
  `media_assets.processing_status=ready`. Large view uses
  `delivery_url`; grid tile uses `thumbnail_url`.
- Website slot `media_asset_id` is the attached id.
- Crop of the attached row inserts a child; parent crop unchanged;
  website slot still on the parent until retargeted. Child has a
  copied `media_asset_classifications` row (same `content_hash`, no
  new LLM).
- Replace child: `parent_media_asset_id` set, `review_status=approved`,
  new `file_id` after confirm; parent `file_id` unchanged.
- Cleanup child: `pending_review`, new `file_id`,
  `ai_use_ledger_entries` `entry_kind=spend` `usage_category=image`.
- Reject: child `status=archived`, `review_status=rejected`; website
  slot retargets to parent; response `MediaAssetRejectRead`.
- Ads auto-approve of a cleanup copy is ads e2e (`ApproveAd`), not
  this file.

#### Mocked

LLM (`describe_image`, cleanup generate). R2. Not Postgres. Not Clerk.

## Integration

### Two-tenant isolation

#### Setup

Two activated tenants A and B. A has completed start-upload +
confirm-upload (A’s `media_assets` + original `files` +
image-thumbnail `files`). B has zero `media_assets`.

#### Invoke

As B: `GET /v1/media-assets`, `GET /v1/media-assets/{A’s id}`,
`POST …/{A’s id}/confirm-upload`, PUT A’s `upload_url`,
`PATCH` / `image-edits` / `reject` / `start-replace-upload` on A’s id.

#### Assert

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

#### Invoke

`POST /v1/media-assets/start-upload` (`StartMediaAssetUpload`).
Request `MediaAssetCreate`.

#### Assert

- `media_assets`: one row, `asset_type=image`, `source=upload`,
  `supplied_by=owner`, `status=active`, `review_status=approved`,
  `processing_status=uploading`, `file_id` null, `thumbnail_file_id`
  null, `crop_mode=full`, `focal_x=0.5`, `focal_y=0.5`.
- `files`: one row, `scan_status=pending`.
- Response `MediaAssetUploadRead`: `id` of that row, `upload_url` set.
- `GET /v1/media-assets` omits this row.
- `GET /v1/media-assets/{id}` returns it (`uploading`).
- No `describe_image` job. `file_id` still null. Zero
  `media_asset_classifications`.

#### Cases

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

#### Invoke

`POST /v1/media-assets/{id}/confirm-upload`
(`ConfirmMediaAssetUpload`). Empty body.

#### Assert

- Same `media_assets` id: `file_id` set, `thumbnail_file_id` set,
  `processing_status=processing`, `review_status=approved`.
- `files`: original `scan_status=clean`; second row for the image
  thumbnail. `thumbnail_url` ≠ `delivery_url`. `thumbnail_url` is not
  a `/cdn-cgi/image/` URL.
- Schema `jobs`: one `describe_image` (`tenant_id`, `media_asset_id`).
- HTTP returns before `DescribeImage` finishes. Still zero
  `media_asset_classifications`.

#### Cases

- Second confirm while job pending/running: `200` same row; still one
  `describe_image`.
- Two confirms on two ids, same tenant: two `describe_image` jobs
  (unique is not `tenant_id` alone).
- Photo on this POST → 400; row still `uploading`; no job.

#### Fail

Scan fail (no PUT, or dirty scan) → `processing_status=failed`; no
`describe_image`; `file_id` still null. Unknown id → `404`; no extra
row. **Try again** is another `POST /v1/media-assets/start-upload`
(new id); the `failed` row remains until Reject / sweep.

#### Mocked

Object-storage GET/scan. Not the LLM (that is `DescribeImage`).

### Describe image

#### Setup

`ConfirmMediaAssetUpload` already wrote `media_assets` (`processing`,
`file_id` set, `thumbnail_file_id` set, `review_status=approved`) and
`describe_image` in schema `jobs`. No `ai.threads` / `ai_generations`
for `media_cleanup` yet.

#### Invoke

River worker for `describe_image` (`DescribeImage`).

#### Assert

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
  `file_id`, `pending_review`, `thumbnail_file_id` set. Original still
  `ready` + `approved`. Child has a `describe_image` job (new
  classification after that job).
- Latest `photo_kind=logo`: still one `media_assets` row.

#### Cases

- Two `processing` rows, same tenant: both jobs run; unique
  `(tenant_id, media_asset_id)`; not serialized on `tenant_id`.
- ETL path: transform inserts `media_assets` + `files`, **calls**
  `WriteImageThumbnail`, **inserts** `describe_image`, returns without
  waiting. No classification yet was the insert condition. Latest
  classification exists → skip insert.
- Latest classification already matches `algorithm` +
  `schema_revision` and `force` is false: skip (no second generate).
- Latest `algorithm=human`: skip (no second generate).

#### Fail

LLM error → row stays `processing`; no `media_asset_classifications`
row; retries same `media_asset_id`; sibling photos unchanged.

#### Mocked

LLM (media caption + `submit_image_visual_issues`). Cleanup generate
when auto-cleanup runs.

### Patch media caption

#### Setup

A `ready` + `approved` owner row with one `media_asset_classifications`
row (`algorithm` not `human`). Unreferenced (no website slot / ad
placement).

#### Invoke

`PATCH /v1/media-assets/{id}` (`UpdateMediaAsset`) with
`media_caption` only.

#### Assert

- Second `media_asset_classifications` row: `algorithm=human`, new
  `media_caption`, same `photo_kind` / severities / `content_hash` as
  the previous latest. `ai_generation_id` null. No LLM.
- HTTP `MediaAssetRead.media_caption` is the new value.
  `photo_kind` unchanged.
- `media_assets` crop / focal / `file_id` unchanged. One
  `media_assets` row (unreferenced; no copy-on-write).

#### Fail

Empty `media_caption` → `400`; still one classification row.

#### Mocked

Nothing (no LLM).

### Replace after ready

#### Setup

A `ready` + `approved` owner row with `file_id` and `thumbnail_file_id`
set.

#### Invoke

`POST /v1/media-assets/{id}/start-replace-upload` then PUT then
`confirm-upload` on the **child**.

#### Assert

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
(`AssertUsageCredit` would 402).

#### Invoke

`POST /v1/media-assets/{id}/image-edits` (`CleanupMediaAsset`) with a
non-empty prompt.

#### Assert

`402` `usage_credit_exhausted`. No child `media_assets`. No
`ai_use_ledger_entries` spend. Parent `file_id` unchanged.

#### Cases

Usage credit remaining: child `pending_review`, new `file_id`,
`WriteImageThumbnail` on the child, spend row `usage_category=image`.
**inserts** `describe_image` on the child. Does not retarget uses.
Empty prompt → `400`; no child.

#### Mocked

LLM on the success case only.

### Reject

#### Setup

Cleanup child `pending_review` with `parent_media_asset_id` set. A
website slot (or `ad_image_placements`) points at the child.

#### Invoke

`POST /v1/media-assets/{child}/reject` (`RejectMediaAsset`).

#### Assert

Child `status=archived`, `review_status=rejected`. `files` rows kept.
Uses retarget to parent. Response `MediaAssetRejectRead` (parent +
`rejected_media_asset_id`). Already archived+rejected → `200`.

#### Fail

Reject an `approved` row → `409` `not_pending_review`. Attached row
with no parent → `409` `in_use`. `DELETE` does not exist.

#### Mocked

Nothing.

### Sweep stale uploads

#### Setup

One `media_assets` `uploading`, `file_id` null, `created_at` older
than the website-editor leave-guard window. One fresh `uploading` +
null `file_id` inside the window. One `ready` row.

#### Invoke

River job kind `sweep_stale_media_uploads` (in-process `cmd/api`
workers, not crontab).

#### Assert

Stale row deleted. Fresh `uploading` row kept. `ready` row kept. List
still omits in-flight rows without this job (no age math in list).

#### Mocked

Nothing.
