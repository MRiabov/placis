# Facebook — integration test

- **Assert**: extract writes `etl.facebook_fetches`; skip when scheduled with no
  Facebook page URL / handle (`status=skipped`); transform upserts
  `facebook_profiles` / `facebook_posts` on `external_id` as responses arrive
  (do not wait for the last post); duplicate post id left alone;
  `algorithm=human` is not overwritten; extract does not write
  `business_profile_*`; transform does not call the Facebook fake.
- **Fake**: Facebook lookup. Never Graph API, Parallel’s API, Exa, Perplexity,
  Tako, `:online`, OpenRouter web search.
