# Web search — integration test

- **Assert**: `etl_run_kind=web_search` runs only when `StartRun` included it
  (onboarding session lacked `place_id` or `website_url`); Parallel **Search**
  is called through Vercel AI Gateway, seeded from the company registry record
  (`legal_name`, `company_number`, country, `registered_office`) and/or Maps
  `display_name`; Find with only a company registry record unblocks the sibling
  Maps / crawl run and the onboarding session in the same enqueue before
  Parallel finishes; if both keys exist by job start, this ETL run kind is
  `skipped`; this ETL run kind is absent from Monday / Wednesday / Friday.
  Never Parallel Search HTTP from this ETL run kind. Extract HTTP is crawl, not
  web-search. Never Exa, Perplexity, Tako, `:online`, OpenRouter web search.
- **Fake**: Vercel Parallel Search (Gateway).
