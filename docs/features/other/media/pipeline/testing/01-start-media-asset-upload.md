# 01 — Start media asset upload (integration test)

Does not enqueue captioning. Next step is 02, which SELECTs
`processing_status=uploading` and null `file_id`.

- **Setup**: `tenants` (`status=active`). Zero `media_assets` for this
  tenant. Schema `jobs`: no `describe_image`.
- **Invoke**: `POST /v1/media-assets/start-upload`
  (`StartMediaAssetUpload`). Request `MediaAssetCreate`.
- **Assert** (Postgres after 01, **before** 02 runs):
  - `media_assets`: one row, `asset_type=image`, `source=upload`,
    `supplied_by=owner`, `status=active`, `review_status=approved`,
    `processing_status=uploading`, `file_id` null,
    `thumbnail_file_id` null, `crop_mode=full`, `focal_x=0.5`,
    `focal_y=0.5`.
  - `files`: one row, `scan_status=pending`.
  - Response `MediaAssetUploadRead`: `id` of that row, `upload_url`
    set.
  - **Must not**: `describe_image` job. `file_id` set.
- **Cases**:
  - `GET /v1/media-assets` omits this row.
  - `GET /v1/media-assets/{id}` returns it (`uploading`).
  - `POST /v1/media-assets/{id}/start-replace-upload` inserts a second
    `media_assets` row (`parent_media_asset_id` = first id,
    `approved` + `uploading`); parent `file_id` still null.
- **Handoff to 02**: 02 Pre can SELECT this `media_assets` id with
  `file_id` null.
- **Fail**: missing `content_type` → 400; zero `media_assets`.
- **Mocked**: nothing (no LLM). Object-storage PUT is the browser, not
  this invoke.
