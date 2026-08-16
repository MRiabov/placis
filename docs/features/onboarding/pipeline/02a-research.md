# 02a — Research (async, parallel)

Kicked off the moment 01a completes, in the background. We look the business up **and** scrape it.

- **Google Places** — selected-place lookup (full details of the place chosen in 01a); cached in
  `google_places_cache`.
- **Web research** — Apify scrape + an OpenRouter agent (DeepSeek with web tools), or Perplexity
  `sonar` / `sonar-pro-search`.
- **Facebook** page lookup; **website crawl**; **photo classification** (hero/project/service/
  founder/logo).

- **Persists** `research_sessions` (status) → `research_runs` (provider) → `research_events` →
  `research_sources` (`kind`, `external_id`, `source_ref`, `raw` + `normalized` jsonb,
  `confidence`), plus `google_places_cache`.
