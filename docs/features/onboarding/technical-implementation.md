# Onboarding Technical Implementation

Status: proposed implementation plan.

Related: [PRD](prd.md), [ADR](ADR.md), [persistence](persistence.md),
[ETL](../other/etl/persistence.md), [HTTP](api.md).

## Domain objects

The business profile is
[details](../other/details/persistence.md). Extract tables:
[ETL](../other/etl/persistence.md).

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

1. Before enqueue: count `etl.business_research_runs` with `trigger=onboarding` for this
   `tenant_id` in the last 30 minutes.
   Five already → do not enqueue; expose `research_wait_until` (oldest of those five + 30 minutes)
   on profile and SSE; a later source-change returns `429` with that timestamp. River retries of
   an existing `etl.business_research_run` do not insert a run. See [02](pipeline/02-business-research.md).
2. Look up the latest `etl.fetches` (kind + cache key) and `etl.google_maps_listings` (`place_id`)
   before any external call. Inside the 30-minute freshness window → reuse `raw`; skip Google
   Maps Details, scrape, Facebook, crawl, and Parallel.
3. On a miss or a stale fetch: Google Maps, Vercel Parallel search (only when we lack `place_id`
   or a known website URL), the company registry parquet, Facebook, the LLM extract, or a fake
   returns a raw fetch body.
   **Insert** `etl.fetches` (never overwrite a prior `raw`). Vercel AI Gateway is the search hop:
   Parallel via `gateway.tools.parallelSearch()`; a separate extract call over retrieved text (no
   search tools).
4. Upsert typed output: an `etl.business_research_sources` row (kind, external id, where it came
   from, lookup `status`, confidence) for **this** onboarding session even on a freshness-window
   hit. A Google Maps listing also upserts `etl.google_maps_listings` (columns + `latest_fetch_id`),
   hours, and reviews. Facebook upserts `etl.facebook_pages`, reviews, and posts. Other kinds copy `raw` onto
   the source row from the fetch row.
5. Photo classification tags media assets (hero/project/service/founder/logo) for the media library
   / website slot mapping. Post images load through `etl.imported_media`.
6. Every run is safe to retry (explicit key). Do not refetch on retry when this source already
   has `fetch_id`.

## Profile building

1. Each client interview answer and each business research row becomes one or more
   `business_profile_edits` rows (only the fields/list items that writer set) applied to the live
   fold in the same transaction (`SELECT … FOR UPDATE`, then those columns only).
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
