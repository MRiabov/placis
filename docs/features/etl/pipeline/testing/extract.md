# Extract — integration test

- **Assert**: `StartRun` inserts one `etl.runs` row per kind; extract writes an append-only fetch
  with typed metadata + `raw`; retry of the same `run_id` does not insert a second fetch;
  `trigger=scheduled` inserts a new fetch even when an older fetch exists; extract does not write
  `business_profile_*`.
- **Fake**: Maps / Facebook / Instagram / crawl. Never Parallel’s API, Exa, Perplexity, Tako,
  `:online`, OpenRouter web search.
