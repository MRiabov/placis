# ETL Technical Implementation

Status: proposed implementation plan.

Related: [ADR](ADR.md), [persistence](persistence.md), [pipeline](pipeline/README.md). No public
HTTP in this slice.

## StartRun

`StartRun(kinds, trigger, tenant)` (onboarding 02 also passes `onboarding_session_id`). `kinds`
length ≥ 1, explicit. Mint `enqueue_id`. For `trigger=onboarding`, count distinct `enqueue_id` in
the last 30 minutes; 5 or more → do not insert runs (02 surfaces `research_wait_until`). Insert
one `etl.runs` row per kind. Enqueue one extract River job per row.

Monday / Wednesday / Friday: stagger activated tenants. `kinds` = Google Maps, Facebook,
Instagram. Skip a kind with no key (`status=skipped`).

## Extract then transform

Per kind, in order: extract adapter → fetch insert → (Maps) listing upsert → transform job.
Transform calls `profile` fold APIs ([build-profile](../onboarding/pipeline/build-profile.md)).
Fakes at the adapter boundary. CI never spends Google / LLM quota.

## Validation & testing

- Tenant isolation on `etl.runs`, fetches, and profile social / media library rows transform writes.
- Integration: bootstrap `StartRun` then a second scheduled `StartRun`; new reviews / posts /
  photos land; owner-confirmed marketing phone does not change; photo kind is not rewritten for
  the same content hash.
- Onboarding E2E still proves 02 fills the checklist ([onboarding testing](../onboarding/testing.md)).
