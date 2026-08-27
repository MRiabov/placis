# Website crawl — integration test

- **Assert**: onboarding `StartRun` with `website_crawl` writes `etl.website_crawl_fetches` (fast
  crawl URL first, then slow crawl URLs as they arrive) and live profile increments (trade / services /
  service area) after the first URL **before** slow crawl finishes; a Monday / Wednesday / Friday
  `StartRun` does not include this kind; extract does not write the live business profile; transform does not call
  the crawl fake; retry does not refetch a URL that already has a fetch on this run.
- **Fake**: crawl / directory. Never Parallel’s API, Exa, Perplexity, Tako, `:online`, OpenRouter
  web search.
