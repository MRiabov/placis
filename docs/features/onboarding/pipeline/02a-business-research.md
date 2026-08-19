# 02a — Business research (async, parallel)

Starts the moment 01a confirm returns, **before** and **during** review + client interview. The review
screen paints immediately; checklist rows fill as research jobs finish. Progress goes over the onboarding
session SSE stream.

## Research jobs (parallel)

One `business_research_run` per research job. `place_id` (Google’s id) is on the run when a Google
Maps listing was selected. Registry-only onboarding sessions still get `business_research_runs`.

| Research job | Writes into the profile / checklist | `business_research_sources.kind` |
| --- | --- | --- |
| Google listing | Maps profile, phone, website, opening hours, reviews, photos | `google_maps_listing` |
| Facebook | Facebook profile / URL | `facebook` / `social_profile` |
| Services and area | trade, services, service area | `website_crawl` / `directory` |
| Founder | founder | `directory` |
| Accreditations | trade-registry certifications | `trade_registry` |
| Reviews and photos | reviews, rating, photos | `review` / `photo` |

Google Maps, the company registry, Facebook, the LLM, and fakes sit behind one interface: Google
Maps Details (cached in `google_maps_listing_cache`), optional scrape when Maps is not configured,
an OpenRouter fast extract, Facebook lookup, photo classification, trade-registry lookups (Safe
Electric, RGI, … for IE; Gas Safe, NICEIC, … for GB). A miss is "ask", never "this business has
no profile".

Instagram / LinkedIn may appear inside a fast extract; they are **not** persisted kinds unless a
research job writes a `social_profile` row.

Each research job is its own River job (retryable). When it finishes it writes
`business_research_events` + `business_research_sources` (`kind`, `external_id`, `source_ref`,
`raw`, `status`, `confidence`) and clears in-progress on the checklist. Lookup outcomes
(`matched` / `ambiguous` / `not_found` / `not_attempted` / `blocked` / `error`) live on the
source row’s `status` — not as extra tables.

- **Persists** `business_research_runs` (`place_id` on the Maps path), `business_research_events`,
  `business_research_sources`, `google_maps_listing_cache`. Profile deltas go through 03.
