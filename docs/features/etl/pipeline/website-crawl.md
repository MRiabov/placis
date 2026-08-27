# Website crawl

`kind=website_crawl` and `kind=directory`. First-run only (onboarding 02). Not on Monday /
Wednesday / Friday. Shared extract / transform rules: [pipeline README](README.md).

Existing-site crawl and directory lookup are one operation group: trade, services, service area,
founder. Company registry parquet / Find autocomplete are not this file.

## Trigger

`StartRun` included `website_crawl` and/or `directory`. No known website URL and no directory
key → that kind is not started until [web search](web-search.md) discovers a URL (same enqueue,
not a new `StartRun`).

## Pre

- `etl.runs` row `status=pending` (or retry).
- `business_profiles` row for `tenant_id` before transform.

## Must not

- Run on the Monday / Wednesday / Friday schedule.
- Call Parallel from this kind ([web-search](web-search.md) discovers a URL first).
- Call Maps / Facebook / Instagram from this kind.
- Write `registered_office` from crawl text.
- Overwrite a live profile field whose winning `algorithm` is `human`.
- Wait for slow crawl before transforming the fast crawl chunk.

## Do — extract (fast crawl)

Set `status=extracting`. Fetch the canonical existing-site URL (first response, ~1s). Insert
`etl.website_crawl_fetches` (UUID, that canonical URL, `raw`, `run_id`, `fetched_at`). Transform
this chunk immediately. Retry of this `run_id` does not refetch a URL that already has a fetch
row.

## Do — extract (slow crawl)

Continue other URLs on the existing site (~40s extra). Persist a fetch as each URL arrives.
Transform **that** URL before waiting for the rest. Directory lookup (when started) is the same
as-they-arrive rule. `status=succeeded` when there are no more URLs.

## Do — transform

`status=transforming` for the chunk, then back to `extracting` if slow crawl continues. Fill
empty trade, description, services, service areas, founder, marketing email, existing site URL
via [build-profile](../../onboarding/pipeline/build-profile.md). Disagreeing owner-typed
scalars → research conflict.

## Persist

`etl.website_crawl_fetches` (several rows per run: one per crawled canonical URL);
`business_profile_edits` + live profile / list rows.
`etl.runs.status=succeeded` when fast crawl and slow crawl are done.

## Fail

Retryable. Prior live business profile stays. Retry reuses fetches that landed; remaining URLs still run.
`status=error` when retries exhaust.

## Out

Onboarding SSE mirrors Postgres on change (`etl.runs` and the live business profile). Fast crawl fills what the
first response supports; slow crawl adds trade / services / service area as URLs arrive.

## Invariants

- First-run only.
- Extract does not write the live business profile.
- Transform of the fast crawl chunk does not wait for slow crawl.
