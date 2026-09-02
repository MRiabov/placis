# 04 — Export ad set (integration test)

Does not write ad tables. Same fields on ad-set and download.

- **Setup**: 03 already wrote `ads` (`status=ad_ready_to_post`),
  `ad_variants` (`status=approved`), `ad_copy_variants`,
  `ad_image_placements`, `ad_lead_forms`. Source `media_assets` files
  exist.
- **Exercise**: `POST /v1/ads/{ad_id}/ad-set` then
  `POST /v1/ads/{ad_id}/download` (`ExportAdSet`).
- **Verify**:
  - Response `AdSetRead`: `format_number`, `format`, headline /
    primary_text / description / `cta_label`, placements (crop +
    source `media_asset_id`), `lead_form` include flags. Verbatim
    match to Postgres copy and placements.
  - Download: `AdDownloadRead.url` is a signed URL. `files` has a
    private zip. MinIO object keys
    `{ad_id}/{variant_format}/{position}.{ext}`.
  - `audit_events` for ad-set / download.
  - **Must not**: `ads` / `ad_variants` / `ad_copy_variants` /
    `ad_image_placements` / `ad_lead_forms` row contents unchanged
    (except `ads.updated_at` must also stay). No `platform_refs`
    write.
- **Cases**:
  - Same POST twice → same images and same `AdSetRead`.
  - `ads.status=ad_needs_review` → `409`; no `files` zip.
- **Fail**: not `ad_ready_to_post` → 409; ad tables unchanged.
- **Mocked**: ad platforms (none called). MinIO is real
  (Testcontainers). Not the image pipeline’s source files already on
  `media_assets`.
