# Source-change and import ETL runs

Owner-started extracts after the listing URLs live on the fold.

## Trigger

1. **Source change** — `PATCH /v1/business-profile` writes `facebook_profile_url` and/or
   `google_maps_listing_url` (including first link and Change).
2. **Import** — `POST /v1/business-profile/reviews/import` from Certifications and reviews
   (Google Maps listing and/or the linked Facebook URL).

## Pre

- Clerk JWT, active tenant.
- For import: at least one of those URLs is set on the fold.
- Combined `source_change` + `import` runs for this `tenant_id` in the last 30 minutes
  fewer than **5**.

## Must not

- Enqueue a 6th CMS run inside 30 minutes (paid or freshness-window hit). Persist the URL
  anyway; return `429` with `research_wait_until`.
- Truncate review `body`.
- Recreate `archived` reviews.
- Re-pin **top reviews** or rewrite `website_slot_reviews` (same as scheduled). Import may
  still fill excerpts on **new** review rows only.
- Facebook Login.

## Do

Insert `etl.business_research_runs` with `trigger=source_change` or `import`. Enqueue the
jobs that match the URL(s): Maps listing + reviews + photos; Facebook reviews +
**posts** + post photos. Jobs share that `run_id`.

Freshness window applies (reuse a fetch younger than 30 minutes). Watermarks still advance
when new external ids land.

## Persist

Same tables as scheduled. Import is reviews-forward but still lands post photos when the
Facebook job runs on that run (one Facebook adapter, not a reviews-only fork).

## Fail

Retryable jobs. `429` on cap is not a job Fail.

## Out

Certifications and reviews pool grows; `/cms/media` shows new pending-review photos.

## Invariants

- Same extract contract as [architecture](../architecture.md).
- URL persist is not blocked by the cap; only the extract enqueue is.
