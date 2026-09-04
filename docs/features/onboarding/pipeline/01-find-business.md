# 01 — Find the business

Unauthenticated. Country (Ireland / United Kingdom / United States; default
Ireland), find the business, online research consent. Business lookup creates an
unactivated tenant and the onboarding session, then returns immediately.
Business research (02) starts in the background. UI lands on Review (03).

## Trigger

Contractor submits business lookup on `/onboarding/find`
(`POST /v1/onboarding/business-lookup`) when this browser has no stored
token.

## Pre

- No stored onboarding session token, or restore already failed the “must not
  POST” path (see Resume).
- Country selected. At least one of: company registry record, Google Maps place.
- Online research consent checkbox on.
- `browser_safety_session_id` on the body (UUID the browser creates once).

## Must not

- `POST` an onboarding session on Find mount, on keystroke, or when a token is
  already stored.
- Select or copy the website template, create a website preview, or wait for 02.
- Insert a second tenant or a second onboarding session for the same browser
  token.
- Start 02 without `online_research_consent_at`.
- Upsert `etl.google_maps_listings` or insert `etl.*_fetches` (those are ETL
  extract). Maps autocomplete is a search Read, not a Details extract.

## Do

`LookupBusiness` counts `onboarding_sessions` with this
`browser_safety_session_id` and `created_at > now() - 30 minutes`
first: five already → Fail (`429` `browser_safety_cap`). Else it
inserts the unactivated tenant and onboarding session, then returns
immediately.

1. Insert [unactivated tenant](../../other/auth/persistence.md):
   `tenants.status=unactivated`, `clerk_org_id`
   null, `name` = known legal/display name or empty,
   `country` = Find country (`ie` / `gb` / `us`).
2. Insert `onboarding_sessions`: `status=created` then immediately
   `client_interviewing`; unique `token`; `tenant_id` that tenant;
   `clerk_user_id` null; `channel` unset; `started_from` =
   `company_registry` / `google_maps_listing` / both via sources;
   `browser_safety_session_id` from the body; typed attach keys from the
   selected records (`place_id`, `company_number`, `website_url` — all
   nullable).
3. Record `online_research_consent_at`.
4. Persist the selected company registry record and/or attach the Maps place on
   **this** onboarding session (those typed keys). Wrong company is not a new
   run: attach or change sources on the same row (`PUT /v1/onboarding/sources`).
5. Initialize [business profile](../../business-profile/details/persistence.md): `business_profiles` with that `tenant_id`,
   empty/unknown details, `last_edit_id` and `accepted_edit_id` null. Then
   increments via [build-profile](build-profile.md): registry fills legal identity (insert
   `etl.sources` `source_kind=company_registry_record` and cite it); Maps
   autocomplete Read may fill `display_name` (no listing upsert, no fetch row).
   Both: registry wins legal identity. Contact fields that Details will confirm
   (marketing phone, hours, website) wait for 02.
6. Enqueue 02 (per-tenant StartRun cap is a silent skip; a first lookup
   never hits it). Attaching or changing sources on this onboarding
   session later is a new `StartRun` (same silent cap).

Lookups are debounced (no request per keystroke). Country is a search parameter
**and** is persisted on `tenants.country` (Voice region fallback after website
activation). Not an onboarding session column. Navigate UI to Review
(`/onboarding/review`) after a successful lookup.

## Persist

`tenants` (`status=unactivated`, `country`); `onboarding_sessions` (`token`,
`tenant_id`, `online_research_consent_at`, `browser_safety_session_id`,
`status=client_interviewing`, `place_id` / `company_number` /
`website_url`); empty `business_profiles`
(same `tenant_id`) then registry / Maps-autocomplete increments via
[build-profile](build-profile.md).

Schemas: [persistence.md](../persistence.md), [ETL](../../etl/persistence.md), [details](../../business-profile/details/persistence.md). Do not re-define them here.

## Fail

- Missing consent, missing both sources, or missing
  `browser_safety_session_id` → 4xx; no tenant, no onboarding session,
  no 02.
- Registry/Maps lookup error → show miss; do not invent a business.
- Restore path: stored token + `GET /v1/onboarding/profile` failing → loading
  placeholder; keep the token; retry; do not `POST`.
- Sixth business lookup in 30 minutes with the same
  `browser_safety_session_id` → **429** `browser_safety_cap`; no tenant,
  no onboarding session, no 02. Optional `Retry-After`. Stay on Find.
  Not IP. Clearing site data bypasses it.

## Out

02 running when enqueued. UI `/onboarding/review`. SSE on the
onboarding session stream.

## Invariants

- Business lookup runs once per browser token.
- At most **5** business lookups per `browser_safety_session_id` per
  rolling 30 minutes.
- Find mount never `POST`s.
- 02 does not start without `online_research_consent_at`.
- 02 does not start a 6th onboarding `StartRun` for this tenant inside 30
  minutes (silent skip on source change).
- Find does not upsert `etl.google_maps_listings` or insert fetch rows.
- No `website_pages` / `website_prefix` yet.
- `/me` still has no tenant (`status=unactivated`).
