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

Set `status=extracting`. Instagram scrape. Insert `etl.instagram_fetches` (UUID,
handle, Instagram user, `raw`, `run_id`, `fetched_at`) as each response arrives;
transform that chunk before waiting for later Instagram posts. Retry of this
`run_id` does not insert a second fetch for a handle that already landed. A
later run after a `schema_revision` bump extracts again.

## Do — transform

`status=transforming`. Ensure `etl.sources` for the Instagram profile and each
Instagram post. Upsert `instagram_profiles` on this contractor’s Instagram user
unless `algorithm=human` (`source_id` required). Upsert `instagram_posts` on
`external_id` (insert only ids we do not already have; skip existing rows whose
`algorithm` matches **and** `schema_revision` matches, or is `human`). Attach
new photos into the media library (`imported_media_sources` → post `source_id`);
**calls** `WriteImageThumbnail`; then [photo classification](photo-classification.md); then **inserts**
`describe_image` per new row with empty `media_caption` (do not wait); then
[projects.md](projects.md) for posts that are a past named job (depicting photo required).
Write `algorithm` and `schema_revision` on rows this transform set.

## Persist

`etl.instagram_fetches`; `etl.sources`; `instagram_profiles` /
`instagram_posts`; media library items + `imported_media_sources`; **calls**
`WriteImageThumbnail`; **inserts** `describe_image` per new imported row with
empty `media_caption`; Projects
when a post is usable as a Project. `etl.runs.status=succeeded`.

## Fail

Retryable. Same `run_id`. Prior posts stay. `status=error` when retries exhaust.

## Out

Onboarding SSE mirrors Postgres on change (`etl.runs` and the live business
profile) when `trigger=onboarding`. Scheduled: no SSE.

## Invariants

- Instagram profile / posts live on the business profile, not `etl`.
- Transform does not call Instagram.
