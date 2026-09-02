# ETL Technical Implementation

Status: proposed implementation plan.

Related: [ADR](ADR.md), [persistence](persistence.md),
[pipeline](pipeline/README.md),
[ETL run kind triggers](pipeline/etl-run-kind-triggers.md). No public HTTP in this slice.

## StartRun

`StartRun(trigger, tenant, force=false)` (onboarding 02 also passes
`onboarding_session_id`). Create `enqueue_id`. For `trigger=onboarding`, count
distinct `enqueue_id` in the last 30 minutes; 5 or more → do not insert runs (02
already counted so business lookup stays 200 and a later source-change stays
`429`). Copy 01 attach and live-profile details. For each ETL run kind that can
start, persist into `etl.runs` and **inserts** that ETL run kind’s extract
River job kind ([jobs](../../general-architecture/jobs.md)). Do not
insert pending rows. Re-check when details change (same `enqueue_id`).

Onboarding ETL run kinds: [ETL run kind triggers](pipeline/etl-run-kind-triggers.md). Never `directory`, `review`,
or `photo`. Scheduled ETL run kinds = Google Maps, Facebook, Instagram.

**Must not** (in `run.go`): call Maps / Facebook / Instagram / crawl / Parallel
Search; insert fetch rows; upsert `google_maps_listings`; write the live
business profile or classify photos. Parallel Extract is the crawl adapter, not
`StartRun`. That work is a **package function** `Run` in
`extract/<etl_run_kind>/` then `transform/<etl_run_kind>/` (for example
`internal/etl/transform/googlemaps.Run`). Go has no classes; this is not a
method on a per-ETL run kind type, and there is no shared `Extractor` /
`Transformer` interface. The extract worker **calls**
`extract/<etl_run_kind>.Run`; the transform worker **calls**
`transform/<etl_run_kind>.Run`
([module layout](../../general-architecture/module-layout.md),
[jobs](../../general-architecture/jobs.md)). Extract **inserts** transform after
the chunk’s fetch row; transform **inserts** the next extract when ETL slow
extract chunks remain. It does not wait for the ETL run kind to finish
before the first transform. An ETL run kind that cannot start yet is not
inserted (onboarding) or is `insufficient_data_for_lookup` (scheduled).

Monday / Wednesday / Friday: stagger activated tenants. ETL run kinds = Google
Maps, Facebook, Instagram. Skip an ETL run kind with no matching **Starts when**
tuple (`status=insufficient_data_for_lookup` immediately). Scheduled Maps
skips when there is no
`place_id` (do not Places Find). `force` defaults false
(stale-algorithmtransform rewrite is off; `algorithm=human` is never rewritten).
`force` does not refetch when only the algorithm changed. A bumped
`schema_revision` extracts by default.

## Per source

Each ETL run kind is its own packages, matching [pipeline](pipeline/README.md). The worker
dispatches on `etl_run_kind` with one call per step (not a copied switch of
adapter code). Adapter → fetch insert → (Maps) listing upsert → transform
**that chunk**. ETL fast extract (Details / homepage crawl, p95 ≤ 5s) transforms
before ETL slow extract (scrape / parallel crawl remainder) finishes. Fakes at
the adapter boundary must delay the slow path so tests can assert the live
business profile after ETL fast extract and before ETL slow extract completes.
Transform calls `profile` write APIs ([build-profile](../onboarding/pipeline/build-profile.md)), writes `algorithm` and
`schema_revision` on every schema it sets (including
`etl.llm_source_to_project_classifications`), inserts `etl.sources` and junction
cites for ETL writes, and skips `human` / matching algorithm+revision unless
`force=true` (never `human`) or `schema_revision` is stale (extract by default).
Pause remaining expensive chunks when only `human` scalars remain
([ETL run kind triggers](pipeline/etl-run-kind-triggers.md)). CI never spends Google / LLM quota.

## Validation & testing

- Tenant isolation on `etl.runs`, fetches, and profile social / media library
  rows transform writes.
- Integration: bootstrap `StartRun` then a second scheduled `StartRun`; new
  reviews / posts / photos land; owner-confirmed marketing phone does not change
  (`algorithm=human`); a bumped `schema_revision` extracts without
  `force`; `force=true` does not overwrite `human`. `DescribeImage`
  inserts `media_asset_classifications` (`photo_kind` `logo` /
  `photo`) on imported rows.
- Onboarding E2E still proves 02 fills the checklist as chunks arrive, not only
  when the ETL run kind succeeded ([onboarding testing](../onboarding/testing.md)).
