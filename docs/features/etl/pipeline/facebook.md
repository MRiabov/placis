# Facebook

`etl_run_kind=facebook`. Onboarding 02 and Monday / Wednesday / Friday. Shared
extract / transform rules:
[pipeline README](README.md).

Public lookup (existing adapter). Graph API is later.

## Trigger

Starts when: `facebook_page_url` (Maps, crawl, Parallel, Find, or contractor
paste). Skip (`status=insufficient_data_for_lookup`) when scheduled and there
is no Facebook URL. Onboarding: start when the detail exists. Nothing left that
can produce it → `insufficient_data_for_lookup`. A later paste can still start
this ETL run kind on this enqueue.

## Pre

- `etl.runs` row `status=pending` (or retry of `extracting` / `transforming`).
- `business_profiles` row for `tenant_id` before transform.

## Must not

- Call Maps, Instagram, crawl, or Parallel from this ETL run kind.
- Dump fetch `raw` onto `facebook_profiles` / `facebook_posts`.
- Silently overwrite an owner-typed `facebook_profile_url` (research conflict).
- Overwrite a Facebook profile or post whose `algorithm` is `human` (including
  `force=true`).
- Extract Facebook page reviews this slice. Reviews on the checklist come from
  Maps. Hook Maps reviews. Facebook reviews only if some other writer already
  inserted `business_profile_reviews`.

## Do — extract

`extract/facebook.Run` sets `status=extracting`. Facebook lookup. Insert
`etl.facebook_fetches` (UUID, `facebook_page_id`, `facebook_profile_url`,
`handle`, `raw`, `run_id`, `fetched_at`) as each response arrives;
transform that chunk before waiting for later posts. Retry of this
`run_id` does not insert a second fetch for the same `facebook_page_id`
already landed. A later run after a `schema_revision` bump extracts
again.

## Do — transform

`transform/facebook.Run` sets `status=transforming`. Ensure `etl.sources`
for the Facebook profile and each post. Upsert `facebook_profiles` on
this contractor’s `facebook_page_id` unless `algorithm=human`
(`source_id` required). Write `name`, `photo_url`, `rating`,
`review_count` on that row from the fetch (must not dump `raw`).
Upsert `facebook_posts` on `external_id` (insert
only ids we do not already have; skip existing rows whose `algorithm`
matches **and** `schema_revision` matches, or is `human`). Fill empty
`facebook_profile_url` (cite the profile `source_id` on that increment).
Attach new photos into the media library (`imported_media_sources` →
post `source_id`); **calls** `WriteImageThumbnail`; then **inserts**
`describe_image` per new row with no classification yet (do not wait);
then [projects.md](projects.md) for posts that are a past named job
(depicting photo required). Write `algorithm` and `schema_revision` on
rows this transform set.

## Reads

`etl.runs`; `etl.facebook_fetches` for this `run_id` (retry);
`facebook_profiles` / `facebook_posts`; `business_profiles`.

## Calls

`WriteImageThumbnail`. `transform/projects.Run` (transform, after posts
usable as a Project).

## Inserts

Extract **inserts** `facebook_transform` after each chunk. Transform
**inserts** `facebook_extract` when post chunks remain. Transform
**inserts** `describe_image` per new imported row with no classification
yet (do not wait).

## Persist

Extract **persists into** `etl.facebook_fetches`; `etl.sources`.
Transform **persists into** `facebook_profiles` / `facebook_posts`;
`business_profile_edits` + `business_profile_edit_sources` when a live
profile URL / photo increment is set; `imported_media_sources`; Projects
when a post is usable as a Project. **Persists into**
`etl.runs.status=succeeded`.

## Fail

Retryable. Same `run_id`. Prior profile posts stay. `status=error` when retries
exhaust.

## Out

Onboarding SSE mirrors Postgres on change (`etl.runs` and the live business
profile) when `trigger=onboarding`. Scheduled: no SSE.

## Invariants

- Facebook profile / posts live on the business profile, not `etl`.
- Transform does not call Facebook.
