# 02 — Business research (integration test)

- **Setup**: 01 business lookup has returned; `online_research_consent_at`
  set.
- **Exercise**: business lookup returns; `StartRun` **inserts** each ETL
  run kind’s extract River job kind, then the matching transform River
  job kind, as background jobs. Also: attach/change sources six times
  inside 30 minutes on the same tenant.
- **Verify**: `GET /v1/onboarding/profile` succeeds before jobs finish; one
  `enqueue_id` per `StartRun`; `etl.runs` rows exist for ETL run kinds that
  could start (never `directory`, `review`, or `photo`); Maps-only Find starts
  `trade_registry` from `display_name` + country; Maps starts from `place_id`
  **or** Places Find (`display_name` if set, else `legal_name`, plus locality,
  one confident hit); company-number-only Maps Places Find uses `legal_name` +
  registered-office locality and does not wait for Parallel; retry of the same
  `run_id` does not refetch a chunk that already has a fetch and still runs
  remaining ETL slow extract; Maps path upserts `etl.google_maps_listings` (+
  hours, review rows) from Details **before** scrape finishes; fill status / SSE
  show that live business profile while the Maps run is still `extracting`;
  Facebook / Instagram are **not** inserted until a URL/handle detail exists
  (Maps, crawl, Parallel, or 04a paste), then `insufficient_data_for_lookup` if
  nothing left can produce that detail; contractor paste of `existing_site_url`
  starts crawl on the same enqueue; each job clears in-progress on fill status;
  `DescribeImage` inserts `media_asset_classifications` (`photo_kind` `logo` /
  `photo`) on found photos; profile increments go through transform /
  build-profile (conflict does not update the live business profile). Enqueues
  1–5 insert `etl.runs` for started ETL run kinds. The 6th enqueue in 30 minutes
  on the same tenant does **not** call `StartRun`, does **not** call Maps /
  Parallel / Facebook / crawl; `PUT /v1/onboarding/sources` stays **200**; prior
  live business profile stays. A River retry of an existing ETL run does not
  create a new `enqueue_id`. A 6th enqueue after 30 minutes succeeds. After
  Details transform writes `in_pool` reviews: schema `jobs` has one
  `reviews_ranking_for_display` on this `tenant_id` (orchestration, not
  transform). Transform does not write
  `business_profile.business_profile_review_rankings`.
- **Fail**: job error → `etl.runs.status=error`; onboarding session stays
  `client_interviewing`; prior live business profile kept. Enqueue cap
  is not this Fail.
- **Mocked**: Google Maps Details / Places Find / scrape, Vercel
  Parallel Search + crawl Extract HTTP, Facebook, Instagram, trade
  registry, photo classifier / usable-as-a-Project classify (fakes).
  Never Parallel **Search** API, Exa, Perplexity, Tako, `:online`,
  OpenRouter web search. Maps Details reviews usable as a Project
  appear as 04a cards (paid Maps/LLM faked).
