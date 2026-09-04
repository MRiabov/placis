# Google Maps — integration test

- **Setup**: `tenants`. `business_profile.business_profiles` for that
  `tenant_id`. Onboarding: `place_id` and/or Find inputs (`display_name` if set,
  else `legal_name`, plus locality). Scheduled: `place_id` present, or absent.
- **Exercise**: `StartRun` with this ETL run kind, then
  `extract/googlemaps.Run` then `transform/googlemaps.Run`.
- **Verify** (Postgres after extract/transform, scrape may still run):
  - `etl.runs` inserted. Extract **persists into**
    `etl.google_maps_fetches` (Details first, then scrape rows as they
    arrive); `etl.sources` (listing + each listing review);
    `google_maps_listings` upsert on `place_id`; hours replaced; Places
    Details `location` written as `latitude` / `longitude` (null when
    Details never ran or has no location); `etl.google_maps_listing_reviews`
    new `external_id` inserted, duplicate skipped;
    `google_maps_listing_review_photos` attach to the listing review, not
    `google_maps_listing_photos`. `raw` is not a column on
    `google_maps_listings`.
  - Transform of the Details chunk fills empty marketing phone **before** scrape
    finishes; owner-typed marketing phone that disagrees is a research conflict
    (`algorithm=human`, live profile column is not updated). Live hours /
    reviews / contact columns; `business_profile.business_profile_edits` +
    `business_profile.business_profile_edit_sources`; media library items +
    `imported_media_sources`.
  - Transform may insert Projects from reviews usable as a Project
    (verdict on `etl.llm_source_to_project_classifications`; listing +
    listing-review `etl.sources`; review add cites the listing-review
    `source_id`). New imported reviews get a review citation.
  - SSE / checklist show Details live business profile while `status` is
    still `extracting`.
  - **Must not**: extract write `business_profile_*`; transform call the Maps
    adapter; transform enqueue `reviews_ranking_for_display` or write
    `business_profile.business_profile_review_rankings`; `etl_run_kind=review`
    or `etl_run_kind=photo`.
- **Cases**:
  - Retry of the same `run_id` does not refetch Details when that fetch
    exists and still runs remaining scrape.
  - `trigger=scheduled` inserts a new fetch.
  - Details website URL is a detail that starts crawl on this enqueue.
  - Places Find from `display_name` if set, else `legal_name`, plus
    locality (including `legal_name` + registered-office locality on
    registry-only Find) yields Details only on one high-confidence hit;
    several hits do not pick a listing. Places Find is onboarding only.
  - Scrape adapter input shape is `scraperlink/google-maps-scraper`
    (`reviews=true`, `maxReviews=50`).
- **Fail**: `trigger=scheduled` with no `place_id` →
  `insufficient_data_for_lookup` and does not call Places Find.
- **Mocked**: Google Maps Details / scrape. Never Parallel **Search**
  API, Exa, Perplexity, Tako, `:online`, OpenRouter web search.

Named tables: `business_profile.business_profile_edit_sources`,
`business_profile.business_profile_edits`,
`business_profile.business_profile_opening_hours`,
`business_profile.business_profile_reviews`,
`business_profile.business_profiles`, `etl.google_maps_listing_reviews`,
`google_maps_listing_review_photos`, `imported_media_sources`.
