# 02a — Business research (integration test)

- **Setup**: an onboarding session + selected company (from 01a), online research consent given.
- **Invoke**: confirm returns; business research slots run as background jobs.
- **Assert**: review/checklist reads succeed before slots finish; one `business_research_run` per
  slot; `business_research_sources` (`kind`, `source_ref`, `raw`, lookup `status`, `confidence`);
  `google_maps_listing_cache` written when a place was selected; `place_id` on the run on the Maps
  path; each slot clears in-progress on the checklist; SSE emits progress as rows load.
- **Mocked**: Maps, scrape, OpenRouter extract, Facebook, photo classification, trade-registry
  lookup (all fakes returning fixtures).
