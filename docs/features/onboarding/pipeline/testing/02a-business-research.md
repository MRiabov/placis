# 02a — Business research (integration test)

- **Setup**: an onboarding session + selected company (from 01a), online research consent given.
- **Invoke**: confirm returns; business research jobs run as background jobs.
- **Assert**: review/checklist reads succeed before jobs finish; one `business_research_run` per
  job; `business_research_sources` (`kind`, `source_ref`, lookup `status`, `confidence`);
  `google_maps_listings` upserted when a place was selected (columns + `raw` ETL cache);
  `place_id` on the run on the Maps path; each job clears in-progress on the checklist; SSE emits
  progress as rows load.
- **Mocked**: Maps, scrape, OpenRouter extract, Facebook, photo classification, trade-registry
  lookup (all fakes returning fixtures).
