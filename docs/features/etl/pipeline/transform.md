# Transform

Business logic. Read fetch / listing rows. Write the business profile. Do not call source
networks.

Conflict and fold rules are [build-profile](../../onboarding/pipeline/build-profile.md) — do not
fork a second merge.

## Trigger

Extract for this `etl.runs` row succeeded (`status` moves to `transforming`). Per kind: Maps
reviews may land while Instagram extract is still running.

## Pre

- Fetch (and Maps listing, on that kind) for this `run_id` exist, or scheduled skip already
  happened (no transform).
- `business_profiles` row for `tenant_id`.

## Must not

- Call Maps, Facebook, Instagram, crawl, or Parallel.
- Dump fetch `raw` onto `business_profiles`.
- Overwrite the whole profile in one write.
- Silently overwrite an owner-typed value that disagrees (research conflict; fold does not
  move).
- Reclassify a media library item whose `content_hash` already has a photo kind.

## Do

`SELECT … FOR UPDATE` the profile. Insert only the increments this kind set. Update only those
fold columns or list rows.

- **New Maps reviews** — `business_profile_reviews` keyed to `etl.google_maps_listing_reviews`.
- **New Facebook / Instagram posts** — upsert `facebook_posts` / `instagram_posts` (and the
  profile row) on the business profile.
- **New photos** — media library items `supplied_by=business_research`; photo kind
  (hero / project / service / founder / logo) on those items. Captioning and visual-issue tools
  stay on the media library.
- **Empty scalars** fill from the listing / social profile.
- **Disagreeing owner-typed scalars** (marketing phone, name, hours, URLs) → research conflict
  on Details.

After website activation the owner sees conflicts on Details. No extra apply screen.

## Persist

`business_profile_edits` + fold columns / list tables;
`facebook_profiles` / `facebook_posts` / `instagram_profiles` / `instagram_posts`;
`media_assets` (new items + photo kind). `etl.runs.status=succeeded`.

## Fail

Retryable. Prior fold stays. `status=error` when retries exhaust. Extract fetch rows stay.

## Out

Onboarding SSE mirrors `etl.runs` when `trigger=onboarding`. Scheduled: no SSE.

## Invariants

- Transform does not call source networks.
- Same conflict rule as onboarding 02.
- Incremental: existing source ids are left alone; new ids insert.
