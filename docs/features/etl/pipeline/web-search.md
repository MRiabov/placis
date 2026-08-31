# Web search

`etl_run_kind=web_search`. First-run only (onboarding 02). One means in the
[registry](means.md): Parallel discovery of **empty** identity keys. Not a
profile dump. Shared extract / transform rules:
[pipeline README](README.md).

## Trigger

Input set met: any of `legal_name`, `display_name`, `company_number` (+
country). Do not start when every discoverable identity key is already set
(`place_id`, `website_url`, Facebook URL, Instagram handle). Monday /
Wednesday / Friday does not enable this means.

## Pre

- `etl.runs` row `status=pending` (or retry) after the evaluator started this
  means.
- Onboarding 02 enqueue.

## Must not

- Call Parallel’s API directly.
- Use Exa, Perplexity, Tako, a model’s built-in search, `:online`, or OpenRouter
  web search.
- Run on the Monday / Wednesday / Friday schedule.
- Treat a miss as “this business has no profile” — a miss is “ask”.
- Wait until Parallel finishes before other means that already have an input
  set start.
- Overwrite a Find-attached `place_id` or `website_url`. Empty identity keys
  fill.
- Write Parallel prose onto the business profile.
- Start this means to rediscover identity the contractor already typed when no
  empty identity keys remain (pause / no-op).

## Do — extract

Set `status=extracting`. Call Parallel through Vercel AI Gateway
(`gateway.tools.parallelSearch()`, any model). Seed from what is already known:
company registry identity (`legal_name`, `company_number`, country,
`registered_office`) and/or Maps `display_name` + country. Company number alone
is enough to discover a `place_id` and website URL. A Maps pick is enough to
discover Facebook / Instagram / a missing website URL. Parallel is not instant.
Persist each **new** empty identity key as it arrives (onboarding session attach
and live profile when that column was empty). Evaluator starts Maps / crawl /
Facebook / Instagram on this enqueue when their input set becomes true. A
generation call over retrieved text (no search tools) may classify that text; it
is not the ETL fast extract of Maps / crawl. Retry of this `run_id` does not search
again for a result that already landed.

## Do — transform

Do not write Parallel prose onto the profile. New identity keys are enough. Maps
that already have `place_id` keep extracting in parallel with Search.

## Persist

`etl.runs` timestamps / error. New empty `place_id` / `website_url` / Facebook /
Instagram identity keys on the onboarding session attach (and live profile
columns when empty).

## Fail

Retryable. `status=error` when retries exhaust. Do not invent a business.

## Out

Onboarding SSE mirrors Postgres on change (`etl.runs` and discovered identity
keys). Downstream means start when their input set exists.

## Invariants

- Parallel only via the Vercel AI Gateway server tool.
- Web search does not write `business_profile_*`.
- Maps Find and company registry Find can both start this means when an
  identity key is still empty.
- The first discovered **missing** identity key starts Maps / crawl without
  waiting for Parallel to finish.
