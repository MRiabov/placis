# Build the profile (integration test)

- **Setup**: 01 created the profile; 02 and 04a write concurrently.
- **Exercise**: overlapping research increment and contractor edit on different
  fields; disagreeing values on the same field; registry then Maps on legal
  identity.
- **Verify**: both distinct-field increments persist; same-field disagreement →
  `conflict` and the live profile column **is not updated**; contractor edit
  sets `algorithm=human` and later ETL does not overwrite it; registry beats
  Maps for legal identity; no silent overwrite; `last_edit_id` advances;
  complete sets `accepted_edit_id`; later ETL transform writes do not mutate the
  accepted live business profile in place; no `checklist_rows` table. Optional
  `photos` key (complete does not require photos; no photos-fill job). Optional
  `projects` key; ranked top 4 by cover then text length for client interview
  (not baked into website 02 gallery slots). `vat_number` required only if
  `vat_registration_status` is set; not-registered leaves `vat_number` null
  (never `"no vat number"`). After ETL fast extract has written
  `in_pool` reviews: schema `jobs` has one River job
  `reviews_ranking_for_display` unique on this `tenant_id`. After invoke:
  `is_top` / `top_position` replaced on
  `business_profile.business_profile_review_rankings`; `ai.threads`
  `thread_kind=reviews_ranking_for_display`; `ai_generations`
  `prompt_id=reviews_ranking_for_display` with `input` / `internal_reasoning` /
  `output`; latest ranking batch `provisional=true` while overlapping ETL is
  still running. Duplicate enqueue while that job is pending/running: still one
  job (River unique conflict). Owner PATCH of **top reviews** is
  `algorithm=human` and `provisional=false` and a later
  `reviews_ranking_for_display` does not overwrite those pins. When the last
  overlapping ETL run for this enqueue finishes with extra `in_pool` rows:
  another `reviews_ranking_for_display` (first already completed);
  `provisional=false`. No extra rows: no second generate; insert a copy of the
  latest batch with `provisional=false`. ETL transform does not enqueue this
  job.
- **Fail**: writer error leaves other writers’ increments intact.
- **Mocked**: ranking LLM for `reviews_ranking_for_display` (faked
  `review_ids[]`). Real Postgres.

Named tables: `business_profile.project_sources`,
`business_profile.business_profile_edit_sources`,
`business_profile.business_profile_edits`,
`business_profile.business_profile_opening_hours`,
`business_profile.business_profile_review_rankings`,
`business_profile.business_profile_reviews`,
`business_profile.business_profile_service_areas`,
`business_profile.business_profile_services`,
`business_profile.business_profiles`, `etl.google_maps_listings`, `etl.runs`,
`business_profile.facebook_posts`, `business_profile.facebook_profiles`,
`business_profile.instagram_posts`, `business_profile.instagram_profiles`.
