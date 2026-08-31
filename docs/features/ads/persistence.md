# Ads — persistence

Ad tables. They reference the CMS content by id — they do not copy it.
Conventions:
[persistence conventions](../../general-architecture/persistence.md)
(Postgres schema `ads`).

Referenced, not owned here: [details](../business-profile/details/persistence.md) (profile, services, reviews),
[projects](../business-profile/projects/persistence.md),
[media library](../other/media/persistence.md) (`ad_image_placements.media_asset_id`), [leads](../other/leads/persistence.md) (attribution).
LLM traces: [LLM layer](../../general-architecture/llm-layer.md) (`thread_kind=ads_generate` / `ads_inline_assistance`).
Sensitive mutations also write
[audit](../../general-architecture/audit.md).

- `ads` — `id`, `tenant_id` fk, `name`, `status` (`draft`/`ad_needs_review`/
  `ad_ready_to_post`/`archived`), `offer`, `ad_goal`
  (`more_calls`/`more_quotes`/`promote_service`), `service_focus_id` nullable
  fk, `icp_age_min`, `icp_age_max`, `icp_household` (`married_couples`/`any`),
  `icp_location_focus`, `icp_notes`, `icp_source`
  (`default`/`llm_suggested`/`owner`), `icp_review_status`, `review_status` (no
  values specified — see [Open questions](README.md#open-questions); `status` is the lifecycle), `origin`
  (`owner`/`llm`/`done_for_you`/`business_profile`), `created_by`, `updated_by`,
  `platform_refs` jsonb (ad-platform object ids; empty until ad posting),
  `platform_status` (`not_connected`/`synced`/`needs_sync`/`error`), timestamps.
  `updated_at` is the conflict token for the whole ad set: any nested write
  (variant, copy, image placement, ad lead form) bumps this column. Mutating
  APIs send `base_updated_at` ([ADR 31](ad-generation/ADR.md)). Not an undo log.
- `ad_variants` — `id`, `tenant_id` fk, `ad_id` fk (one variant per ad),
  `format` (`feed_square`/ `feed_portrait`/`carousel`/`story`), `status`
  (`draft`/`ad_needs_review`/`approved`/ `archived`), `copy_variant_id` fk,
  `review_status` (no values specified — see [Open questions](README.md#open-questions)), `platform_refs`
  jsonb, timestamps. Variant `hidden` and variant `position` were multi-format
  leftovers and are not stored. Card order for carousel lives on
  `ad_image_placements.position`.
- `ad_copy_variants` — `id`, `tenant_id` fk, `headline`, `primary_text`,
  `description` (owner-facing short label; Meta `link_data.description`),
  `cta_label` (`learn_more`/`get_quote`/`call_now`/`message`), `source`
  (`ai_proposal`/`owner_edit`/ `done_for_you_edit`/`manual`),
  `ai_generation_ref`, timestamps
- `ad_image_placements` — `id`, `tenant_id` fk, `variant_id` fk,
  `media_asset_id` fk, `format`, `crop_mode` (`full`/`rect`), `crop_x`,
  `crop_y`, `crop_width`, `crop_height` (0–1, null when `full`), `focal_x`,
  `focal_y` (0–1), `position`, `media_caption`
- `ad_lead_forms` — `id`, `tenant_id` fk, `ad_id` fk, `title`,
  `include_marketing_phone` (default true), `include_full_name`,
  `include_postcode`, `include_email`, timestamps
- `ad_reviews` — review/approval trail (actor, transition, note)
