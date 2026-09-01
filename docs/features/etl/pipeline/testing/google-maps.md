# Google Maps — integration test

- **Assert**: `StartRun` with this ETL run kind inserts `etl.runs`; extract
  writes `etl.google_maps_fetches` (Details first, then scrape rows as they
  arrive); retry of the same `run_id` does not refetch Details when that fetch
  exists and still runs remaining scrape; `trigger=scheduled` inserts a new
  fetch; listing upserts on `place_id`; hours replaced; Places Details
  `location` written as `latitude` / `longitude` (null when Details never ran
  or has no location); new review `external_id`
  inserted, duplicate skipped; `raw` is not a column on `google_maps_listings`;
  transform of the Details chunk fills empty marketing phone **before** scrape
  finishes; owner-typed marketing phone that disagrees is a research conflict
  (`algorithm=human`, live profile column is not updated); extract does not
  write `business_profile_*`; transform does not call the Maps fake; SSE /
  checklist show Details live business profile while `status` is still
  `extracting`. Scrape fake is `scraperlink/google-maps-scraper` input shape
  (`reviews=true`, `maxReviews=50`). Review photos attach to the listing
  review, not `google_maps_listing_photos`. Transform may insert Projects from
  reviews usable as a Project (verdict on
  `etl.llm_source_to_project_classifications`; listing + listing-review
  `etl.sources`; review add cites the listing-review `source_id`). New imported
  reviews get a review citation. Transform does not enqueue
  `reviews_ranking_for_display` and does not write `is_top` / `top_position`.
  No `etl_run_kind=review` or `etl_run_kind=photo` run. Details website URL is
  a detail that starts crawl on this enqueue. Places Find from
  `display_name` if set, else `legal_name`, plus locality (including
  `legal_name` + registered-office locality on registry-only Find) yields
  Details only on one high-confidence hit; several hits do not pick a listing.
  Places Find is onboarding only; `trigger=scheduled` with no `place_id` is
  `insufficient_data_for_lookup` and does not call Places Find.
- **Fake**: Google Maps Details / scrape. Never Parallel **Search** API, Exa,
  Perplexity, Tako, `:online`, OpenRouter web search.

Named tables: `business_profile_edit_sources`, `business_profile_edits`,
`business_profile_opening_hours`, `business_profile_reviews`,
`business_profiles`, `etl.google_maps_listing_reviews`,
`google_maps_listing_review_photos`, `imported_media_sources`.
