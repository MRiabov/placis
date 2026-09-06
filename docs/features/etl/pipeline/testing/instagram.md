# Instagram — integration test

- **Setup**: `tenants`. `business_profile.business_profiles` for that
  `tenant_id`. Onboarding: `instagram_handle` is a detail, or it is not yet.
  Scheduled: no handle.
- **Exercise**: `StartRun` with `etl_run_kind=instagram`, then
  `extract/instagram.Run` then `transform/instagram.Run`.
- **Verify** (Postgres):
  - `etl.runs` for this ETL run kind when it starts.
  - Extract **persists into** `etl.instagram_fetches`; `etl.sources`.
  - Transform **persists into** `business_profile.instagram_profiles`
    (`name`, `photo_url`; not fetch `raw`; no `rating` /
    `review_count`) /
    `business_profile.instagram_posts` on `external_id` as responses arrive (do
    not wait for the last Instagram post); duplicate post id left alone;
    `algorithm=human` is not overwritten.
  - Media library items + `imported_media_sources`.
  - Posts that are a past named job insert Projects after photo attach
    (`etl.sources` and `project_sources`; skip on the verdict table).
  - **Must not**: extract write `business_profile_*`; transform call
    Instagram.
- **Cases**:
  - Onboarding does not insert this run until `instagram_handle` is a
    detail.
- **Fail**: scheduled with no handle →
  `status=insufficient_data_for_lookup`. Onboarding with a handle detail
  but nothing left that can produce it → `insufficient_data_for_lookup`.
- **Mocked**: Instagram scrape. Never Graph API, Parallel’s API, Exa,
  Perplexity, Tako, `:online`, OpenRouter web search.

Named tables: `business_profile.business_profiles`, `etl.runs`,
`imported_media_sources`.
