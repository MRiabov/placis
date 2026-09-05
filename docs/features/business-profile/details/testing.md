# Details — E2E and integration tests

Playwright e2e drives `frontend-3` against the real API and real
Postgres. Integration is **one side**. Backend: `humatest`,
Testcontainers Postgres. Frontend: Vitest `HappyPathDetailsFull` (MSW,
no Go). Persist names tables from [persistence.md](persistence.md)
(Postgres schema `business_profile`). Public 1:1 is specified as
`### TestHappyPath*` here; Go funcs are
`leftover_tests.go` until implementation. No pipeline
(`TestPipelineHappyPathDetails*` does not exist). No Go tests in this
docs PR.

Certifications and reviews HTTP 1:1 lives here (ADR 7), not in
[certifications-and-reviews/testing.md](../certifications-and-reviews/testing.md).

## E2E

### Click-off through undo

#### Setup

E2E (Playwright, both sides). Playwright drives `frontend-3` against
the real API + real Postgres. Activated tenant with a live
`business_profile.business_profiles` row. LLM unused.

#### Exercise

1. Open `/cms/details`. Change display name; click off.
2. Shared notification **Revert**.
3. Change a featured service; click off; **OK**.

#### Verify

1. Click-off **persists into** `business_profile.business_profile_edits` and
   `business_profile.business_profiles`. UI shows the new name.
2. Revert: compensating increment; live `display_name` restored.
   `GET /v1/business-profile` matches.
3. **OK** keeps the service write on
   `business_profile.business_profile_services`.
   `business_profile.business_profile_edit_sources` stays empty for these owner
   increments.

#### Mocked

LLM unused. Prefer fake Google Maps territory lookup.

## Integration

### TestHappyPathV1BusinessProfile — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Activated tenant. Live
`business_profile.business_profiles` row with services, areas, hours. Linked
Facebook URL so `business_profile.facebook_profiles` can hydrate. No
`frontend-3`.

#### Exercise

`GET /v1/business-profile`. Response `BusinessProfileRead`.

#### Verify

200. Body is `BusinessProfileRead` (scalars, `services` from
`business_profile.business_profile_services`, `service_areas` from
`business_profile.business_profile_service_areas`, `opening_hours` from
`business_profile.business_profile_opening_hours`). When the Facebook URL is
linked, `linked_facebook` has name / photo / rating / review count from
`business_profile.facebook_profiles`. No profile-history timeline. Distinct from
`WebsiteBusinessProfileRead` and `OnboardingLiveBusinessProfileRead`.

### TestHappyPathV1BusinessProfilePatch — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Activated tenant. Live
`business_profile.business_profiles` row. Existing
`business_profile.facebook_posts` / `business_profile.instagram_posts` /
`business_profile.instagram_profiles` fixture rows from ETL.

#### Exercise

`PATCH /v1/business-profile`. Request `BusinessProfileUpdate` (dirty
keys only, including a service list-item op). Response
`BusinessProfileRead`.

#### Verify

200. Then `GET /v1/business-profile` shows those dirty keys.
**persists into** `business_profile.business_profile_edits` and
`business_profile.business_profiles` (and
`business_profile.business_profile_services` /
`business_profile.business_profile_service_areas` /
`business_profile.business_profile_opening_hours` when that list op ran). Must
not write `business_profile.facebook_posts`, `business_profile.instagram_posts`,
`business_profile.instagram_profiles`, or
`business_profile.business_profile_edit_sources`.

#### Fail

`403` unactivated. Full-row dump / extra keys → 4xx.

### TestHappyPathV1BusinessProfileEditsUndo — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Activated tenant. A named
`business_profile.business_profile_edits` increment from a prior PATCH (the
notification id).

#### Exercise

`POST /v1/business-profile/edits/{id}/undo`. Response
`BusinessProfileRead`.

#### Verify

200. Then `GET /v1/business-profile` shows the inverse. Compensating
row on `business_profile.business_profile_edits`. Live columns restored.

#### Fail

`403` unactivated. Already undone, or not the named increment → `409`.

### TestHappyPathV1BusinessProfileCertifications — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Activated tenant.
`business_profile.certification_definitions` seeded for that country. Some
`business_profile.business_profile_certification_selections` `selected`.

#### Exercise

`GET /v1/business-profile/certifications`. Response
`BusinessProfileCertificationListRead`.

#### Verify

200. Body has `available[]` (`CertificationDefinitionRead`) and
`selected[]`. Do not key `available[]` off a closed trade enum.

### TestHappyPathV1BusinessProfileCertificationsPut — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Activated tenant.
`business_profile.certification_definitions` seeded.

#### Exercise

`PUT /v1/business-profile/certifications`. Request
`BusinessProfileCertificationsPut`. Response
`BusinessProfileCertificationListRead`.

#### Verify

200. Then `GET /v1/business-profile/certifications` shows the new
selected set. Unchecked rows are `status=removed` on
`business_profile.business_profile_certification_selections`.

### TestHappyPathV1BusinessProfileReviews — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Activated tenant.
`in_pool` and `archived` `business_profile.business_profile_reviews` rows. Some
pinned via `business_profile.business_profile_review_rankings`.

#### Exercise

`GET /v1/business-profile/reviews`. Request `ReviewListGet` (default
pool). Response `ReviewListRead`.

#### Verify

200. Body lists the **pool** (`status=in_pool`), **top reviews**
first, plus `top_reviews_provisional`. Archived rows omitted unless
`status=archived`.

### TestHappyPathV1BusinessProfileReviewsPatch — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Activated tenant.
`in_pool` reviews exist; some already pinned by
`reviews_ranking_for_display`.

#### Exercise

`PATCH /v1/business-profile/reviews`. Request `ReviewTopUpdate`
(featured-first `review_ids[]`, max 30). Response `ReviewListRead`.

#### Verify

200. Then `GET /v1/business-profile/reviews` shows `is_top` /
`top_position` dense 1…n from the latest ranking batch,
`algorithm=human`, `top_reviews_provisional=false`. Ranking rows
inserted; review pin columns unchanged (none). Does not rewrite
`website_slot_reviews`.

#### Fail

Longer than 30, a duplicate id, or an id not `in_pool` → `400`.

### TestHappyPathV1BusinessProfileReviewsArchive — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Activated tenant. An
`in_pool` review, possibly pinned, possibly on
`website_slot_reviews`.

#### Exercise

`PATCH /v1/business-profile/reviews/{id}/archive`. Response
`ReviewRead`.

#### Verify

200. Then `GET /v1/business-profile/reviews` omits it from the pool.
Row `status=archived` on `business_profile.business_profile_reviews`. Dropped
from every `website_slot_reviews` array (then compact). Not deleted.

### TestHappyPathV1BusinessProfileReviewsUnarchive — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Activated tenant. An
`archived` review.

#### Exercise

`PATCH /v1/business-profile/reviews/{id}/unarchive`. Response
`ReviewRead`.

#### Verify

200. Then `GET /v1/business-profile/reviews` includes it in the pool.
Not automatically top. Not automatically back onto website sections.

### TestHappyPathV1BusinessProfileReviewsCreate — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Activated tenant.

#### Exercise

`POST /v1/business-profile/reviews`. Request `ReviewCreate`. Response
`ReviewRead`.

#### Verify

200. Then `GET /v1/business-profile/reviews` includes the row
`origin=owner`, `status=in_pool` on `business_profile.business_profile_reviews`.

#### Fail

`rating` outside 1–5 or `body` over 500 → `400`.

### TestHappyPathV1BusinessProfileReviewsImport — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Activated tenant.
Linked `google_maps_listing_url` and/or `facebook_profile_url`. One
already-`archived` imported external id.

#### Exercise

`POST /v1/business-profile/reviews/import`. Request
`ReviewImportCreate`. Response `ReviewListRead`.

#### Verify

200. Then `GET /v1/business-profile/reviews` includes imported
`in_pool` rows. Archived external ids are not recreated. `body` is
not truncated.

#### Fail

Neither URL linked → `409`.

#### Mocked

Google Maps listing reviews. Facebook page reviews.

### Two-tenant isolation

#### Setup

Backend (`humatest`, Testcontainers Postgres). Two activated tenants,
each with a `business_profile.business_profiles` row.

#### Exercise

Tenant A JWT against tenant B’s review id, undo id, and profile
writes.

#### Verify

404 / forbidden. Tenant B `business_profile.business_profiles` /
`business_profile.business_profile_reviews` unchanged.

### HappyPathDetailsFull — frontend Full

Frontend. Vitest `HappyPathDetailsFull`. Not OpenAPI 1:1.

#### Setup

Frontend (jsdom / Vitest, MSW, no Go). Tenant active. Live profile in
MSW fixtures.

#### Exercise

Open `/cms/details`. Click-off a scalar. Revert. OK. MSW
`GET /v1/business-profile`, `PATCH /v1/business-profile`,
`POST /v1/business-profile/edits/{id}/undo`.

#### Verify

UI: Business details panels, shared notification Revert / OK. MSW
saw those Method+path strings. Postgres rows are the backend test.

#### Mocked

All HTTP via MSW.
