# 01 — Find the business (integration test)

- **Setup**: no Clerk sign-in (onboarding is unauthenticated).
- **Invoke**: search company registry (parquet) and Google Maps autocomplete for
  country `IE`; select a company registry record and/or a place; confirm online
  research consent.
- **Assert**: one `tenants` row (`status=unactivated`, `clerk_org_id` null,
  `website_prefix` null, `country=ie`); one `onboarding_sessions` row
  (`started_from`, `status=client_interviewing`, `token`,
  `online_research_consent_at`, `tenant_id` = that tenant, `clerk_user_id` null)
  and an empty `business_profiles` row with the same `tenant_id`, then company
  registry legal-identity increments (and `etl.sources`
  `source_kind=company_registry_record` when a company registry record was
  picked) and/or a Maps autocomplete `display_name` increment; **no**
  `etl.google_maps_listings` upsert and no `etl.*_fetches` from Find; the
  onboarding session `place_id` / `company_number` / `website_url` match the
  selected records; business lookup with Maps-only, registry-only, and both
  succeeds; without online research consent, business research does not start;
  lookups are debounced (no request per keystroke); opening Find with no stored
  token does not `POST` an onboarding session; a second business lookup with a
  stored token does not insert another `onboarding_sessions` row; UI lands on
  Review (`/onboarding/review`); no `website_pages` and no `website_prefix` yet.
- **Fail**: restore with a stored token and failing `GET /v1/onboarding/profile`
  keeps the token and does not `POST`.
- **Mocked**: registry parquet query and Google Maps autocomplete (fakes).
