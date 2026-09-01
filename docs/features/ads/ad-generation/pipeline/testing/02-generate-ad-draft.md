# 02 — Generate ad draft (integration test)

Fills the 01 stub. Next step is 03 (after owner Review on Routes).

- **Setup**: 01 already wrote `ads` (`status=draft`), `ad_lead_forms`,
  stub `ad_variants` (`format=feed_square`). Ready + approved
  `media_assets` with media captions exist (enough for that format).
  Zero `ad_copy_variants` / `ad_image_placements`.
- **Invoke**: `POST /v1/ads/{ad_id}/generate` then the `ads_generate`
  worker (faked LLM).
- **Assert** (Postgres after 02):
  - `ad_copy_variants`: `source=ai_proposal`; headline / primary_text /
    description / `cta_label`.
  - `ad_image_placements`: `media_asset_id` in the ready+approved
    pool; crop / focal / `position`; `format` matches the stub.
  - `ad_variants`: same `id` as 01; `status=ad_needs_review`;
    `copy_variant_id` set. One row.
  - `ads.status=ad_needs_review`.
  - `ad_lead_forms.title` set (suggested).
  - `ai.threads` `thread_kind=ads_generate`; `ai_generations` has
    reasoning + output + tool calls + `prompt_id=ads_generate` /
    `prompt_version`.
  - `ai_use_ledger_entries` `entry_kind=spend` (`usage_category=text`).
  - Optional child `media_assets` for cleanup: `pending_review`,
    `parent_media_asset_id` set; source row unchanged.
  - **Must not**: `ads.status=ad_ready_to_post`.
    `ad_variants.status=approved`. Second `ad_variants` row. Gallery
    `media_asset_id` pointing at unreviewed or other-tenant items.
- **Cases**:
  - Retry generate while `ad_needs_review`: same `prompt_version`,
    same copy row.
  - After a later 03 (`ad_ready_to_post`), generate with the same
    inputs rolls `prompt_version`.
  - Carousel stub with only one ready photo: Fail; 01 rows kept.
- **Handoff to 03**: 03 Pre can SELECT copy + placements on that
  variant.
- **Fail**: empty ready pool for that format → no `ad_copy_variants` /
  `ad_image_placements`; stub `ad_variants` unchanged;
  `ads.status=draft`.
- **Mocked**: LLM. Not Postgres. Not files already in `media_assets`.
