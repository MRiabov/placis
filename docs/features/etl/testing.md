# ETL — tests

ETL has no owner UI. The full-stack onboarding E2E
([onboarding testing](../onboarding/testing.md)) proves 02 still fills
the checklist and writes `etl.*` rows. This feature’s own tests are
**integration** (real Postgres). Step-level asserts:
[pipeline/testing](pipeline/testing/README.md).

## Integration

### Bootstrap

#### Setup

01 details that let some ETL run kinds start
([ETL run kind triggers](pipeline/etl-run-kind-triggers.md); never
`directory`, `review`, or `photo`). Real Postgres.

#### Invoke

`StartRun` with `trigger=onboarding`.

#### Assert

`etl.runs` only for started ETL run kinds (shared `enqueue_id`),
`etl.sources`, `google_maps_fetches` / `facebook_fetches` /
`instagram_fetches`, `google_maps_listings`, `facebook_posts` /
`instagram_posts`, media library photos via `imported_media` /
`imported_media_sources`. `business_profile_opening_hours` has rows,
`business_profiles.marketing_phone` is set, and first
`business_profile_reviews` exist while scrape `etl.runs.status` is
still in flight; later scrape **persists into** further
`business_profile_reviews` / `google_maps_listing_reviews` /
`google_maps_listing_review_photos` /
`google_maps_listing_opening_hours` / `website_crawl_page_photos`. ETL
increments have `business_profile_edit_sources`. Facebook / Instagram
are not inserted until a URL/handle detail exists.

#### Fail

`insufficient_data_for_lookup` if nothing left can produce that detail.

#### Mocked

Maps / Facebook / Instagram / LLM.

### Scheduled increment

#### Setup

Bootstrap already ran. Owner typed a marketing phone. Real Postgres.

#### Invoke

Second `StartRun` with `trigger=scheduled` and a new review, a new
Instagram post, a new photo, and a different marketing phone than the
owner typed.

#### Assert

New review / post / photo on the business profile; owner-typed
marketing phone unchanged (research conflict); photo kind not rewritten
for the same content hash when `force` is false and `schema_revision`
matches; a bumped `schema_revision` extracts / classifies without
`force`; `algorithm=human` is not overwritten. After that scheduled run
**succeeds** and new `in_pool` review rows landed: schema `jobs` has
one `reviews_ranking_for_display` on that `tenant_id` (once, not per
chunk). After invoke: `top_reviews_provisional=false`. Transform did
not rank. If the scheduled run added no new `in_pool` rows, no ranking
job.

#### Mocked

Maps / Facebook / Instagram / LLM.

### Cap

#### Setup

Five onboarding `enqueue_id`s in 30 minutes. Real Postgres.

#### Invoke

A sixth `StartRun(trigger=onboarding)`.

#### Assert

Does not insert runs.

#### Mocked

Maps / Facebook / Instagram / LLM.

### Insufficient data for lookup

#### Setup

Scheduled Instagram with no handle. Scheduled Maps with no `place_id`.
Onboarding Instagram with no handle detail yet. Real Postgres.

#### Invoke

Scheduled Instagram `StartRun`. Scheduled Maps `StartRun`. Onboarding
Instagram until a handle detail exists.

#### Assert

Scheduled Instagram → `status=insufficient_data_for_lookup`
immediately, no fetch. Scheduled Maps → `insufficient_data_for_lookup`,
no Places Find. Onboarding Instagram is not inserted until a handle
detail exists.

#### Mocked

Maps / Facebook / Instagram / LLM.

### Two-tenant isolation

#### Setup

Two tenants via `humatest` + real Postgres. No Playwright.

#### Invoke

Each tenant reads the other’s `etl.runs`, fetches, or profile posts.

#### Assert

Each cannot read the other’s `etl.runs`, fetches, or profile posts.

#### Mocked

Maps / Facebook / Instagram / LLM.
