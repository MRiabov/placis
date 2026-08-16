# 01a — Find the business (integration test)

- **Setup**: a Clerk testing token resolves a `Principal`.
- **Invoke**: search the registry (parquet) and Google Maps autocomplete, then select a record and
  confirm consent.
- **Assert**: one `onboarding_sessions` row (`started_from`, `status=created`, `consent_given_at`
  set) and an initialized `business_profiles` shell; lookups are debounced (no request per
  keystroke).
- **Mocked**: registry parquet query and Google Places autocomplete (fakes).
