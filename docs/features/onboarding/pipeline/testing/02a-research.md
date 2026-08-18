# 02a — Research (integration test)

- **Setup**: an onboarding session + selected company (from 01a), consent given.
- **Invoke**: confirm returns; research slots run as background jobs.
- **Assert**: review/checklist reads succeed before slots finish; one `research_run` per slot;
  `research_sources` (`kind`, `source_ref`, `raw`+`normalized`, `confidence`);
  `google_places_cache` written when a place was selected; `research_sessions` written only on
  the Maps path; each slot clears in-progress on the checklist; SSE emits progress as rows load.
- **Mocked**: Places, scrape, OpenRouter extract, Facebook, photo classification, trade-registry
  lookup (all fakes returning fixtures).
