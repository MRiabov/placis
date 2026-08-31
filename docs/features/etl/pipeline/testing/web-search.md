# Web search — integration test

- **Assert**: `etl_run_kind=web_search` runs only when `StartRun` included it
  (onboarding session lacked `place_id` or `website_url`); Parallel **Search**
  is called through
  Vercel AI Gateway; the first discovered `place_id` or URL is written onto the
  sibling Maps / crawl run and the onboarding session and unblocks extract in
  the same enqueue before Parallel finishes; if both keys exist by job start,
  this ETL run kind is `skipped`; this ETL run kind is absent from Monday / Wednesday / Friday.
  Never Parallel Search HTTP from this ETL run kind. Extract HTTP is crawl, not
  web-search. Never Exa, Perplexity, Tako, `:online`, OpenRouter web search.
- **Fake**: Vercel Parallel Search (Gateway).
