# 01 — Find the business (integration test)

- **Setup**: no Clerk sign-in (onboarding is unauthenticated).
- **Exercise**: `POST /v1/onboarding/business-lookup` with country `IE`;
  company registry record and/or a place; online research consent.
  Also: Maps-only, registry-only, and both. Also: a second lookup with
  the stored token.
- **Verify**: one `tenants` row (`status=unactivated`, `clerk_org_id`
  null, `website_prefix` null, `country=ie`); one `onboarding_sessions`
  row (`started_from`, `status=client_interviewing`, `token`,
  `browser_safety_session_id`, `online_research_consent_at`,
  `tenant_id` = that tenant,
  `clerk_user_id` null) and an empty `business_profiles` row with the
  same `tenant_id`, then company registry legal-identity increments
  (and `etl.sources` `source_kind=company_registry_record` when a
  company registry record was picked) and/or a Maps autocomplete
  `display_name` increment; **no** `etl.google_maps_listings` upsert
  and no `etl.*_fetches` from Find; the onboarding session `place_id` /
  `company_number` / `website_url` match the selected records;
  without online research consent, business research does not start; a
  second business lookup with a stored token does not insert another
  `onboarding_sessions` row; no `website_pages` and no
  `website_prefix` yet.
- **Fail**: missing consent, missing both sources, or missing
  `browser_safety_session_id` → 4xx; no tenant, no onboarding session.
  Sixth lookup in 30 minutes with the same `browser_safety_session_id`
  → `429` `browser_safety_cap`; no sixth tenant. Restore with a stored
  token and failing `GET /v1/onboarding/profile` keeps the token and
  does not `POST`.
- **Mocked**: registry parquet query and Google Maps autocomplete
  (fakes).
