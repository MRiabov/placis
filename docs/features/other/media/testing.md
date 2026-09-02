# Media — E2E test

One full-stack E2E test: `/cms/media` upload → ready media caption → crop
click-off → replace → prompted cleanup → Reject copy. Drives
`frontend-2` (Playwright) against the real API + real Postgres; the
LLM is faked. DB asserts name the tables from
[persistence.md](persistence.md). Pipeline 01–03 asserts are
[pipeline/testing](pipeline/testing/README.md); this journey does not
re-assert 01 Persist beyond the handoff the UI needs. Website editor
Content attach on `/cms/website` uses the **same** `media_assets`
rows.

1. **Open library** — the owner opens `/cms/media` under Profile.
   - UI: empty thumbs, then the large view after selection.

2. **Upload** — file picker / drop. Request `MediaAssetCreate`;
   Response `MediaAssetUploadRead`; browser PUT `upload_url`; then
   `POST …/confirm-upload`.
   - DB: **persists into** `media_assets` (`source=upload`,
     `supplied_by=owner`, `review_status=approved`,
     `processing_status` leaves `uploading`).
   - UI: local file URL while Uploading…; list GET omitted that row.
     After confirm, `delivery_url` and `thumbnail_url` non-null (image
     thumbnail is the compressed `files` row, not a second library
     item). Processing… until 03.

3. **Ready media caption** — faked `describe_image` writes `media_caption`
   and `processing_status=ready`.
   - UI: Ready; large view uses `delivery_url`; grid tile uses
     `thumbnail_url`. If auto-cleanup ran, both rows are listed and
     the child is selected (star when `parent_media_asset_id` set and
     `file_id` ≠ parent).

4. **Crop click-off** — `PATCH /v1/media-assets/{id}`
   (`UpdateMediaAsset`, `MediaAssetUpdate`). Unreferenced: mutate in
   place. Referenced: child shares `file_id`.
   - DB: **persists into** `media_assets` crop / focal. No new
     `file_id` on crop-only.

5. **Replace** — `POST …/start-replace-upload` then PUT then
   confirm-upload on the **child**.
   - DB: child `media_assets` (`parent_media_asset_id`,
     `review_status=approved`, new `file_id` after confirm). Parent
     `file_id` unchanged.

6. **Prompted cleanup** — `POST …/image-edits`
   (`CleanupMediaAsset`, `MediaAssetImageEditCreate`). Sweep
   **Reject** is `POST …/reject` (`RejectMediaAsset`). Accept is not
   HTTP.
   - DB: cleanup child `pending_review`, new `file_id`. Reject:
     child `status=archived`, `review_status=rejected`; uses retarget
     to parent; response `MediaAssetRejectRead`.
   - UI: Cleaning up… then before/after sweep. Ads auto-approve of a
     cleanup copy is ads E2E (`ApproveAd`), not this file.
