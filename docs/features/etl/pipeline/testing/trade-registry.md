# Trade registry — integration test

- **Assert**: onboarding `StartRun` with `trade_registry` writes
  `etl.trade_registry_fetches`, `etl.sources`
  `source_kind=trade_registry_record`, and accreditation increments with
  `business_profile_edit_sources`; a Monday / Wednesday / Friday `StartRun` does
  not include this ETL run kind; crawl cannot overwrite a trade-registry
  accreditation.
- **Fake**: trade registry. Never Parallel’s API, Exa, Perplexity, Tako,
  `:online`, OpenRouter web search.
