# Google Maps — integration test

- **Assert**: `StartRun` with this ETL run kind inserts `etl.runs`; extract
  writes `etl.google_maps_fetches` (Details first, then scrape rows as they
  arrive); retry of the same `run_id` does not refetch Details when that fetch
  exists and still runs remaining scrape; `trigger=scheduled` inserts a new
  fetch; listing upserts on `place_id`; hours replaced; new review `external_id`
  inserted, duplicate skipped; `raw` is not a column on `google_maps_listings`;
  transform of the Details chunk fills empty marketing phone **before** scrape
  finishes; owner-typed marketing phone that disagrees is a research conflict
  (`algorithm=human`, live profile column is not updated); extract does not
  write `business_profile_*`; transform does not call the Maps fake; SSE /
  checklist show Details live business profile while `status` is still
  `extracting`. Scrape fake is `scraperlink/google-maps-scraper` input shape
  (`reviews=true`, `maxReviews=50`). Review photos attach to the listing review,
  not `google_maps_listing_photos`. Transform may insert Projects from reviews
  usable as a Project (verdict on `etl.llm_source_to_project_classifications`;
  listing + listing-review `etl.sources`; review add cites the listing-review
  `source_id`).
- **Fake**: Google Maps Details / scrape. Never Parallel **Search** API, Exa,
  Perplexity, Tako, `:online`, OpenRouter web search.
