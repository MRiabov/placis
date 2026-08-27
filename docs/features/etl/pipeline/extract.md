# Extract

Fetch the source. Write an append-only fetch row. Do not write the business profile.

## Trigger

`StartRun` inserted `etl.runs` for this `kind` and enqueued the extract River job. Same for
onboarding 02 and Monday / Wednesday / Friday.

## Pre

- `etl.runs` row `status=pending` (or retry of `extracting`).
- `kinds` was explicit (length ≥ 1). Scheduled: skip (`status=skipped`) when the kind has no key
  (`place_id`, Facebook URL / handle, Instagram handle).

## Must not

- Import `profile` or write `business_profile_*` / photo classification.
- Call Parallel’s API; use Exa, Perplexity, Tako, a model’s built-in search, `:online`, or
  OpenRouter web search. Discovery without `place_id` or a known website URL is Parallel through
  Vercel AI Gateway only (onboarding 02 kinds that need it).
- Refetch on retry of **this** `run_id` when a fetch row for this run already exists.
- Skip extract because an older scheduled fetch exists (`trigger=scheduled` always extracts).
- Dump `raw` onto listing / profile / post live tables.

## Do

Set `status=extracting`. Call the adapter (Google Maps Details, scrape fallback, Facebook lookup,
Instagram scrape, crawl, trade registry). Insert a new fetch row (UUID, typed metadata, `raw`,
`run_id`, `fetched_at`). Maps kind continues at [maps-listing](maps-listing.md). Then enqueue
transform for this `run_id`.

Instagram is public scrape. Graph API is later. Facebook is the existing lookup, not Graph.

## Persist

The matching `*_fetches` table. `etl.runs` timestamps / error.

## Fail

Retryable River job. Same `run_id`. Leave prior listing / profile. `status=error` when retries
exhaust.

## Out

Transform job for this kind, or `skipped`.

## Invariants

- One extract job per `etl.runs` row.
- Fetch rows are append-only.
- Extract does not write the live business profile.
