# Ads — data model

Ad tables. They reference the CMS content by id — they do not copy it. Conventions:
[data-model conventions](../../general-architecture/data-model.md).

Referenced, not owned here: [details](../other/details/data-model.md) (profile, services, reviews),
[media library](../other/media/data-model.md) (`ad_image_placements.media_asset_id`),
[leads](../other/leads/data-model.md) (attribution). LLM traces:
[LLM layer](../../general-architecture/llm-layer.md). Sensitive mutations also write
[audit](../../general-architecture/audit.md).

- `ads` — `id`, `tenant_id` fk, `name`, `status` (`draft`/`ad_needs_review`/
  `ad_ready_to_post`/`archived`), `offer`, `ad_goal` (`more_calls`/`more_quotes`/`promote_service`),
  `service_focus_id` nullable fk,
  `icp_age_min`, `icp_age_max`, `icp_household` (`married_couples`/`any`), `icp_location_focus`,
  `icp_notes`, `icp_source` (`default`/`llm_suggested`/`owner`), `icp_review_status`,
  `review_status`, `origin` (`owner`/`llm`/`done_for_you`/`business_profile`), `created_by`,
  `updated_by`, `platform_refs` jsonb (ad-platform object ids; empty until ad posting),
  `platform_status` (`not_connected`/`synced`/`needs_sync`/`error`), timestamps
- `ad_variants` — `id`, `tenant_id` fk, `ad_id` fk, `format` (`feed_square`/
  `feed_portrait`/`carousel`/`story`), `status` (`draft`/`ad_needs_review`/`approved`/`hidden`/
  `archived`), `copy_variant_id` fk, `position`, `review_status`,
  `platform_refs` jsonb, timestamps
- `ad_copy_variants` — `id`, `tenant_id` fk, `headline`, `primary_text`, `description`, `cta_label`
  (`learn_more`/`get_quote`/`call_now`/`message`), `source` (`ai_proposal`/`owner_edit`/
  `done_for_you_edit`/`manual`), `ai_generation_ref`, timestamps
- `ad_image_placements` — `id`, `tenant_id` fk, `variant_id` fk, `media_asset_id` fk, `format`,
  `crop_mode` (`full`/`rect`), `crop_x`, `crop_y`, `crop_width`, `crop_height` (0–1, null when
  `full`), `focal_x`, `focal_y` (0–1), `position`, `media_caption`
- `ad_lead_forms` — `id`, `tenant_id` fk, `ad_id` fk, `title`,
  `include_marketing_phone` (default true), `include_full_name`, `include_postcode`,
  `include_email`, timestamps
- `ad_reviews` — review/approval trail (actor, transition, note)
