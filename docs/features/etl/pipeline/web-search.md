# Web search

`etl_run_kind=web_search`. First-run only (onboarding 02). One ETL run kind in
[ETL run kind triggers](etl-kind-triggers.md): Parallel discovery of **empty**
details. Not a profile dump. Shared extract / transform rules:
[pipeline README](README.md).

## Trigger

Starts when (any of): `legal_name`, `display_name`, `company_number` (+
country). Do not start when every discoverable detail is already set
(`place_id`, `website_url`, Facebook URL, Instagram handle). Monday /
Wednesday / Friday does not enable this ETL run kind.

## Pre

- `etl.runs` row `status=pending` (or retry) after the evaluator started this
  ETL run kind.
- Onboarding 02 enqueue.

## Must not

- Call Parallel’s API directly.
- Use Exa, Perplexity, Tako, a model’s built-in search, `:online`, or OpenRouter
  web search.
- Run on the Monday / Wednesday / Friday schedule.
- Treat a miss as “this business has no profile” — a miss is “ask”.
- Wait until Parallel finishes before other ETL run kinds that already have their
  details start.
- Overwrite a Find-attached `place_id` or `website_url`. Empty details fill.
- Write Parallel prose onto the business profile.
- Start this ETL run kind to rediscover identity the contractor already typed when
  no empty details remain (pause / no-op).

## Do — extract

Set `status=extracting`. Call Parallel through Vercel AI Gateway
(`gateway.tools.parallelSearch()`, any model). Seed from what is already known:
company registry identity (`legal_name`, `company_number`, country,
`registered_office`) and/or Maps `display_name` + country. Company number alone
is enough to discover a `place_id` and website URL. A Maps pick is enough to
discover Facebook / Instagram / a missing website URL. Parallel is not instant.
Persist each **new** empty detail as it arrives (onboarding session attach and
live profile when that column was empty). Evaluator starts Maps / crawl /
Facebook / Instagram on this enqueue when they can start. A generation call over
retrieved text (no search tools) may classify that text; it is not the fast
extract of Maps / crawl. Retry of this `run_id` does not search again for a
result that already landed.

## Do — transform

Do not write Parallel prose onto the profile. New details are enough. Maps that
already have `place_id` keep extracting in parallel with Search.

## Persist

`etl.runs` timestamps / error. New empty `place_id` / `website_url` / Facebook /
Instagram details on the onboarding session attach (and live profile columns
when empty).

## Fail

Retryable. `status=error` when retries exhaust. Do not invent a business.

## Out

Onboarding SSE mirrors Postgres on change (`etl.runs` and discovered details).
Downstream ETL run kinds start when they have the details they need.

## Invariants

- Parallel only via the Vercel AI Gateway server tool.
- Web search does not write `business_profile_*`.
- Maps Find and company registry Find can both start this ETL run kind when a
  detail is still empty.
- The first discovered **missing** detail starts Maps / crawl without waiting
  for Parallel to finish.
