# 01a — Find the business (integration test)

- **Setup**: no Clerk sign-in (onboarding is unauthenticated).
- **Invoke**: search registry (parquet) and Google Maps autocomplete for country `IE`; select a
  company registry record and/or a place; confirm online research consent.
- **Assert**: one `onboarding_sessions` row (`started_from`, `status=interviewing`, `token`,
  `consent_given_at`, `tenant_id` null, `clerk_user_id` null) and a `business_profiles` shell;
  confirm with Maps-only, registry-only, and both succeeds; without online research consent,
  business research does not start; lookups are debounced (no request per keystroke); no
  `website_pages` and no `website_previews` yet.
- **Mocked**: registry parquet query and Google Places autocomplete (fakes).
