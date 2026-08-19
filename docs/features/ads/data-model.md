# Ads — data model

Ad tables. They reference The CMS content by id — they do not copy it. Conventions:
[data-model conventions](../../general-architecture/data-model.md).

Referenced, not owned here: [details](../other/details/data-model.md) (profile, services),
[media](../other/media/data-model.md) (`ad_image_placements.media_asset_id`),
[website](../website/data-model.md) (`destination_website_page_id`),
[leads](../other/leads/data-model.md) (attribution). LLM traces:
[LLM layer](../../general-architecture/llm-layer.md). Sensitive mutations also write
[audit](../../general-architecture/audit.md).

- `ads` — `id`, `tenant_id` fk, `name`, `status` (`draft`/`ad_needs_review`/
  `ad_ready_to_post`/`archived`), `offer`, `ad_goal` (`more_calls`/`more_quotes`/`promote_service`),
  `service_focus_id` nullable fk, `destination_website_page_id` nullable fk,
  `destination_website_page_path`,
  `ideal_customer_profile` jsonb, `review_status`, `source_refs` jsonb, `created_by`,
  `updated_by`, `platform_refs` jsonb, `platform_status` (`not_connected`/`synced`/`needs_sync`/
  `error`), timestamps
- `ad_variants` — `id`, `tenant_id` fk, `ad_id` fk, `format` (`feed_square`/
  `feed_portrait`/`carousel`/`story`), `status` (`draft`/`ad_needs_review`/`approved`/`hidden`/
  `archived`), `copy_variant_id` fk, `position`, `review_status`, `platform_refs` jsonb, timestamps
- `ad_copy_variants` — `id`, `tenant_id` fk, `headline`, `primary_text`, `description`, `cta_label`
  (`learn_more`/`get_quote`/`call_now`/`message`), `source` (`ai_proposal`/`owner_edit`/
  `done_for_you_edit`/`manual`), `ai_generation_ref`, timestamps
- `ad_image_placements` — `id`, `tenant_id` fk, `variant_id` fk, `media_asset_id` fk, `format`,
  `crop` jsonb, `focal_point` jsonb, `position`, `media_caption`
- `ad_lead_forms` — `id`, `tenant_id` fk, `ad_id` fk, `title`, `questions` jsonb,
  timestamps
- `ad_reviews` — review/approval trail (actor, transition, note)
