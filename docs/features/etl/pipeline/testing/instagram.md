# Instagram — integration test

- **Assert**: extract writes `etl.instagram_fetches`; skip when scheduled with
  no handle (`status=skipped`); transform upserts `instagram_profiles` /
  `instagram_posts` on `external_id` as responses arrive (do not wait for the
  last Instagram post); duplicate post id left alone; `algorithm=human` is not
  overwritten; extract does not write `business_profile_*`; transform does not
  call the Instagram fake.
- **Fake**: Instagram scrape. Never Graph API, Parallel’s API, Exa, Perplexity,
  Tako, `:online`, OpenRouter web search.
