# Ads — persistence

Ad tables. They reference the CMS content by id — they do not copy it.
Conventions:
[persistence conventions](../../general-architecture/persistence.md)
(Postgres schema `ads`). Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).

Referenced, not owned here:
[details](../business-profile/details/persistence.md) (profile, services,
reviews), [projects](../business-profile/projects/persistence.md),
[media library](../other/media/persistence.md)
(`ad_image_placements.media_asset_id`),
[leads](../other/leads/persistence.md) (attribution). LLM traces:
[AI layer](../../general-architecture/ai-layer.md)
(`thread_kind=ads_generate` / `ads_inline_assistance`). Sensitive
mutations also write [audit](../../general-architecture/audit.md).

## Tables

### `ads`

- **Columns:** `id`, `tenant_id` fk, `name`, `status`, `offer`,
  `ad_goal`, `service_focus_id` nullable fk, `icp_age_min`, `icp_age_max`,
  `icp_household`, `icp_location_focus`, `icp_notes`, `icp_source`,
  `icp_review_status`, `review_status`, `origin`, `created_by`,
  `updated_by`, `platform_refs` jsonb, `platform_status`, timestamps
- **Enums:** `status` → `draft` / `ad_needs_review` /
  `ad_ready_to_post` / `archived`; `ad_goal` → `more_calls` /
  `more_quotes` / `promote_service`; `icp_household` →
  `married_couples` / `any`; `icp_source` → `default` /
  `llm_suggested` / `owner`; `origin` → `owner` / `llm` /
  `done_for_you` / `business_profile`; `platform_status` →
  `not_connected` / `synced` / `needs_sync` / `error`
- **Uniques:** `id`
- **Written by:** `CreateAd`; `UpdateAd`
  (`PATCH /v1/ads/{ad_id}`); `GenerateAdDraft` (`status`);
  `ApproveAd`; `ArchiveAd`; `UnarchiveAd`; `DeleteAd` (ad draft
  only)
- **Notes:** `updated_at` is the conflict token for the whole ad set.
  Nested writes bump it. Mutating APIs send `base_updated_at`
  ([ADR 31](ad-generation/ADR.md)). Not an undo log. Omit
  `platform_refs` from first-slice DTOs.

### Ideal customer profile defaults

Default is married couples aged 30–40 (`icp_household=married_couples`,
`icp_age_min=30`, `icp_age_max=40`). Loose by design — steers generation
now; precise targeting comes with ad posting. `icp_review_status` has no
closed values yet; an LLM suggestion is reviewable and never
auto-publishes. `review_status` has no values specified — see
[Open questions](README.md#open-questions); `status` is the lifecycle.
The picker is deferred ([ADR 40](ad-generation/ADR.md)): look displays
**"Married couples, 35–45"** as read-only copy; stored columns stay
this 30–40 default. No `audiences` table. No `audience_id` on `ads`.

### Pickers and their sources

- **No `offers` or `locations` table** — `offer` is a free-text string
  on `ads`. Location is per-ad `icp_location_focus`, not a collection.
  Location suggestions come from `business_profile_service_areas`
  (`GET /v1/business-profile`). Typed text that is not a service area
  writes `icp_location_focus` only; it does not insert a service area.
- **`service_focus_id`** is the FK to `business_profile_services`.
- Ideal customer profile stays the inline `icp_*` columns on `ads`
  (issue 17). Do not add an audiences collection until product decides
  the owner should pick one.

### `ad_variants`

- **Columns:** `id`, `tenant_id` fk, `ad_id` fk, `format`, `status`,
  `copy_variant_id` nullable fk, `review_status`, `platform_refs` jsonb,
  timestamps
- **Enums:** `format` → `feed_square` / `feed_portrait` / `carousel` /
  `story`; `status` → `draft` / `ad_needs_review` / `approved` /
  `archived`
- **Uniques:** `ad_id` (one variant per ad)
- **Written by:** `CreateAd` (stub: `format`, `status=draft`);
  `GenerateAdDraft`; `UpdateAdVariant`; `ApproveAd`
- **Notes:** Variant `hidden` and variant `position` were multi-format
  leftovers and are not stored. Card order for carousel lives on
  `ad_image_placements.position`. `review_status` — see
  [Open questions](README.md#open-questions). Omit `platform_refs` from
  first-slice DTOs.

### One format per ad

`feed_square` and `feed_portrait` hold exactly one image placement.
`carousel` holds 2–10 square placements in `position` order. `story`
holds exactly one 9:16 placement and shorter overlay copy. Multi-frame
story sequences are out of scope. Changing format after generate
regenerates this ad on the same row; it does not insert a second
variant.

### `ad_copy_variants`

- **Columns:** `id`, `tenant_id` fk, `headline`, `primary_text`,
  `description`, `cta_label`, `source`, `ai_generation_ref` nullable,
  timestamps
- **Enums:** `cta_label` → `learn_more` / `get_quote` / `call_now` /
  `message`; `source` → `ai_proposal` / `owner_edit` /
  `done_for_you_edit` / `manual`
- **Written by:** `GenerateAdDraft`; `UpdateAd` / `UpdateAdVariant`;
  `RewriteAdCopy`
- **Notes:** `description` is the owner-facing short label (Meta
  `link_data.description`). Limits live in one constants module:
  headline 40, primary_text 5000, description 30. Not DTO `minLength`.

### `ad_image_placements`

- **Columns:** `id`, `tenant_id` fk, `variant_id` fk, `media_asset_id`
  fk, `format`, `crop_mode`, `crop_x`, `crop_y`, `crop_width`,
  `crop_height` (0–1, null when `full`), `focal_x`, `focal_y` (0–1),
  `position`, `media_caption`
- **Enums:** `format` → same as `ad_variants.format`; `crop_mode` →
  `full` / `rect`
- **Written by:** `GenerateAdDraft`; `UpdateAdVariant`
  (`PATCH /v1/ads/{ad_id}/variants/{variant_id}`)
- **Notes:** Crops are non-destructive. The source media asset is never
  modified. Light cleanup inserts a media-library child, then this row
  points at the copy.

### `ad_lead_forms`

- **Columns:** `id`, `tenant_id` fk, `ad_id` fk, `title`,
  `include_marketing_phone`, `include_full_name`, `include_postcode`,
  `include_email`, timestamps
- **Uniques:** `ad_id`
- **Written by:** `CreateAd` (include flags; `title` empty);
  `GenerateAdDraft` (suggested `title`); `UpdateAd` (Review `title` and
  include flags)
- **Notes:** Suggestions never block approval. Privacy notice is
  finalized at ad posting. Marketing phone defaults true.

### `ad_reviews`

- **Columns:** `id`, `tenant_id` fk, `ad_id` fk, `actor`, `transition`,
  `note` nullable, timestamps
- **Written by:** `ApproveAd`; `ArchiveAd`; `UnarchiveAd`
- **Notes:** Review/approval trail. Not `review_status` on `ads`.

## Indexes

Lookup: `(tenant_id, status, updated_at)` on `ads`. Unique:
`ad_variants.ad_id`, `ad_lead_forms.ad_id`.
