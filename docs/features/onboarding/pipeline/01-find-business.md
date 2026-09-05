# 01 — Find the business

Country (Ireland / United Kingdom / United States; default Ireland), find the
business, online research consent. First business lookup (no onboarding session
token) creates an unactivated tenant and the onboarding session, then returns
immediately. Business research (02) starts in the background. UI lands on Review
(03). A later POST with a **valid** onboarding session token is the same
function on that row: same attach keys are safe to retry; different keys are
scratch 01 (not a second tenant, not a merge).

## Trigger

Contractor submits business lookup (`POST /v1/onboarding/business-lookup`):

- `/onboarding/find` when this browser has no stored token (create).
- `/onboarding/review` change-the-business (valid token).
- Back to Find then Business lookup with the same pick (valid token;
  safe to retry).

## Pre

- Country selected. At least one of: company registry record, Google Maps
  place.
- Online research consent checkbox on (body `online_research_consent`
  true). First lookup records `online_research_consent_at`. Scratch /
  safe to retry already have it.
- Create: no onboarding session token.
- Scratch / safe to retry: onboarding session token names an
  `onboarding_sessions` row; `status=client_interviewing`.

## Must not

- `POST` on Find mount, on keystroke, or without an onboarding session token
  when a token is already stored.
- Create a tenant when the onboarding session token does not name a row (that is
  **401**).
- Select or copy the website template, create a website preview, or wait
  for 02.
- Insert a second tenant or a second onboarding session for the same
  browser token.
- Cancel in-flight 02 because the contractor navigated Back or POSTed the
  same attach keys.
- Start 02 without `online_research_consent_at`.
- Upsert `etl.google_maps_listings` or insert `etl.*_fetches` (those are
  ETL extract). Maps autocomplete is a search Read, not a Details extract.
- Conflict-merge two company picks. Scratch re-inits the live profile.

## Do

`LookupBusiness` returns immediately.

**No onboarding session token.** Insert the unactivated tenant and onboarding
session.

1. Insert [unactivated tenant](../../other/auth/persistence.md):
   `tenants.status=unactivated`, `clerk_org_id`
   null, `name` = known legal/display name or empty,
   `country` = Find country (`ie` / `gb` / `us`).
2. Insert `onboarding_sessions`: `status=created` then immediately
   `client_interviewing`; unique `token`; `tenant_id` that tenant;
   `clerk_user_id` null; `channel` unset; typed attach keys from the
   selected records (`place_id`, `company_number`, `website_url` — all
   nullable).
3. Record `online_research_consent_at`.
4. Persist the selected company registry record and/or attach the Maps
   place on **this** onboarding session (those typed keys).
5. Initialize [business profile](../../business-profile/details/persistence.md): `business_profiles` with that `tenant_id`,
   empty/unknown details, `last_edit_id` and `accepted_edit_id` null. Then
   increments via [build-profile](build-profile.md): registry fills legal identity (insert
   `etl.sources` `source_kind=company_registry_record` and cite it); Maps
   autocomplete Read may fill `display_name` (no listing upsert, no fetch row).
   Both: registry wins legal identity. Contact fields that Details will confirm
   (marketing phone, hours, website) wait for 02.
6. Enqueue 02 (a first lookup never hits the per-tenant cap).

**Onboarding session token names a row; `status=client_interviewing`;
body attach keys equal the row** (`place_id`, `company_number`,
`website_url`; omitted = null). Safe to retry. Do not create, do not
wipe, do not `StartRun`, do not abandon the in-flight enqueue. Return
`OnboardingProfileRead`.

**Onboarding session token names a row; `status=client_interviewing`;
attach keys differ.** Count distinct `etl.runs.enqueue_id` for this
`tenant_id` with `trigger=onboarding` and `started_at > now() - 30
minutes`. Five already → Fail (`429` `onboarding_enqueue_cap`). Else
scratch 01: replace attach keys; persist `tenants.country` from this
body; re-init `business_profiles` as first lookup (empty/unknown, then
this pick’s 01 increments only); enqueue 02. Prior `trigger=onboarding`
`enqueue_id`s for that tenant must not write the live profile (latest
enqueue only). Interview already started (`channel` / autosave) does
not 4xx. Scratch wipes live-profile human answers; no merge.

Lookups are debounced (no request per keystroke). Country is a search
parameter **and** is persisted on `tenants.country` (Voice region
fallback after website activation; scratch writes it from this body).
Not an onboarding session column. Create navigates UI to Review
(`/onboarding/review`). Change-the-business stays on Review.

## Persist

Create: `tenants` (`status=unactivated`, `country`); `onboarding_sessions`
(`token`, `tenant_id`, `online_research_consent_at`,
`status=client_interviewing`, `place_id` / `company_number` /
`website_url`); empty `business_profiles` (same `tenant_id`) then
registry / Maps-autocomplete increments via
[build-profile](build-profile.md).

Scratch: those attach keys and `tenants.country` on the existing rows;
re-init `business_profiles` then this pick’s increments.

Safe to retry: none.

Schemas: [persistence.md](../persistence.md),
[ETL](../../etl/persistence.md),
[business profile](../../business-profile/details/persistence.md). Do not
re-define them here.

## Fail

- Missing consent or missing both sources → 4xx; no tenant (create) or no
  scratch.
- Onboarding session token present, no matching
  `onboarding_sessions.token` → **401**; no tenant.
- Registry/Maps lookup error → show miss; do not invent a business.
- Restore path: stored token + `GET /v1/onboarding/profile` failing →
  loading placeholder; keep the token; retry; do not `POST`.
- Scratch with 5 onboarding `enqueue_id`s in 30 minutes on this tenant →
  **429** `onboarding_enqueue_cap`; no wipe; no `StartRun`; in-flight 02
  for the current company keeps running. Optional `Retry-After`. Stay
  on Review. Not IP.
- Valid token, status not `client_interviewing` → 4xx (05 has started).
- Activated leftover token → **403**.

## Out

02 running when enqueued (create or scratch). Safe to retry: 02 already
running stays. UI `/onboarding/review` after create and after
change-the-business. SSE on the onboarding session stream.

## Invariants

- Create runs once per browser token.
- Same attach keys on a valid token do not enqueue and do not wipe.
- At most **5** onboarding `enqueue_id`s per `tenant_id` per rolling 30
  minutes. A 6th scratch is 01 Fail (`429`).
- Find mount never `POST`s.
- 02 does not start without `online_research_consent_at`.
- Find does not upsert `etl.google_maps_listings` or insert fetch rows.
- No `website_pages` / `website_prefix` yet.
- `/me` still has no tenant (`status=unactivated`).
