# Web search

`etl_run_kind=web_search`. First-run only (onboarding 02). Parallel discovery
when we do not already have `place_id` or a known website URL. Shared extract /
transform rules:
[pipeline README](README.md).

## Trigger

`StartRun` included this ETL run kind because Maps / crawl have no key yet (02: missing
`place_id` **or** missing website URL on the onboarding session).

## Pre

- `etl.runs` row `status=pending` (or retry).
- 02 included this ETL run kind because the onboarding session lacked `place_id` **or**
  lacked `website_url` at `StartRun`. If both keys exist by the time this job
  runs, `skipped` (Maps / crawl already unblocked).

## Must not

- Call Parallel’s API directly.
- Use Exa, Perplexity, Tako, a model’s built-in search, `:online`, or OpenRouter
  web search.
- Run on the Monday / Wednesday / Friday schedule.
- Treat a miss as “this business has no profile” — a miss is “ask”.
- Wait until Parallel finishes before unblocking Maps / crawl.

## Do — extract

Set `status=extracting`. Call Parallel through Vercel AI Gateway
(`gateway.tools.parallelSearch()`, any model). Parallel is not instant. Persist
each discovered key as it arrives onto the **already-inserted** sibling run
(`place_id` on `google_maps_listing`, `website_url` on `website_crawl`) **and**
the onboarding session attach. Not a profile dump. A generation call over
retrieved text (no search tools) may classify that text; it is not the fast
extract of Maps / crawl. Retry of this `run_id` does not search again for a
result that already landed.

## Do — transform

Do not write Parallel prose onto the profile. As soon as a `place_id` or URL
lands, it is a key for [Google Maps](google-maps.md) or [website crawl](website-crawl.md) in the **same**
`StartRun` (already-inserted `etl.runs` rows). That is not a new enqueue. Do not
wait for `web_search` `status=succeeded`.

## Persist

`etl.runs` timestamps / error. Discovered `place_id` / `website_url` on the
sibling Maps / crawl runs and the onboarding session. Facebook / Instagram
handles from Search land on those sibling runs the same way.

## Fail

Retryable. `status=error` when retries exhaust. Do not invent a business.

## Out

Onboarding SSE mirrors Postgres on change (`etl.runs` and discovered keys).
Downstream ETL run kinds start when their key exists.

## Invariants

- Parallel only via the Vercel AI Gateway server tool.
- Web search does not write `business_profile_*`.
- The first discovered key unblocks Maps / crawl without waiting for Parallel to
  finish.
