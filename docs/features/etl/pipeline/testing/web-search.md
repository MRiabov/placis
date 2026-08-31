# Web search — integration test

- **Assert**: onboarding `StartRun` always includes `etl_run_kind=web_search`
  for Maps Find, company registry Find, and both (does **not** skip when
  `place_id` is already set). Parallel **Search** is called through Vercel AI
  Gateway, seeded from the company registry record (`legal_name`,
  `company_number`, country, `registered_office`) and/or Maps `display_name`. A
  missing `place_id` or URL unblocks the sibling Maps / crawl run in the same
  enqueue before Parallel finishes. A Find-attached `place_id` is not
  overwritten; Facebook / Instagram handles from Search still land. This ETL
  run kind is absent from Monday / Wednesday / Friday. Never Parallel Search
  HTTP from this ETL run kind. Extract HTTP is crawl, not
  web-search. Never Exa, Perplexity, Tako, `:online`, OpenRouter web search.
- **Fake**: Vercel Parallel Search (Gateway).
