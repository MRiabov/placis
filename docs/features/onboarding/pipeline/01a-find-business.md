# 01a — Find the business

The contractor picks a country and finds their business: a company-registry record (Companies
House / CRO / US state registry) and/or a Google Maps place. Then a single consent checkbox.

- **Persists** `onboarding_sessions`: `started_from` (`google_places`/`company_registry`), `channel`
  (`text`/`voice`), `status=created`, `token`, `clerk_user_id`, `consent_given_at`.
- **Data in**: registry search against the **offline parquet copy** of the registry (Companies
  House / CRO; queried at runtime — Go reads parquet, the `polars` equivalent); Google Places
  autocomplete. Both lookups are **debounced** (backoff) so a keystroke doesn't hit the backend.
