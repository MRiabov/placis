# Facebook — integration test

- **Setup**: `tenants`. `business_profile.business_profiles` for that
  `tenant_id`. Onboarding: `facebook_page_url` is a detail, or it is not yet.
  Scheduled: no Facebook URL.
- **Exercise**: `StartRun` with `etl_run_kind=facebook`, then
  `extract/facebook.Run` then `transform/facebook.Run`.
- **Verify** (Postgres):
  - `etl.runs` for this ETL run kind when it starts.
  - Extract **persists into** `etl.facebook_fetches`; `etl.sources`.
  - Transform **persists into** `business_profile.facebook_profiles`
    (`name`, `photo_url`, `rating`, `review_count`; not fetch `raw`) /
    `business_profile.facebook_posts` on `external_id` as responses arrive (do
    not wait for the last post); duplicate post id left alone; `algorithm=human`
    is not overwritten.
  - `business_profile.business_profile_edits` +
    `business_profile.business_profile_edit_sources` when a live profile URL /
    photo increment is set; `imported_media_sources`.
  - Posts that are a past named job insert Projects after photo attach
    (`etl.sources` and `project_sources`; skip on the verdict table).
  - **Must not**: extract write `business_profile_*`; transform call
    Facebook; Facebook page-review extract into
    `business_profile.business_profile_reviews`.
- **Cases**:
  - Onboarding does not insert this run until `facebook_page_url` is a
    detail.
  - A contractor paste still starts it on the same enqueue.
  - Retry of this `run_id` does not insert a second fetch for the same
    `facebook_page_id` already landed.
- **Fail**: scheduled with no Facebook URL →
  `status=insufficient_data_for_lookup`. Onboarding with a URL detail but
  nothing left that can produce it → `insufficient_data_for_lookup`.
- **Mocked**: Facebook lookup. Never Graph API, Parallel’s API, Exa,
  Perplexity, Tako, `:online`, OpenRouter web search.

Named tables: `business_profile.business_profile_edit_sources`,
`business_profile.business_profile_edits`,
`business_profile.business_profile_reviews`,
`business_profile.business_profiles`, `etl.runs`, `imported_media_sources`.
