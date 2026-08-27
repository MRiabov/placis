# Facebook

`kind=facebook`. Onboarding 02 and Monday / Wednesday / Friday. Shared extract / transform rules:
[pipeline README](README.md).

Public lookup (existing adapter). Graph API is later.

## Trigger

`StartRun` included this kind. Skip (`status=skipped`) when scheduled and there is no
Facebook page URL / handle.

## Pre

- `etl.runs` row `status=pending` (or retry of `extracting` / `transforming`).
- `business_profiles` row for `tenant_id` before transform.

## Must not

- Call Maps, Instagram, crawl, or Parallel from this kind.
- Dump fetch `raw` onto `facebook_profiles` / `facebook_posts`.
- Silently overwrite an owner-typed `facebook_profile_url` (research conflict).
- Overwrite a Facebook profile or post whose `algorithm` is `human` (including `force=true`).

## Do — extract

Set `status=extracting`. Facebook lookup. Insert `etl.facebook_fetches` (UUID, Facebook page id /
URL, handle, `raw`, `run_id`, `fetched_at`) as each response arrives; transform that chunk before
waiting for later posts. Retry of this `run_id` does not insert a second fetch for the same
Facebook page id already landed. A later run after a `schema_revision` bump extracts again.

## Do — transform

`status=transforming`. Upsert `facebook_profiles` on this contractor’s Facebook page id unless
`algorithm=human`. Upsert `facebook_posts` on `external_id` (insert only ids we do not already
have; skip existing rows whose `algorithm` matches **and** `schema_revision` matches, or is
`human`). Fill empty `facebook_profile_url`. Attach new photos into the media library; then
[photo classification](photo-classification.md). Write `algorithm` and `schema_revision` on
rows this transform set.

## Persist

`etl.facebook_fetches`; `facebook_profiles` / `facebook_posts`; `business_profile_edits` when a
live profile URL / photo increment is set. `etl.runs.status=succeeded`.

## Fail

Retryable. Same `run_id`. Prior profile posts stay. `status=error` when retries exhaust.

## Out

Onboarding SSE mirrors Postgres on change (`etl.runs` and the live business profile) when
`trigger=onboarding`. Scheduled: no SSE.

## Invariants

- Facebook profile / posts live on the business profile, not `etl`.
- Transform does not call Facebook.
