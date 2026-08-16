# 02a — Research (async, parallel)

Kicked off the moment 01a completes, in the background. We look the business up **and** scrape it.

- **Company registry** — Companies House / CRO data pre-generated into **parquet** files; queried at
  runtime (Go reads parquet — the `polars` equivalent — no per-lookup registry API).
- **Google Places** — selected-place lookup + autocomplete; cached in `google_places_cache`.
- **Web research** — Apify scrape + an OpenRouter agent (DeepSeek with web tools), or Perplexity
  `sonar` / `sonar-pro-search`.
- **Facebook** page lookup; **website crawl**; **photo classification** (hero/project/service/
  founder/logo).

- **Persists** `research_sessions` (status) → `research_runs` (provider) → `research_events` →
  `research_sources` (`kind`, `external_id`, `source_ref`, `raw` + `normalized` jsonb,
  `confidence`), plus `google_places_cache`.
