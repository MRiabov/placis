# 01a — Find the business

The contractor picks a country and finds their business: a company-registry record (Companies
House / CRO / US state registry) and/or a Google Maps place. Then a single consent checkbox.

- **Persists** `onboarding_sessions`: `started_from` (`google_places`/`company_registry`), `channel`
  (`text`/`voice`), `status=created`, `token`, `clerk_user_id`, `consent_given_at`.
- **Data in**: Google Places autocomplete; registry candidate search.
