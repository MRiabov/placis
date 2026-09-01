# 02 — Business research (integration test)

- **Setup**: 01 business lookup has returned; `online_research_consent_at` set.
- **Invoke**: business lookup returns; `StartRun` **inserts** each ETL run
  kind’s extract River job kind, then the matching transform River job kind,
  as background jobs. Also: attach/change sources six times inside 30 minutes on
  the same tenant.
- **Assert**: Review / checklist reads succeed before jobs finish; one
  `enqueue_id` per `StartRun`; `etl.runs` rows exist for ETL run kinds that
  could start (never `directory`, `review`, or `photo`); Maps-only Find starts
  `trade_registry` from `display_name` + country; Maps starts from `place_id`
  **or** Places Find (`display_name` if set, else `legal_name`, plus locality,
  one confident hit); company-number-only Maps Places Find uses `legal_name` +
  registered-office locality and does not wait for Parallel; retry of the same
  `run_id` does not refetch a chunk that already has a fetch and still runs
  remaining ETL slow extract; Maps path upserts `etl.google_maps_listings` (+
  hours, review rows) from Details **before** scrape finishes; checklist / SSE
  show that live business profile while the Maps run is still `extracting`;
  Facebook / Instagram are **not** inserted until a URL/handle detail exists
  (Maps, crawl, Parallel, or 04a paste), then `insufficient_data_for_lookup` if
  nothing left can produce that detail; contractor paste of `existing_site_url`
  starts crawl on the same enqueue; each job clears in-progress on the checklist
  projection; photo classification tags found photos (`photo_kind`); profile
  increments go through transform / build-profile (conflict does not update the
  live business profile). Enqueues 1–5 insert `etl.runs` for started ETL run
  kinds. The 6th enqueue in 30 minutes does **not** call `StartRun`, does
  **not** call Maps / Parallel / Facebook / crawl, returns `429` with
  `research_wait_until` = oldest of the five enqueue start times + 30 minutes;
  prior live business profile stays. After that instant, `GET .../profile` and
  SSE include `research_wait_until`; Review shows the inline wait and Continue
  still works. A River retry of an existing ETL run does not create a new
  `enqueue_id`. A 6th enqueue after `research_wait_until` succeeds.
- **Fail**: job error → `etl.runs.status=error`; onboarding session stays
  `client_interviewing`; prior live business profile kept. Enqueue cap is not
  this Fail.
- **Mocked**: Google Maps Details / Places Find / scrape, Vercel Parallel
  Search + crawl Extract HTTP, Facebook, Instagram, trade registry, photo
  classifier / usable-as-a-Project classify (fakes). Never Parallel **Search**
  API, Exa, Perplexity, Tako, `:online`, OpenRouter web search. Maps Details
  reviews usable as a Project appear as client interview cards (paid Maps/LLM
  faked). Open `/onboarding/interview` before scrape finishes: empty marketing
  phone fills; scrape reviews land on the reviews list without reload. After
  Details transform writes `in_pool` reviews: schema `jobs` has one
  `reviews_ranking_for_display` on this `tenant_id` (orchestration, not
  transform). Transform does not write `is_top` / `top_position`.
