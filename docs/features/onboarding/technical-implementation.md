# Onboarding Technical Implementation

Status: proposed implementation plan.

Related: [PRD](prd.md), [ADR](ADR.md), [persistence](persistence.md), [HTTP](api.md).

## Domain objects

See [persistence.md](persistence.md). The business profile is
[details](../business-profile/details/persistence.md). Warehouse and extract/transform are
[ETL](../etl/persistence.md).

## Flow

`created → client_interviewing → applying_website_template → previewing → activated`
(`apply_website_template_failed` if applying the website template throws).
Business research runs in the background alongside review/client interview; applying the website template
starts at client interview complete; website copy generation runs after that and does not
block website activation. 07 waits copy-done or the wait cap, then writes the host.

## HTTP

Routes: [api.md](api.md). Business lookup is `POST /v1/onboarding-sessions/business-lookup` (no bare collection
POST). Website activation checkout is public, CORS by `Host` / `website_prefix` — not
`/v1/website-previews/{token}/…`. Website publication / website rollback: [website
HTTP](../website/api.md).

Website publication of 07/08 is the same write as the website editor’s website publication;
website rollback of onboarding rows is refused
([website technical implementation](../website/technical-implementation.md)).

## Business research pipeline

1. Before enqueue: count distinct `etl.runs.enqueue_id` for this `tenant_id` with
   `trigger=onboarding` in the last 30 minutes. Five already → do not call `StartRun`; expose
   `research_wait_until` (oldest of those five + 30 minutes) on profile and SSE; a later
   source-change returns `429` with that timestamp. River retries of an existing ETL run do not
   create a new `enqueue_id`. See [02](pipeline/02-business-research.md).
2. 02 calls `etl.StartRun(kinds, trigger=onboarding)`. Extract, listing upsert, and transform
   are [ETL](../etl/technical-implementation.md).
3. Profile deltas use [build-profile](pipeline/build-profile.md).

## Profile building

1. Each client interview answer and each ETL transform write becomes one or more
   `business_profile_edits` rows (only the fields/list items that writer set) applied to the live
   business profile in the same transaction (`SELECT … FOR UPDATE`, then those columns only).
2. Surface research conflicts for the owner to review.
3. At client interview complete, set `accepted_edit_id`; applying the website template uses the
   profile as of that edit.

## Validation & testing

- Tenant isolation for onboarding sessions, ETL runs, and profile rows.
- Fakes force deterministic tests; CI never spends Google / LLM / Stripe quota (see
  [ci-cd.md](../../general-architecture/ci-cd.md)).
- One E2E: find → review → client interview → apply the website template → website preview →
  website activation (Google / LLM / Stripe faked, core logic unmocked). The website preview can
  be activated before website copy generation finishes.

## Frontend

- The existing onboarding surface in `frontend-2` (find-the-business,
  client interview, business research progress, website preview) is refactored against the regenerated types;
  onboarding routes on the Go side use `/onboarding-*`. Port instructions:
  [frontend-debloat.md](frontend-debloat.md).
