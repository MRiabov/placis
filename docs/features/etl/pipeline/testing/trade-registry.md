# Trade registry — integration test

- **Assert**: onboarding starts `trade_registry` when `company_number` + country
  **or** `display_name` + country is an identity key (Maps-only Find too).
  Lookup uses `company_number` + tenant country when a company registry record
  is attached, else `display_name` + country. Writes
  `etl.trade_registry_fetches`, `etl.sources` `source_kind=trade_registry_record`, and
  accreditation increments with `business_profile_edit_sources`; a Monday /
  Wednesday / Friday `StartRun` does not include this ETL run kind; crawl cannot
  overwrite a trade-registry accreditation.
- **Fake**: trade registry. Never Parallel’s API, Exa, Perplexity, Tako,
  `:online`, OpenRouter web search.
