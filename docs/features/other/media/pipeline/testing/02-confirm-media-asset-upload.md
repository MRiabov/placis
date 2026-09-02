# 02 — Confirm media asset upload (integration test)

Does not wait for captioning. Next step is 03, which SELECTs
`processing_status=processing` and `file_id` set.

- **Setup**: 01 already wrote `media_assets` (`uploading`, `file_id`
  null) and `files`. Test PUTs the photo to `upload_url` (faked object
  storage).
- **Invoke**: `POST /v1/media-assets/{id}/confirm-upload`
  (`ConfirmMediaAssetUpload`). Empty body.
- **Assert** (Postgres after 02, **before** 03 runs):
  - `media_assets`: same id, `file_id` set, `thumbnail_file_id` set,
    `processing_status=processing`, `review_status=approved`.
  - `files`: original `scan_status=clean`; second row for the image
    thumbnail.
  - Schema `jobs`: one `describe_image` (`tenant_id`,
    `media_asset_id`).
  - Response `MediaAssetRead`: `delivery_url` and `thumbnail_url`
    non-null; `processing_status=processing`.
- **Cases**:
  - Second confirm while job pending/running: `200` same row; still
    one `describe_image`.
  - Scan fail → `processing_status=failed`; no `describe_image`;
    `file_id` still null.
- **Handoff to 03**: 03 Pre can SELECT this `file_id` and
  `processing_status=processing`.
- **Fail**: unknown id → `404`; `media_assets` unchanged.
- **Mocked**: object-storage GET/scan. Not the LLM (03).
