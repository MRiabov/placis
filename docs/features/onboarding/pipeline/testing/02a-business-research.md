# 02a — Business research (integration test)

- **Setup**: an onboarding session + selected company (from 01a), online research consent given.
- **Invoke**: confirm returns; business research jobs run as background jobs.
- **Assert**: review/checklist reads succeed before jobs finish; one `business_research_run` per
  job; `business_research_sources` (`kind`, `source_ref`, lookup `status`, `confidence`);
  `google_maps_listings` upserted when a place was selected (columns + `raw` ETL cache, hours
  rows, review rows); `place_id` on the run on the Maps path; each job clears in-progress on the
  checklist; SSE emits progress as rows load; a second attach of the same `place_id` (and the same
  scrape query / Facebook URL / crawl URL / Parallel query) does not call the fake and still writes
  a `business_research_run` + `business_research_sources` row; `business_research_fetches` is reused
  on the hit.
- **Mocked**: Maps, scrape, OpenRouter (Parallel search + extract), Facebook, photo classification,
  trade-registry lookup (all fakes returning fixtures). Do not fake Parallel’s own API.
