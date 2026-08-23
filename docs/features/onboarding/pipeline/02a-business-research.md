# 02a — Business research (async, parallel)

Starts the moment 01a confirm returns, **before** and **during** review + client interview. The review
screen paints immediately; checklist rows fill as research jobs finish. Progress goes over the
onboarding session SSE stream.

## Research jobs (parallel)

One `business_research_run` per research job. `place_id` (Google’s id) is on the run when a Google
Maps listing was selected. Registry-only onboarding sessions still get `business_research_runs`.

| Research job | Writes into the profile / checklist | `business_research_sources.kind` |
| --- | --- | --- |
| Google listing | Maps profile, marketing phone, website, opening hours, reviews, photos | `google_maps_listing` |
| Facebook | Facebook profile / URL | `facebook` / `social_profile` |
| Services and area | trade, services, service area | `website_crawl` / `directory` |
| Founder | founder | `directory` |
| Accreditations | trade-registry certifications | `trade_registry` |
| Reviews and photos | reviews, rating, photos | `review` / `photo` |

Google Maps, the company registry, Facebook, the LLM, and fakes sit behind one interface: Google
Maps Details (upsert `google_maps_listings`; scrape when Maps is not configured),
an OpenRouter fast extract (LLM over retrieved text), Facebook lookup,
photo classification, trade-registry lookups (Safe Electric, RGI, … for IE; Gas Safe, NICEIC, …
for GB). When a job must **discover** a URL or listing and we do not already have `place_id` or a
known website URL, that hop is **Parallel** — the search engine for our agents, called through
OpenRouter (`openrouter:web_search`, engine Parallel). Do not call Parallel’s API directly, and do
not use Exa, Perplexity, a model's built-in search, `:online`, or OpenRouter web search with any other
engine. A miss is "ask", never "this business has no profile".

Before any **external** fetch, look up `business_research_fetches` by kind + stable key (and
`google_maps_listings` by `place_id` on the Maps path). Hit → reuse `raw`; do not call Google Maps
Details, scrape, Facebook, crawl, or Parallel again. Still write `business_research_runs` +
`business_research_sources` for this onboarding session. Company registry parquet and Find
autocomplete are not this cache. No TTL.

Instagram / LinkedIn may appear inside a fast extract; they are **not** persisted kinds unless a
research job writes a `social_profile` row.

Each research job is its own River job (retryable). When it finishes it writes
`business_research_events` + `business_research_sources` (`kind`, `external_id`, `source_ref`,
lookup `status`, `confidence`; `raw` only when there is no listing or reviews table) and clears
in-progress on the checklist. The Google listing job also upserts `google_maps_listings` (columns
+ `raw` ETL cache), `google_maps_listing_opening_hours`, and `google_maps_listing_reviews`. The
reviews job writes further review rows when Google Maps Details did not already return them. Lookup outcomes
(`matched` / `ambiguous` / `not_found` / `not_attempted` / `blocked` / `error`) live on the
source row’s `status` — not as extra tables.

- **Persists** `business_research_runs` (`place_id` on the Maps path), `business_research_events`,
  `business_research_sources`, `business_research_fetches` (on a cache miss), `google_maps_listings`
  (plus hours and reviews). Profile deltas go through 03.
