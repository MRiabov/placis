# Web search

`etl_run_kind=web_search`. First-run only (onboarding 02). Parallel discovery
for **both** Find sources: a Google Maps pick **and** a company registry record.
Not only when a key is missing. Shared extract / transform rules:
[pipeline README](README.md).

## Trigger

`StartRun` included this ETL run kind (02 always passes it). Monday /
Wednesday / Friday does not.

## Pre

- `etl.runs` row `status=pending` (or retry).
- Onboarding 02 enqueue. Do **not** skip because `place_id` or `website_url`
  already exists (Maps extract may already be running).
## Must not

- Call Parallel’s API directly.
- Use Exa, Perplexity, Tako, a model’s built-in search, `:online`, or OpenRouter
  web search.
- Run on the Monday / Wednesday / Friday schedule.
- Treat a miss as “this business has no profile” — a miss is “ask”.
- Wait until Parallel finishes before unblocking Maps / crawl that still lack a
  key.
- Overwrite a Find-attached `place_id` or `website_url`. Empty sibling keys
  fill; Facebook / Instagram handles still land when those runs have no key.
- Skip this ETL run kind because the contractor picked Maps on Find.

## Do — extract

Set `status=extracting`. Call Parallel through Vercel AI Gateway
(`gateway.tools.parallelSearch()`, any model). Seed the search from what 01
already attached: company registry identity (`legal_name`, `company_number`,
country, `registered_office`) and/or Maps `display_name` + country. Company
number alone is enough to discover a `place_id` and website URL. A Maps pick
is enough to discover Facebook / Instagram / a missing website URL. Parallel is
not instant. Persist each **new** key as it arrives onto the
**already-inserted** sibling run (`place_id` on `google_maps_listing` only if
empty, `website_url` on `website_crawl` only if empty, Facebook / Instagram
handles the same way) **and** the onboarding session attach when that column
was empty. Not a profile dump. A generation call over retrieved text (no search
tools) may classify that text; it is not the ETL fast extract of Maps / crawl.
Retry of this `run_id` does not search again for a result that already landed.

## Do — transform

Do not write Parallel prose onto the profile. As soon as a missing `place_id`
or URL lands, it is a key for [Google Maps](google-maps.md) or [website
crawl](website-crawl.md) in the **same** `StartRun` (already-inserted
`etl.runs` rows). That is not a new enqueue. Do not wait for `web_search`
`status=succeeded`. Maps that already have `place_id` keep extracting in
parallel with Search.

## Persist

`etl.runs` timestamps / error. New `place_id` / `website_url` / Facebook /
Instagram keys on sibling runs and the onboarding session (empty columns only).

## Fail

Retryable. `status=error` when retries exhaust. Do not invent a business.

## Out

Onboarding SSE mirrors Postgres on change (`etl.runs` and discovered keys).
Downstream ETL run kinds start when their key exists.

## Invariants

- Parallel only via the Vercel AI Gateway server tool.
- Web search does not write `business_profile_*`.
- Maps Find and company registry Find both run this kind.
- The first discovered **missing** key unblocks Maps / crawl without waiting for
  Parallel to finish.
