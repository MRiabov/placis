# Trade registry — integration test

- **Assert**: onboarding `StartRun` with `trade_registry` writes `etl.trade_registry_fetches` and
  accreditation increments; a Monday / Wednesday / Friday `StartRun` does not include this kind;
  crawl cannot overwrite a trade-registry accreditation.
- **Fake**: trade registry. Never Parallel’s API, Exa, Perplexity, Tako, `:online`, OpenRouter web
  search.
