# Google Maps

`kind=google_maps_listing` (further reviews may use `kind=review` on the same
listing). Onboarding 02 and Monday / Wednesday / Friday. Shared extract /
transform rules:
[pipeline README](README.md).

## Trigger

`StartRun` included this kind. Skip (`status=skipped`) when scheduled and there
is no `place_id`.

## Pre

- `etl.runs` row `status=pending` (or retry of `extracting` / `transforming`).
- `business_profiles` row for `tenant_id` before transform.

## Must not

- Put `raw` on `google_maps_listings`.
- Write `business_profile_opening_hours` or `business_profile_reviews` during
  listing upsert (that is transform).
- Use listing address as a legal address.
- Call Facebook, Instagram, crawl, or Parallel from this kind.
- Silently overwrite an owner-typed marketing phone, name, hours, or URL
  (research conflict).
- Overwrite a live profile field whose winning `algorithm` is `human` (including
  `force=true`).
- Wait for scrape (slow extract) before transforming the Details chunk (fast
  extract).

## Do — extract (fast extract)

Set `status=extracting`. Call Google Maps Details. Persist
`etl.google_maps_fetches` (`fetched_from=google_maps_details`, UUID, `place_id`,
`raw`, `run_id`, `fetched_at`). Upsert the listing (hours, first reviews / photo
refs). Then transform this chunk immediately (~1s).

Details first response today (Places API Place resource): at most **5** reviews
and **10** photos. Do not freeze those caps in contractor-facing copy. Retry of
this `run_id` does not call Details again when that fetch already exists. A
later run after a `schema_revision` bump extracts again (do not reuse an older
fetch).

## Do — extract (slow extract)

Scrape remaining reviews / photos for this listing (on the order of 50 reviews).
Persist a `fetched_from=scrape` fetch as each scrape response arrives. Insert
new listing reviews / photo refs. Transform **that** chunk before waiting for
the rest (~40s extra after Details). `status` stays `extracting` until scrape
has nothing left; `succeeded` only then.

`kind=review` / `kind=photo` (when 02 included them) continue the same listing
the same way.

## Do — listing

Upsert `google_maps_listings` on `place_id`. Replace child hours on the Details
chunk. Insert reviews / photo refs whose `external_id` we do not already have.
Set `latest_fetch_id` to the newest fetch that contributed.

## Do — transform

`status=transforming` for the chunk, then back to `extracting` if slow extract
continues. `SELECT … FOR UPDATE` the profile. Insert only the increments this
chunk set.

- Empty scalars fill from the listing (display name, marketing phone, website,
  hours).
- New reviews → `business_profile_reviews` keyed to
  `etl.google_maps_listing_reviews`.
- New photos → media library items `supplied_by=business_research`; then
  [photo classification](photo-classification.md) for those items (do not wait for scrape to finish).
- Disagreeing owner-typed scalars → research conflict; live profile column is
  not updated.

## Persist

`etl.google_maps_fetches` (several rows per run: Details, then scrape
responses); `etl.google_maps_listings` + hours / reviews / photos;
`business_profile_edits` + live profile hours / reviews / contact columns; media
library items. `etl.runs.status=succeeded` when fast extract and slow extract
are done.

## Fail

Retryable River job. Same `run_id`. Listing stays at the last successful upsert.
Prior live business profile stays. Retry reuses the Details fetch if it landed;
remaining scrape still runs. `status=error` when retries exhaust.

## Out

Onboarding SSE mirrors Postgres on change (`etl.runs` and the live business
profile). After Details + transform, about half of this kind’s checklist is
already filled (hours, marketing phone, website, first reviews / photos); more
reviews / photos appear as scrape runs. Scheduled: no SSE.

## Invariants

- `place_id` unique.
- Listing hours stay on `etl`; profile hours are the copy the website reads.
- Extract does not write the live business profile. Transform does not call
  Maps.
- Transform of the Details chunk does not wait for scrape.
