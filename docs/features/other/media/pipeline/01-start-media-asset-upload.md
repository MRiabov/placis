# 01 — Start media asset upload

Insert the uploading row. Do not accept the photo. Do not enqueue captioning.

## Trigger

`POST /v1/media-assets/start-upload` (`StartMediaAssetUpload`). Owner
replace uses `POST /v1/media-assets/{id}/start-replace-upload`
(`StartMediaAssetReplaceUpload`) then the same confirm-upload on the
child.

## Pre

- Active tenant. Clerk JWT.
- `MediaAssetCreate`: `original_filename`, `content_type`.
- Replace: parent `status=active`.

## Must not

- Accept the photo on this POST. Browser PUTs `upload_url`.
- **insert** `describe_image`.
- **call** `WriteImageThumbnail`.
- Set `file_id` (still null until confirm-upload).
- Write `asset_type=document` or `asset_type=logo`. Owner upload is
  always `asset_type=image`.
- Collection `POST /v1/media-assets`.

## Do

`StartMediaAssetUpload` persists the uploading row and a `files` row
for the PUT.

1. Insert `files` (`scan_status=pending`, `visibility=public`).
2. Insert `media_assets` (`asset_type=image`, `source=upload`,
   `supplied_by=owner`, `created_by=owner`, `status=active`,
   `review_status=approved`, `processing_status=uploading`,
   `file_id` null, `thumbnail_file_id` null, `crop_mode=full`,
   `focal_x=0.5`, `focal_y=0.5`).
3. Return `MediaAssetUploadRead` (`id` + `upload_url`).
4. `StartMediaAssetReplaceUpload` inserts a **child** with
   `parent_media_asset_id={id}`, same `approved` + `uploading`. Parent
   `file_id` is unchanged.

## Reads

Parent `media_assets` on replace.

## Persist

One `media_assets` row (`processing_status=uploading`, `file_id`
null). One `files` row. No `describe_image` job.

## Fail

Validation 400. No rows. Retry is a new
`POST /v1/media-assets/start-upload`.

## Out

[02 confirm media asset upload](02-confirm-media-asset-upload.md) after
the browser PUT succeeds.

## Invariants

- List omits this row (`file_id` null + `uploading`). `GetMediaAsset`
  still returns it.
- Abort is cancel of the PUT. No abort Route. Stale rows:
  `sweep_stale_media_uploads`.
