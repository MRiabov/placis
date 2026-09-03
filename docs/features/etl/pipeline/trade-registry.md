# Trade registry

`etl_run_kind=trade_registry`. First-run only (onboarding 02). Not on Monday /
Wednesday / Friday. Shared extract / transform rules:
[pipeline README](README.md).

Accreditations. A later official registry API is its own fetch table.

## Trigger

Starts when (any of) ([ETL run kind triggers](etl-run-kind-triggers.md)):
`company_number` + tenant country; **or** `display_name` + country. Maps-only
Find still starts this ETL run kind when a name exists. Neither tuple → not
started until Maps fills a name; nothing left that can produce a name →
`insufficient_data_for_lookup`. A miss is “ask”. The locked business-registry
certification on Find
(CRO in Ireland) is 01 from the company registry pick, not this extract. Monday
/ Wednesday / Friday does not enable this ETL run kind.

## Pre

- `etl.runs` row `status=pending` (or retry).
- `business_profiles` row for `tenant_id` before transform.

## Must not

- Run on the Monday / Wednesday / Friday schedule.
- Call Maps / Facebook / Instagram / Parallel from this ETL run kind.
- Let crawl overwrite a trade-registry accreditation.
- Overwrite a live profile field whose winning `algorithm` is `human`.

## Do — extract

`extract/traderegistry.Run` sets `status=extracting`. Trade-registry
lookup. Insert `etl.trade_registry_fetches` (UUID,
`trade_registry_record_id`, `raw`, `run_id`, `fetched_at`). Retry of this
`run_id` does not insert a second fetch for a `trade_registry_record_id`
that already landed. Transform as soon as that fetch exists.

## Do — transform

`transform/traderegistry.Run` sets `status=transforming`. Insert
`etl.sources` `source_kind=trade_registry_record` when this extract writes
profile columns. Write accreditation list / notes (each increment cites
that `source_id`). Trade registry wins the same way the company registry
record wins legal identity
([build-profile](../../onboarding/pipeline/build-profile.md)).

## Reads

`etl.runs`; `etl.trade_registry_fetches` for this `run_id` (retry);
`business_profiles`.

## Inserts

Extract **inserts** `trade_registry_transform` after the fetch lands.

## Persist

Extract **persists into** `etl.trade_registry_fetches`; `etl.sources`.
Transform **persists into** `business_profile_edits` +
`business_profile_edit_sources` + accreditation live profile / list.
**Persists into** `etl.runs.status=succeeded`.

## Fail

Retryable. Prior live business profile stays. `status=error` when retries
exhaust.

## Out

Onboarding SSE mirrors Postgres on change (`etl.runs` and the live business
profile).

## Invariants

- First-run only.
- Extract does not write the live business profile.
