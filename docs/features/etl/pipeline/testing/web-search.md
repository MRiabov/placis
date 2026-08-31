# Web search — integration test

- **Assert**: `etl_kind=web_search` runs only when `StartRun` included it and
  there is no `place_id` or known website URL; Parallel **Search** is called
  through Vercel AI Gateway; the first discovered `place_id` or URL unblocks
  Google Maps / crawl extract in the same enqueue before Parallel finishes; this
  ETL kind is absent from Monday / Wednesday / Friday. Never Parallel Search
  HTTP from this ETL kind. Extract HTTP is crawl, not web-search. Never Exa,
  Perplexity, Tako, `:online`, OpenRouter web search.
- **Fake**: Vercel Parallel Search (Gateway).
