# 02 — Business research (integration test)

- **Setup**: 01 business lookup has returned; `online_research_consent_at` set.
- **Invoke**: business lookup returns; ETL extract/transform jobs run as
  background jobs. Also: attach/change sources six times inside 30 minutes on
  the same tenant.
- **Assert**: Review / checklist reads succeed before jobs finish; one
  `enqueue_id` per `StartRun` and several `etl.runs` (one per ETL run kind) sharing that
  `enqueue_id`; `etl_run_kinds` are the closed 02 list (never `directory`, `review`, or
  `photo`; always includes `trade_registry` on Maps-only Find); retry of the
  same `run_id` does not refetch a chunk that already
  has a fetch and still runs remaining ETL slow extract; Maps path upserts  `etl.google_maps_listings` (+ hours, review rows) from Details **before**
  scrape finishes; checklist / SSE show that live business profile while the
  Maps run is still `extracting`; `place_id` on the Maps run; Facebook /
  Instagram with no key stay pending until crawl / Maps / web search write a
  key, then `skipped` if discovery finished with none; each job clears
  in-progress on the checklist projection; photo classification tags found
  photos (`photo_kind`); profile increments go through transform / build-profile
  (conflict does not update the live business profile). Enqueues 1–5 insert
  `etl.runs` and start extract. The 6th enqueue in 30 minutes does **not** call
  `StartRun`, does **not** call Maps / Parallel / Facebook / crawl, returns
  `429` with `research_wait_until` = oldest of the five enqueue start times + 30
  minutes; prior live business profile stays. After that instant,
  `GET .../profile` and SSE include `research_wait_until`; Review shows the
  inline wait and Continue still works. A River retry of an existing ETL run
  does not create a new `enqueue_id`. A 6th enqueue after `research_wait_until`
  succeeds.
- **Fail**: job error → `etl.runs.status=error`; onboarding session stays
  `client_interviewing`; prior live business profile kept. Enqueue cap is not
  this Fail.
- **Mocked**: Google Maps Details / scrape, Vercel Parallel Search + crawl
  Extract HTTP, Facebook, Instagram, trade registry, photo classifier /
  usable-as-a-Project classify (fakes). Never Parallel **Search** API, Exa,
  Perplexity,
  Tako, `:online`, OpenRouter web search. Maps Details reviews usable as a
  Project appear as client interview cards (paid Maps/LLM faked). Open
  `/onboarding/interview` before scrape finishes: empty marketing phone fills;
  scrape reviews land on the reviews list without reload. After Details
  transform writes `in_pool` reviews: schema `jobs` has one
  `reviews_ranking_for_display` on this `tenant_id` (orchestration, not
  transform). Transform does not write `is_top` / `top_position`.
