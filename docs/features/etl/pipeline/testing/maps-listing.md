# Google Maps listing — integration test

- **Assert**: upsert on `place_id`; hours replaced; new review `external_id` inserted, duplicate
  skipped; `raw` is not a column on `google_maps_listings`; `latest_fetch_id` points at the fetch.
