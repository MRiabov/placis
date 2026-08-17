# 02a — Fast pre-search + research (async, parallel)

Kicked off the moment 01a completes, before the interview. The review state returns immediately;
research fills the checklist rows in the background and streams progress.

- **Fast pre-search** — Perplexity `sonar` (or `sonar-pro-search`) returns a first extract in ~3–4s:
  trading name, founder/owner, trade, service-area hints, website, likely Google Maps, Facebook,
  Instagram, LinkedIn, accreditations, public photos, directories. A miss is
  `not_found_in_fast_search` ("ask"), never "the business has no profile".
- **Google Places** — details for the selected place.
- **Scrape + agent** — Apify scrape (incl. bounded Google Maps coverage), plus an OpenRouter agent
  (DeepSeek + web tools) for open-ended context.
- **Website crawl** — the contractor's current site (page excerpts, image URLs, schema.org).
- **Facebook** page lookup; **photo classification** (hero/project/service/founder/logo).
- **Registry directory** — country/trade-configured lookups: company registries (CRO/CORE for IE,
  Companies House for GB, US state registries) and trade registries (Safe Electric, RGI, SEAI,
  VCR/CIRI for IE; Gas Safe, NICEIC, MCS, TrustMark, NAPIT, FMB for GB). Each returns a closed
  `lookup_status` (`matched`/`ambiguous`/`not_found`/`not_attempted`/`blocked`/`error`) and folds
  into a `registry_completeness` report (attempted / matched / not_attempted +
  `needs_first_party_confirmation`).

- **Persists** one `research_run` (provider) + `research_events` + `research_sources` per slot, plus
  `google_places_cache`; each slot clears its own "lookup in progress" row when it finishes.
