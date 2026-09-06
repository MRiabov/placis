# Instagram

`etl_run_kind=instagram`. Onboarding 02 and Monday / Wednesday / Friday. Shared
extract / transform rules: [pipeline README](README.md).

Public scrape. Graph API is later. Never say Instagram listing — this is an
Instagram profile and Instagram posts.

## Trigger

Starts when: `instagram_handle`. Skip (`status=insufficient_data_for_lookup`)
when scheduled and there is no handle. Onboarding: start when the detail
exists. Nothing left that can produce it → `insufficient_data_for_lookup`. A
later paste can still start this ETL run kind on this enqueue.

## Pre

- `etl.runs` row `status=pending` (or retry of `extracting` / `transforming`).
- `business_profiles` row for `tenant_id` before transform.

## Must not

- Call Maps, Facebook, crawl, or Parallel from this ETL run kind.
- Dump fetch `raw` onto `instagram_profiles` / `instagram_posts`.
- Treat this row as a listing.
- Overwrite an Instagram profile or post whose `algorithm` is `human` (including
  `force=true`).

## Do — extract

`extract/instagram.Run` sets `status=extracting`. Instagram scrape. Insert
`etl.instagram_fetches` (UUID, `handle`, `instagram_user`, `raw`,
`run_id`, `fetched_at`) as each response arrives; transform that chunk
before waiting for later Instagram posts. Retry of this `run_id` does
not insert a second fetch for a handle that already landed. A later run
after a `schema_revision` bump extracts again.

## Do — transform

`transform/instagram.Run` sets `status=transforming`. Ensure
`etl.sources` for the Instagram profile and each Instagram post. Upsert
`instagram_profiles` on this contractor’s `instagram_user` unless
`algorithm=human` (`source_id` required). Write `name` and
`photo_url` on that row from the fetch (must not dump `raw`). No
`rating` / `review_count`. Upsert `instagram_posts` on
`external_id` (insert only ids we do not already have; skip existing
rows whose `algorithm` matches **and** `schema_revision` matches, or is
`human`). Attach new photos into the media library
(`imported_media_sources` → post `source_id`); **calls**
`WriteImageThumbnail`; then **inserts** `describe_image` per new row
with no classification yet (do not wait); then
[projects.md](projects.md) for posts that are a past named job
(depicting photo required). Write `algorithm` and `schema_revision` on
rows this transform set.

## Reads

`etl.runs`; `etl.instagram_fetches` for this `run_id` (retry);
`instagram_profiles` / `instagram_posts`; `business_profiles`.

## Calls

`WriteImageThumbnail`. `transform/projects.Run` (transform, after posts
usable as a Project).

## Inserts

Extract **inserts** `instagram_transform` after each chunk. Transform
**inserts** `instagram_extract` when Instagram post chunks remain.
Transform **inserts** `describe_image` per new imported row with no
classification yet (do not wait).

## Persist

Extract **persists into** `etl.instagram_fetches`; `etl.sources`.
Transform **persists into** `instagram_profiles` / `instagram_posts`;
media library items + `imported_media_sources`; Projects when a post is
usable as a Project. **Persists into** `etl.runs.status=succeeded`.

## Fail

Retryable. Same `run_id`. Prior posts stay. `status=error` when retries exhaust.

## Out

Onboarding SSE mirrors Postgres on change (`etl.runs` and the live business
profile) when `trigger=onboarding`. Scheduled: no SSE.

## Invariants

- Instagram profile / posts live on the business profile, not `etl`.
- Transform does not call Instagram.
