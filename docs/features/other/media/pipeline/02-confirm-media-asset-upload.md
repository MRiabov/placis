# 02 — Confirm media asset upload

Scan the PUT object. Attach `file_id`. Start captioning. Do not wait
for the media caption.

## Trigger

`POST /v1/media-assets/{id}/confirm-upload`
(`ConfirmMediaAssetUpload`). Empty body. Same function for first
upload and owner-replace children.

## Pre

- Active tenant. Clerk JWT.
- 01 already wrote `media_assets` (`processing_status=uploading`,
  `file_id` null) and a `files` row.
- Browser PUT to `upload_url` succeeded.

## Must not

- Accept the photo on this POST.
- Wait for `DescribeImage`.
- Replace a parent `file_id` on replace-confirm (the child is `{id}`).
- Cloudflare Image Resizing.

## Do

`ConfirmMediaAssetUpload` attaches the scanned file and queues
captioning.

1. Scan the object. Fail → `processing_status=failed`; stop.
2. Attach `file_id` on this `media_assets` row.
3. **calls** `WriteImageThumbnail` (new `files` row; set
   `thumbnail_file_id`).
4. Set `processing_status=processing`.
5. **inserts** River job kind `describe_image` (`tenant_id`,
   `media_asset_id`). Unique `(tenant_id, media_asset_id)` while
   pending/running. Second insert while in flight is a unique
   conflict (already queued).
6. Already `processing` / `ready` → return this row; do not insert a
   second job.

## Reads

`media_assets`, `files`.

## Calls

`WriteImageThumbnail`.

## Inserts

`describe_image`.

## Persist

`media_assets.file_id`, `media_assets.thumbnail_file_id`,
`media_assets.processing_status=processing`. Image-thumbnail `files`
row. Schema `jobs`: `describe_image`.

## Fail

Scan fail → `processing_status=failed`; no `describe_image`. **Try
again** is another `POST /v1/media-assets/start-upload` (new id).
`404` if the row is gone. Retry of confirm while already queued does
not insert a second job.

## Out

[03 describe image](03-describe-image.md). HTTP returns
`MediaAssetRead` with `delivery_url` and `thumbnail_url` set;
`processing_status=processing`.

## Invariants

- Go never saw the upload body.
- The media caption is not required for this response.
- Owner row stays `review_status=approved`.
