# Google Maps listing

Upsert the typed Google Maps listing from the newest fetch. Part of extract for
`kind=google_maps_listing`. Not transform (transform copies selected fields onto the profile).

## Trigger

Maps extract inserted `etl.google_maps_fetches`.

## Pre

Fetch row for this `run_id` exists.

## Must not

- Put `raw` on `google_maps_listings`.
- Write `business_profile_opening_hours` or `business_profile_reviews` here (that is
  [transform](transform.md)).
- Use listing address as a legal address.

## Do

Upsert `google_maps_listings` on `place_id`. Replace child hours. Insert reviews / photo refs
whose `external_id` we do not already have. Set `latest_fetch_id`.

## Persist

`etl.google_maps_listings`, `google_maps_listing_opening_hours`, `google_maps_listing_reviews`,
`google_maps_listing_photos`.

## Fail

Same as extract: retry the extract job; listing stays at the last successful upsert.

## Out

Transform for this run.

## Invariants

- `place_id` unique.
- Listing hours stay on `etl`; profile hours are the copy the website reads.
