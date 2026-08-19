# 02a — Business research (async, parallel)

Starts the moment 01a confirm returns, **before** and **during** review + client interview. The review
screen paints immediately; checklist rows fill as research jobs finish. Progress goes over the onboarding
session SSE stream.

## Research jobs (parallel)

One `research_run` per research job. A `research_sessions` row exists only when a Google Place was
selected (keyed by `place_id`). Registry-only onboarding sessions still get `research_runs`.

| Research job | Writes into the profile / checklist | `research_sources.kind` |
| --- | --- | --- |
| Google listing | Maps profile, phone, website, opening hours, reviews, photos | `google_places` |
| Facebook | Facebook profile / URL | `facebook` / `social_profile` |
| Services and area | trade, services, service area | `website_crawl` / `directory` |
| Founder | founder | `directory` |
| Accreditations | trade-registry certifications | `trade_registry` |
| Reviews and photos | reviews, rating, photos | `review` / `photo` |

Providers sit behind one interface with fakes: Google Places Details (cached in
`google_places_cache`), optional scrape when Places is not configured, an OpenRouter fast
extract, Facebook lookup, photo classification, trade-registry lookups (Safe Electric, RGI, …
for IE; Gas Safe, NICEIC, … for GB). A miss is "ask", never "this business has no profile".

Instagram / LinkedIn may appear inside a fast extract; they are **not** persisted kinds unless a
research job writes a `social_profile` row.

Each research job is its own River job (retryable). When it finishes it writes `research_events` +
`research_sources` (`kind`, `external_id`, `source_ref`, `raw` + `normalized`, `confidence`) and
clears in-progress on the checklist. Lookup outcomes (`matched` / `ambiguous` / `not_found` /
`not_attempted` / `blocked` / `error`) live on the source row's `normalized` payload — not as
extra tables.

- **Persists** `research_sessions` (Maps path only), `research_runs`, `research_events`,
  `research_sources`, `google_places_cache`. Profile deltas go through 03.
