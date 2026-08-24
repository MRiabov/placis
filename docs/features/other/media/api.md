# Media library HTTP

Conventions: [HTTP conventions](../../../general-architecture/api.md). This resource **owns
upload**. The `files` table stays ([files-and-s3.md](../../../general-architecture/files-and-s3.md));
there is **no** `/v1/files` HTTP. Bytes on an item are never replaced in place; edits copy
(`parent_media_asset_id`).

## OpenAPI opacity

No jsonb bags on these DTOs. Upload signed URL is `string` + `maxLength` (URL). Crop/focal are
bounded numbers (0–1). Media caption is `string` + `maxLength`.

## Complete

### GET /v1/media-assets

- **Auth:** Clerk JWT, active tenant
- **Callers:** `/cms/media`, website editor workspace, ads (filter `approved` + media caption
  present). Not a second library for ads.
- **Query:** optional `review_status=approved` (ads).

### POST /v1/media-assets

- **Auth:** Clerk JWT, active tenant
- **Callers:** upload from `/cms/media` or website editor drop / file picker.
- **Idempotency-Key:** yes.
- **Response:** new media library item id + signed URL. Completes via `…/complete`.

### POST /v1/media-assets/{id}/complete

- **Auth:** Clerk JWT, active tenant
- **Idempotency-Key:** yes.
- **Behavior:** scan/complete after `frontend-2` PUT to the signed URL.

### GET /v1/media-assets/{id} / PATCH /v1/media-assets/{id}

- **Auth:** Clerk JWT, active tenant
- **PATCH:** media caption, crop, focal. Replace inserts a **copy** (`parent_media_asset_id`);
  parent `file_id` is never replaced.
- **PATCH Idempotency-Key:** yes.

### POST /v1/media-assets/{id}/image-edits

- **Auth:** Clerk JWT, active tenant
- **Callers:** AI cleanup (`/cms/media`, website assistant `cleanup_image`, ads light cleanup).
  Same function; ads do not get a second cleanup path.
- **Idempotency-Key:** yes.
- **Response:** new pending-review row (new `file_id`).

### POST /v1/media-assets/{id}/approve

- **Auth:** Clerk JWT, active tenant
- **Idempotency-Key:** yes.
- **Behavior:** owner approval. Live website and ads require approved + media caption.

## Do not create

- `/v1/files`
- `/v1/website/editor/assets`
- `/v1/website/editor/files/…`
- a second ads-only library
