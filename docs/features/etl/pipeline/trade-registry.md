# Trade registry

`etl_run_kind=trade_registry`. First-run only (onboarding 02). Not on Monday /
Wednesday / Friday. Shared extract / transform rules: [pipeline README](README.md).

Accreditations. A later official registry API is its own fetch table.

## Trigger

`StartRun` included this ETL run kind (onboarding 02 always passes it). Lookup
key, in order: onboarding session `company_number` + tenant country; else live
`display_name` + country (Maps autocomplete or Details). Maps-only Find still
runs this ETL run kind. No `company_number` and no `display_name` yet → stay
pending until Maps fills a name; after Maps / web search finish, still none →
`skipped`. A miss is “ask”. The locked business-registry certification on Find
(CRO in Ireland) is 01 from the company registry pick, not this extract.
## Pre

- `etl.runs` row `status=pending` (or retry).
- `business_profiles` row for `tenant_id` before transform.

## Must not

- Run on the Monday / Wednesday / Friday schedule.
- Call Maps / Facebook / Instagram / Parallel from this ETL run kind.
- Let crawl overwrite a trade-registry accreditation.
- Overwrite a live profile field whose winning `algorithm` is `human`.

## Do — extract

Set `status=extracting`. Trade-registry lookup. Insert
`etl.trade_registry_fetches` (UUID, registry id, `raw`, `run_id`, `fetched_at`).
Retry of this `run_id` does not insert a second fetch for a registry id that
already landed. Transform as soon as that fetch exists.

## Do — transform

`status=transforming`. Insert `etl.sources` `source_kind=trade_registry_record`
when this extract writes profile columns. Write accreditation list / notes (each
increment cites that `source_id`). Trade registry wins the same way registry
wins legal identity ([build-profile](../../onboarding/pipeline/build-profile.md)).

## Persist

`etl.trade_registry_fetches`; `etl.sources`; `business_profile_edits` +
`business_profile_edit_sources` + accreditation live profile / list.
`etl.runs.status=succeeded`.

## Fail

Retryable. Prior live business profile stays. `status=error` when retries
exhaust.

## Out

Onboarding SSE mirrors Postgres on change (`etl.runs` and the live business
profile).

## Invariants

- First-run only.
- Extract does not write the live business profile.
