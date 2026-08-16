# 01a — Find the business (integration test)

- **Setup**: a Clerk testing token resolves a `Principal` with a tenant.
- **Invoke**: `POST /api/v1/onboarding-sessions` with a registry candidate / Google place.
- **Assert**: one `onboarding_sessions` row — `started_from` set, `status=created`, `consent_given_at`
  null; `google_places_cache` not yet written.
- **Mocked**: registry lookup and Google Places autocomplete (return fixtures).
