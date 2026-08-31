# Instagram — integration test

- **Assert**: extract writes `etl.instagram_fetches`; skip when scheduled with
  no handle (`status=skipped`); onboarding does not insert this run until
  `instagram_handle` is an identity key, then `skipped` if nothing left can
  produce it; transform upserts `instagram_profiles` / `instagram_posts` on
  `external_id` as responses arrive (do not wait for the last Instagram post);
  duplicate post id left alone; `algorithm=human` is not overwritten; extract
  does not write `business_profile_*`; transform does not call the Instagram
  fake. Posts that are a past named job insert Projects after photo
  classification (`etl.sources` + `project_sources`; skip on the verdict table).
- **Fake**: Instagram scrape. Never Graph API, Parallel’s API, Exa, Perplexity,
  Tako, `:online`, OpenRouter web search.
