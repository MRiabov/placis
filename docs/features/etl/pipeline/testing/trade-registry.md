# Trade registry — integration test

- **Setup**: `tenants`. `business_profile.business_profiles` for that
  `tenant_id`. Onboarding: `company_number` + country **or** `display_name` +
  country is a detail (Maps-only Find too). A company registry record may be
  attached. Scheduled: this ETL run kind is not in the Monday / Wednesday /
  Friday set.
- **Exercise**: `StartRun` with `etl_run_kind=trade_registry`, then
  `extract/traderegistry.Run` then `transform/traderegistry.Run`.
- **Verify** (Postgres):
  - `etl.runs`. Lookup uses `company_number` + tenant country when a
    company registry record is attached, else `display_name` + country.
  - Extract **persists into** `etl.trade_registry_fetches`
    (`trade_registry_record_id`); `etl.sources`
    `source_kind=trade_registry_record`.
  - Transform **persists into** accreditation increments with
    `business_profile.business_profile_edits` +
    `business_profile.business_profile_edit_sources`.
  - **Must not**: crawl overwrite a trade-registry accreditation.
- **Cases**:
  - A Monday / Wednesday / Friday `StartRun` does not include this ETL
    run kind.
- **Fail**: retryable. Prior live business profile stays.
  `status=error` when retries exhaust.
- **Mocked**: trade registry. Never Parallel’s API, Exa, Perplexity,
  Tako, `:online`, OpenRouter web search.

Named tables: `business_profile.business_profile_edits`,
`business_profile.business_profiles`, `etl.runs`.
