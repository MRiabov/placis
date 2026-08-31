# ETL Technical Implementation

Status: proposed implementation plan.

Related: [ADR](ADR.md), [persistence](persistence.md), [pipeline](pipeline/README.md). No public HTTP in this slice.

## StartRun

`StartRun(etl_run_kinds, trigger, tenant)` (onboarding 02 also passes
`onboarding_session_id`). `etl_run_kinds` length ≥ 1, explicit. Create
`enqueue_id`. For `trigger=onboarding`, count distinct `enqueue_id` in the last
30 minutes; 5 or more → do not insert runs (02 surfaces `research_wait_until`).
Insert one `etl.runs` row per ETL run kind. Enqueue one extract River job per
row.

**Must not** (in `run.go`): call Maps / Facebook / Instagram / crawl / Parallel
Search; insert fetch rows; upsert `google_maps_listings`; write the live
business profile or classify photos. Parallel Extract is the crawl adapter, not
`StartRun`. That work is a **package function** `Run` in
`extract/<etl_run_kind>/` then `transform/<etl_run_kind>/` (for example
`internal/etl/transform/googlemaps.Run`). Go has no classes; this is not a
method on a per-ETL run kind type, and there is no shared `Extractor` /
`Transformer` interface. The River worker calls those functions
([module layout](../../general-architecture/module-layout.md)). The worker repeats that pair **per extract chunk** (ETL fast
extract, then ETL slow extract). It does not wait for the ETL run kind to finish
before the first transform.

Monday / Wednesday / Friday: stagger activated tenants. `etl_run_kinds` = Google
Maps, Facebook, Instagram. Skip an ETL run kind with no key (`status=skipped`).
`force` defaults false (stale-algorithm transform rewrite is off;
`algorithm=human` is never rewritten). `force` does not refetch when only the
algorithm changed. A bumped `schema_revision` extracts by default.

## Per source

Each ETL run kind is its own packages, matching [pipeline](pipeline/README.md). The worker
dispatches on `etl_run_kind` with one call per step (not a copied switch of
adapter code). Adapter → fetch insert → (Maps) listing upsert → transform
**that chunk**. ETL fast extract (Details / homepage crawl, ~1s) transforms
before ETL slow extract (scrape / parallel crawl remainder) finishes. Fakes at
the adapter boundary must delay the slow path so tests can assert the live
business profile after ETL fast extract and before ETL slow extract completes.
Transform calls `profile` write APIs ([build-profile](../onboarding/pipeline/build-profile.md)), writes `algorithm` and
`schema_revision` on every schema it sets (including
`etl.llm_source_to_project_classifications`), inserts `etl.sources` and junction
cites for ETL writes, and skips `human` / matching algorithm+revision unless
`force=true` (never `human`) or `schema_revision` is stale (extract by default).
CI never spends Google / LLM quota.

## Validation & testing

- Tenant isolation on `etl.runs`, fetches, and profile social / media library
  rows transform writes.
- Integration: bootstrap `StartRun` then a second scheduled `StartRun`; new
  reviews / posts / photos land; owner-confirmed marketing phone does not change
  (`algorithm=human`); photo kind is not rewritten for the same content hash
  when `force` is false and `schema_revision` matches; a bumped
  `schema_revision` extracts / classifies without `force`; `force=true` does not
  overwrite `human`.
- Onboarding E2E still proves 02 fills the checklist as chunks arrive, not only
  at ETL run kind succeeded ([onboarding testing](../onboarding/testing.md)).
