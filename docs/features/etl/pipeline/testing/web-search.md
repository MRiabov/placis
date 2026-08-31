# Web search — integration test

- **Assert**: onboarding starts `etl_run_kind=web_search` when an identity input set is
  met and some identity key is still empty (Maps Find, company registry Find,
  or both). Does **not** start when `place_id`, `website_url`, Facebook URL, and
  Instagram handle are already set. Parallel **Search** is called through
  Vercel AI Gateway, seeded from the company registry record (`legal_name`,
  `company_number`, country, `registered_office`) and/or Maps `display_name`.
  A missing `place_id` or URL becomes an identity key and starts Maps / crawl
  on the same enqueue before Parallel finishes. A Find-attached `place_id` is
  not overwritten; Facebook / Instagram handles from Search still land when
  empty. This kind is absent from Monday / Wednesday / Friday. Never Parallel
  Search HTTP from this ETL run kind. Extract HTTP is crawl, not web-search. Never Exa,
  Perplexity, Tako, `:online`, OpenRouter web search.
- **Fake**: Vercel Parallel Search (Gateway).
