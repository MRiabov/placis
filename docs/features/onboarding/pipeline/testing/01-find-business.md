# 01 — Find the business (integration test)

- **Setup**: no Clerk sign-in (onboarding is unauthenticated).
- **Exercise**: `POST /v1/onboarding/business-lookup` with country `IE`;
  company registry record and/or a place; online research consent.
  Also: Maps-only, registry-only, and both. Also: a second lookup with
  the stored token (same attach keys, then different keys).
- **Verify**: one `tenants` row (`status=unactivated`, `clerk_org_id`
  null, `country=ie`); one `onboarding_sessions`
  row (`status=client_interviewing`, `token`,
  `online_research_consent_at`,
  `tenant_id` = that tenant,
  `clerk_user_id` null) and an empty
  `business_profile.business_profiles` row with the same `tenant_id`,
  then company registry legal-identity increments (and `etl.sources`
  `source_kind=company_registry_record` when a company registry record
  was picked) and/or a Maps autocomplete `display_name` increment;
  **no** `etl.google_maps_listings` upsert and no `etl.*_fetches` from
  Find; the onboarding session `place_id` / `company_number` /
  `website_url` match the selected records; without online research
  consent, business research does not start; a second business lookup
  with a stored token does not insert another `onboarding_sessions`
  row; same attach keys leave one `enqueue_id` and do not wipe;
  different keys re-init the live profile to this pick; no
  `website_pages` and no `websites` row.
- **Fail**: missing consent or missing both sources → 4xx; no tenant,
  no onboarding session. Unknown onboarding session token → **401**; no tenant.
  Sixth **different**-keys lookup in 30 minutes → `429`
  `onboarding_enqueue_cap`; no wipe. Restore with a stored
  token and failing `GET /v1/onboarding/profile` keeps the token and
  does not `POST`.
- **Mocked**: registry parquet query and Google Maps autocomplete
  (fakes).
