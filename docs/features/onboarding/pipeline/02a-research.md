# 02a — Fast pre-search + research (async, parallel)

Kicked off the moment 01a completes, before the interview. The review state returns immediately;
research fills the checklist rows in the background and streams progress.

- **Fast pre-search** — Perplexity `sonar` (or `sonar-pro-search`) returns a first extract in ~3–4s:
  trading name, founder/owner, trade, service-area hints, website, likely Google Maps, Facebook,
  Instagram, LinkedIn, accreditations, public photos, directories. A miss is
  `not_found_in_fast_search` ("ask"), never "the business has no profile".
- **Google Places** — details for the selected place.
- **Scrape + agent** — Apify scrape, plus an OpenRouter agent (DeepSeek + web tools) for open-ended
  context.
- **Website crawl**, **Facebook** page lookup, **trade accreditation** (deterministic by country +
  trade: CRO, Safe Electric, RGI, SEAI, VCR/CIRI), **photo classification**.

- **Persists** one `research_run` (provider) + `research_events` + `research_sources` per slot, plus
  `google_places_cache`; each slot clears its own "lookup in progress" row when it finishes.
