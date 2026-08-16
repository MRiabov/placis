# 02a — Fast pre-search + research (integration test)

- **Setup**: an onboarding session + selected company (from 01a), consent given.
- **Invoke**: trigger the fast pre-search + research slots (background jobs).
- **Assert**: one `research_run` per slot; `research_sources` (`kind`, `source_ref`, `raw`+
  `normalized`, `confidence`); `google_places_cache` written; the review state returns immediately
  (doesn't block on provider latency) and each slot clears its "lookup in progress" row; progress
  events stream as rows load.
- **Mocked**: Perplexity/Sonar pre-search, Apify scrape, OpenRouter agent, Facebook, crawl, photo
  classification, trade-accreditation lookup (all fakes returning fixtures).
