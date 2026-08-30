# Media library HTTP

Conventions: [HTTP conventions](../../../general-architecture/api.md). This resource **owns upload**. The `files`
table stays ([files-and-s3.md](../../../general-architecture/files-and-s3.md)); there is **no** `/v1/files` HTTP. The file on
an item is never replaced in place; edits copy (`parent_media_asset_id`).

Cleanup is this resource. Ads placements and website slots **reference** a
`media_asset_id`; they do not own a second cleanup HTTP. Ads Review
**inline AI assistance** and the website editor `cleanup_image` are callers of
these routes, then they retarget **that** placement or website-section image.

## Serve only types on HTTP

No jsonb bags on these DTOs. Upload signed URL is `string` + `maxLength` (URL).
Crop/focal are bounded numbers (0–1). Media caption is `string` + `maxLength`
500. Cleanup prompt is `string` + `minLength` 1 + `maxLength` 500.

## Complete

### GET /v1/media-assets

- **Auth:** Clerk JWT, active tenant
- **Callers:** `/cms/media`, website editor workspace, ads (filter `approved` +
  media caption present). Not a second library for ads.
- **Query:** `status` defaults to `active` (archived Reject copies are omitted).
  Optional `review_status=approved` (ads).

### POST /v1/media-assets

- **Auth:** Clerk JWT, active tenant
- **Callers:** upload from `/cms/media` or website editor drop / file picker.
- **Idempotency-Key:** yes.
- **Response:** new media library item id + signed URL. Completes via
  `…/complete`.

### POST /v1/media-assets/{id}/complete

- **Auth:** Clerk JWT, active tenant
- **Idempotency-Key:** yes.
- **Behavior:** scan/complete after `frontend-2` PUT to the signed URL.

### GET /v1/media-assets/{id} / PATCH /v1/media-assets/{id}

- **Auth:** Clerk JWT, active tenant
- **PATCH Idempotency-Key:** yes.
- **PATCH request** (omit = no change):
  - `media_caption` — `string`, `minLength` 1, `maxLength` 500
  - `crop_mode` — `full` | `rect`
  - `crop_x`, `crop_y`, `crop_width`, `crop_height` — `0–1`; **null** when
    `full`; all four required when `rect`; width/height `> 0`; `x+width ≤ 1`,
    `y+height ≤ 1`
  - `focal_x`, `focal_y` — `0–1` in **full-image** coordinates (not crop-rect).
    Default on a new row: `0.5`, `0.5`
- **Crop / focal copy-on-write:** child keeps the parent’s `file_id`; stays
  `approved` if this row is. Uses keep the parent until retargeted.
  - Referenced (website-section image, `logo_media_asset_id`,
    `ad_image_placements`): insert a child, return it. The `/cms/media` widget
    selects the child.
  - Unreferenced: mutate crop/focal **in place** (click-off must not stack
    unused copies).
- **Replace:** a new file inserts a copy (`parent_media_asset_id`); parent
  `file_id` is never replaced. Mixing file replace and crop in one PATCH is
  `400`.

### POST /v1/media-assets/{id}/image-edits

- **Auth:** Clerk JWT, active tenant
- **Callers:** `/cms/media` promptable cleanup; assistant `cleanup_image`; ads
  Review **inline AI assistance** (then PATCH the placement). Same function; not
  an ads verb.
- **Idempotency-Key:** yes.
- **Request:** `prompt` (`string`, `minLength` 1, `maxLength` 500). Empty prompt
  is `400`.
- **Behavior:** copy-on-write. Child gets a **new** `file_id`,
  `review_status=pending_review`, `parent_media_asset_id={id}`, inherits
  `supplied_by`. Parent file is never replaced. **Does not retarget uses.**
  `/cms/media` selects the child. Website assistant / ads UI then point **that**
  website-section image or `ad_image_placements` row at the child. Other uses
  stay on the parent.
- **Response:** the child `*Read`.
- First-upload tailored cleanup is **not** this route (worker, no owner prompt).
  Accept after the sweep is **not** a route: the child already exists as
  `pending_review`. Accept is not `POST …/approve`.

### POST /v1/media-assets/{id}/reject

- **Auth:** Clerk JWT, active tenant
- **Callers:** `/cms/media` before/after **Reject**; ads Review sweep
  **Reject**. Same button, same route.
- **Idempotency-Key:** yes.
- **Pre:** `status=active` and `review_status=pending_review`.
- **Do:** `status=archived`, `review_status=rejected`. Do not delete the `files`
  row. If `parent_media_asset_id` is set, retarget website-section images,
  `logo_media_asset_id`, and `ad_image_placements` from this id to the parent.
- **Response:** parent `*Read` when a parent exists (UI reselects it), plus
  `rejected_media_asset_id`.
- Already archived+rejected → `200` (safe to retry).
- **409** `not_pending_review` if approved. **409** `in_use` if attached **and**
  there is no parent.

### POST /v1/media-assets/{id}/approve

- **Auth:** Clerk JWT, active tenant
- **Idempotency-Key:** yes.
- **Behavior:** owner approval. Live website and ads LLM pool require approved +
  media caption. Not the cleanup-sweep Accept.

## Do not create

- `/v1/files`
- `/v1/website/editor/assets`
- `/v1/website/editor/files/…`
- a second ads-only library
- `POST /v1/ads/{ad_id}/variants/{variant_id}/cleanup`
- `POST /v1/ads/…/reject` or `/accept`
- `POST /v1/media-assets/{id}/accept`
- `POST /v1/media-assets/{id}/crop`
- `DELETE /v1/media-assets/{id}` (Reject archives)
- `PATCH review_status` as a free field
