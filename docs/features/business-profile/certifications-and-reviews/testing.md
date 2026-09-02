# Certifications and reviews (E2E and integration)

This screen’s pin + ranking flow (not HTTP 1:1). Ranking enqueue and
two-pass:
[build-profile testing](../../onboarding/pipeline/testing/build-profile.md).
Public 1:1 for certifications and reviews Routes lives in
[details/testing.md](../details/testing.md) (ADR 7). Do not duplicate
those `### TestHappyPath*` rows here. Titles here must **not** use
the `TestHappyPath` prefix.

## E2E

### Pin through ranking

#### Setup

E2E (Playwright, both sides). Playwright drives `frontend-2` against
the real API + real Postgres. Activated tenant. `in_pool` reviews
exist.

#### Exercise

1. Open `/cms/certifications-and-reviews`. Pin / reorder **top
   reviews**.
2. Leave the screen. Ranking job `reviews_ranking_for_display` runs
   again.

#### Verify

1. UI: top band matches the owner order. Ads still hydrate `is_top`.
2. Ranking does not overwrite `algorithm=human` pins.
   Latest ranking batch `provisional=false`.

#### Mocked

Ranking LLM.

## Integration

### Owner pin top reviews

#### Setup

Backend (`humatest`, Testcontainers Postgres). `in_pool` reviews
exist; some already pinned by `reviews_ranking_for_display`.

#### Exercise

PATCH ordered `review_ids[]` (featured-first, max 30). Then run
`reviews_ranking_for_display` again.

#### Verify

PATCH inserted a ranking batch with `is_top` / `top_position`,
`algorithm=human`, and `provisional=false`. The later ranking job does
not overwrite those pins. Ads still hydrate `is_top`. No
`website_slot_reviews` rewrite.

#### Fail

Longer than 30 `review_ids[]` → `400`.

#### Mocked

Ranking LLM.

### Two-tenant isolation

#### Setup

Backend (`humatest`, Testcontainers Postgres). Two activated
tenants, each with `in_pool` reviews.

#### Exercise

Tenant A JWT against tenant B’s review archive / pin ids.

#### Verify

404 / forbidden. Tenant B pins unchanged.

### HappyPathCertificationsAndReviewsFull

Frontend. Vitest `HappyPathCertificationsAndReviewsFull`. Not
OpenAPI 1:1.

#### Setup

Frontend (jsdom / Vitest, MSW, no Go). Tenant active. Pool +
available certifications in MSW fixtures.

#### Exercise

Open `/cms/certifications-and-reviews`. Tick a certification. Pin
top reviews. Archive one. Import. MSW
`GET /v1/business-profile/certifications`,
`PUT /v1/business-profile/certifications`,
`GET /v1/business-profile/reviews`,
`PATCH /v1/business-profile/reviews`,
`PATCH /v1/business-profile/reviews/{id}/archive`,
`POST /v1/business-profile/reviews/import`.

#### Verify

UI: ticks, top band, Archive disclosure. MSW saw those Method+path
strings. Postgres rows are the backend test. This Full does not
fill leftover 1:1.

#### Fail

MSW `400` when pin list is over 30.

#### Mocked

All HTTP via MSW.
