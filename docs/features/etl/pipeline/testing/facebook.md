# Facebook — integration test

- **Assert**: extract writes `etl.facebook_fetches`; skip when scheduled with no
  Facebook page URL (`status=insufficient_data_for_lookup`); onboarding does
  not insert this run until `facebook_page_url` is a detail, then
  `insufficient_data_for_lookup` if nothing
  left can produce it; a contractor paste still starts it on the same enqueue;
  transform upserts `facebook_profiles` / `facebook_posts` on `external_id` as
  responses arrive (do not wait for the last post); duplicate post id left
  alone; `algorithm=human` is not overwritten; extract does not write
  `business_profile_*`; transform does not call the Facebook fake. Posts that
  are a past named job insert Projects after photo classification (`etl.sources`
  - `project_sources`; skip on the verdict table). No Facebook page-review
  extract.
- **Fake**: Facebook lookup. Never Graph API, Parallel’s API, Exa, Perplexity,
  Tako, `:online`, OpenRouter web search.
