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
  `projects` key; ranked top 4 by cover then text length for client interview
  (not baked into website 02 gallery slots). After ETL fast extract has
  written `in_pool` reviews: schema `jobs` has one River job
  `reviews_ranking_for_display` unique on this `tenant_id`. After invoke:
  `is_top` / `top_position` replaced; `ai.threads`
  `thread_kind=reviews_ranking_for_display`; `ai_generations`
  `prompt_id=reviews_ranking_for_display` with `input` /
  `internal_reasoning` / `output`;
  `business_profiles.top_reviews_provisional=true` while overlapping ETL
  is still running. Duplicate enqueue while that job is
  pending/running: still one job (River unique conflict). Owner PATCH of
  **top reviews** is `algorithm=human` and
  `top_reviews_provisional=false` and a later
  `reviews_ranking_for_display` does not overwrite those pins. When the
  last overlapping ETL run for this enqueue finishes with extra `in_pool`
  rows: another `reviews_ranking_for_display` (first already completed);
  `top_reviews_provisional=false`. No extra rows: no second generate;
  same pins; `top_reviews_provisional=false`. ETL transform
  does not enqueue this job.
- **Fail**: writer error leaves other writers’ increments intact.
- **Mocked**: ranking LLM for `reviews_ranking_for_display` (faked
  `review_ids[]`). Real Postgres.

Named tables: `business_profile.project_sources`,
`business_profile_edit_sources`, `business_profile_edits`,
`business_profile_opening_hours`, `business_profile_reviews`,
`business_profile_service_areas`, `business_profile_services`,
`business_profiles`, `etl.google_maps_listings`, `etl.runs`, `facebook_posts`,
`facebook_profiles`, `instagram_posts`, `instagram_profiles`.
