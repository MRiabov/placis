# ETL Technical Implementation

Status: proposed implementation plan.

Related: [ADR](ADR.md), [persistence](persistence.md), [pipeline](pipeline/README.md). No public HTTP in this slice.

## StartRun

`StartRun(kinds, trigger, tenant)` (onboarding 02 also passes
`onboarding_session_id`). `kinds` length ≥ 1, explicit. Create `enqueue_id`. For
`trigger=onboarding`, count distinct `enqueue_id` in the last 30 minutes; 5 or
more → do not insert runs (02 surfaces `research_wait_until`). Insert one
`etl.runs` row per kind. Enqueue one extract River job per row.

**Must not** (in `run.go`): call Maps / Facebook / Instagram / crawl / Parallel;
insert fetch rows; upsert `google_maps_listings`; write the live business
profile or classify photos. That work is a **package function** `Run` in
`extract/<kind>/` then `transform/<kind>/` (for example
`internal/etl/transform/googlemaps.Run`). Go has no classes; this is not a
method on a per-kind type, and there is no shared `Extractor` / `Transformer`
interface. The River worker calls those functions ([module layout](../../general-architecture/module-layout.md)). The worker
repeats that pair **per extract chunk** (fast extract, then slow extract). It
does not wait for the kind to finish before the first transform.

Monday / Wednesday / Friday: stagger activated tenants. `kinds` = Google Maps,
Facebook, Instagram. Skip a kind with no key (`status=skipped`). `force`
defaults false (stale-algorithm transform rewrite is off; `algorithm=human` is
never rewritten). `force` does not refetch when only the algorithm changed. A
bumped `schema_revision` extracts by default.

## Per source

Each kind is its own packages, matching [pipeline](pipeline/README.md). The worker dispatches on
`kind` with one call per step (not a copied switch of adapter code). Adapter →
fetch insert → (Maps) listing upsert → transform **that chunk**. Fast extract
(Details / fast crawl, ~1s) transforms before slow extract (scrape / slow crawl,
~40s extra) finishes. Fakes at the adapter boundary must delay the slow path so
tests can assert the live business profile after fast extract and before slow
extract completes. Transform calls `profile` write APIs ([build-profile](../onboarding/pipeline/build-profile.md)),
writes `algorithm` and `schema_revision` on every schema it sets, and skips
`human` / matching algorithm+revision unless `force=true` (never `human`) or
`schema_revision` is stale (extract by default). CI never spends Google / LLM
quota.

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
  at kind succeeded ([onboarding testing](../onboarding/testing.md)).
