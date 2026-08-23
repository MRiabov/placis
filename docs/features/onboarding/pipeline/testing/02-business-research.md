# 02 — Business research (integration test)

- **Setup**: 01 Confirm has returned; `online_research_consent_at` set.
- **Invoke**: Confirm returns; business research jobs run as background jobs. Also: attach/change
  sources six times inside 30 minutes on the same tenant.
- **Assert**: confirm data / checklist reads succeed before jobs finish; one `business_research_waves`
  row per enqueue and several `business_research_runs` (one per job) sharing that `wave_id`; cache hit
  on `business_research_fetches` (kind + key) skips the external call and still writes run +
  `business_research_sources` for this onboarding session; Maps path upserts
  `google_maps_listings` (+ hours, review rows); `place_id` on the run on the Maps path; each job
  clears in-progress on the checklist projection; photo classification tags found photos (hero /
  project / service / founder / logo); profile increments go through build-profile (conflict does
  not move the fold). Waves 1–5 insert `business_research_waves` and enqueue jobs. The 6th enqueue
  in 30 minutes does **not** insert a wave, does **not** call Maps / Parallel / Facebook / crawl,
  returns `429` with `research_wait_until` = oldest of the five `started_at` + 30 minutes; prior
  fold stays. After that instant, `GET .../profile` and SSE include `research_wait_until`; confirm
  data shows the inline wait and Continue still works. A River retry of an existing run does not
  insert a wave. A 6th wave after `research_wait_until` succeeds.
- **Fail**: job error → source `status=error`; onboarding session stays `client_interviewing`; prior fold
  kept. Wave cap is not this Fail.
- **Mocked**: Google Maps Details / scrape, OpenRouter Parallel + extract, Facebook, trade
  registry, photo classifier (fakes). Never Parallel’s API, Exa, Perplexity, `:online`.
