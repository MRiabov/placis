# Website crawl — integration test

- **Verify**: onboarding `StartRun` with `website_crawl` writes
  `etl.website_crawl_fetches` with `fetched_from` (`parallel_extract` and
  `http_get` for the homepage first; `robots_txt` / `sitemap` for discovery;
  remainder HTML URLs as they complete) and `requested_url` (resolved
  absolute URL of that fetch). Live `etl.website_crawl_pages` `html_url`
  `fetched` for the homepage **before** the remainder extract finishes;
  `latest_extract_fetch_id` / `latest_html_fetch_id` /
  `latest_apify_fetch_id` are watermarks of the dumps that contributed.
  Live profile increments (trade / services / service area) after the
  homepage transform. Cap is **20 HTML URLs** (sitemap/robots GETs do not
  count). Retry of this `run_id` does not re-Extract / re-GET a
  `(requested_url, fetched_from)` that landed; remaining `discovered`
  `html_url` rows still run. A Monday / Wednesday /
  Friday `StartRun` does not include this ETL run kind. Extract does not write
  the live business profile. Transform does not call crawl / Extract / GET
  fakes. Project skip lives on `etl.llm_source_to_project_classifications`, not
  fetches or live HTML URLs. Extract + HTML insert two `etl.sources`. Image GETs
  are bounded (8).
- **Fake**: Parallel Extract HTTP, own GET / goquery fixtures, Apify
  webpage scraper (GET-fail path). Never Parallel **Search** API, Exa,
  Perplexity, Tako, `:online`, OpenRouter web search. CI does not measure API
  p90 during crawl (SLO is operational:
  [processes](../../../../general-architecture/processes.md)).

Named tables: `business_profile_edit_sources`, `business_profile_edits`,
`business_profiles`, `etl.imported_media`, `etl.runs`,
`etl.website_crawl_page_photos`, `imported_media_sources`.
