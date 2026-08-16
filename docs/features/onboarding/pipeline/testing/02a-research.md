# 02a — Research (integration test)

- **Setup**: an onboarding session from 01a, with consent given.
- **Invoke**: trigger the research run (background job).
- **Assert**: `research_sessions` → `research_runs` (provider) → `research_sources` (`kind`,
  `source_ref`, `raw`+`normalized`, `confidence`); `google_places_cache` written for the place.
- **Mocked**: Apify scrape, OpenRouter/Perplexity, Facebook, crawl, photo classification — fakes
  returning fixtures.
