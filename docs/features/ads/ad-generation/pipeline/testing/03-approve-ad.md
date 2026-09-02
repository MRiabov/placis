# 03 — Approve ad (integration test)

Checkpoint only. Review PATCH / rewrite are not this invoke.

- **Setup**: 02 already wrote `ads` (`status=ad_needs_review`),
  `ad_variants` (`status=ad_needs_review`), `ad_copy_variants`,
  `ad_image_placements` on uploaded `media_assets` (`file_id` set, not
  `failed`), `ad_lead_forms`. Zero `ad_reviews` for this ad.
- **Exercise**: `POST /v1/ads/{ad_id}/approve` (`ApproveAd`).
- **Verify**:
  - `ads.status=ad_ready_to_post`.
  - `ad_variants.status=approved`. Same `ad_variants` id as 01/02.
  - `ad_reviews`: one row, transition to `ad_ready_to_post`.
  - `audit_events` for this approve.
  - `media_assets.review_status=approved` for `pending_review`
    placements (`ApproveMediaAsset`).
  - `ad_copy_variants` / `ad_image_placements` / `ad_lead_forms`
    unchanged except `ads.updated_at`.
- **Cases**:
  - Upload still `uploading` → 400; `ads.status` still
    `ad_needs_review`; no `ad_reviews` row.
  - Owner-added photo without a media caption, `file_id` set →
    approve succeeds.
  - `base_updated_at` mismatch → `409`; no `ad_reviews`.
- **Handoff to 04**: 04 Pre can SELECT `ads.status=ad_ready_to_post`.
- **Fail**: over-limit headline → 400; no status change.
- **Mocked**: nothing (no LLM). `media_assets` already uploaded.
