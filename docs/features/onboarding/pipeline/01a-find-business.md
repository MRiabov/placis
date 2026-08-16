# 01a — Find the business

The contractor picks a country and finds their business. Two debounced lookups, one consent
checkbox.

- **Registry search** — search the **offline parquet copy** of the registry (Companies House / CRO /
  US state registry), selectable legal records; queried at runtime (Go reads parquet — the `polars`
  equivalent). **Debounced** so a keystroke doesn't hit the backend.
- **Google Maps** — autocomplete + place picker; **debounced** the same way.
- **Consent** — a single checkbox: "I agree that Placis can collect public information about this
  business to prepare the website preview."

- **Persists** `onboarding_sessions` (`started_from`, `channel`, `status=created`, `token`,
  `consent_given_at`), plus the initialized `business_profiles` shell.
