# 01 — Create ad (integration test)

Does not enqueue generate. Next step is 02, which SELECTs the stub
`ad_variants.format`.

- **Setup**: `tenants` (`status=active`). `business_profiles` with at
  least one named service. Zero `ads` / `ad_variants` /
  `ad_lead_forms` / `ad_copy_variants` / `ad_image_placements` /
  `ad_reviews`. No `ai.threads` / `ai_generations` for ads. Schema
  `jobs`: no `ads_generate`.
- **Exercise**: `POST /v1/ads` (`CreateAd`). Request `AdCreate` with
  `format=feed_square` and lead-form include flags.
- **Verify** (Postgres after 01, **before** 02 runs):
  - `ads`: one row, `status=draft`, `ad_goal`, ideal customer profile
    columns, `origin`, `platform_status=not_connected`, `platform_refs`
    empty.
  - `ad_lead_forms`: one row, include flags, `title` empty.
  - `ad_variants`: one row, `ad_id` of that ad, `format=feed_square`,
    `status=draft`, `copy_variant_id` null.
  - **Must not**: `ad_copy_variants`, `ad_image_placements`,
    `ad_reviews` empty. `ai.threads` / `ai_generations` empty for this
    step. No `ads_generate` job.
- **Cases**:
  - Omit ideal customer profile: `icp_household=married_couples`,
    `icp_age_min=30`, `icp_age_max=40`, `icp_source=default`.
  - `PATCH /v1/ads/{ad_id}` changes `format` on the same stub row; row
    count stays 1.
  - Same `tenant_id` second `POST /v1/ads` inserts a second ad, not a
    second variant on the first.
- **Handoff to 02**: 02 Pre can SELECT this `ad_variants.format`.
- **Fail**: missing `format` → 400; zero `ads` / `ad_variants` /
  `ad_lead_forms`.
- **Mocked**: nothing (no LLM).
