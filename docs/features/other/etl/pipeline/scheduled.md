# Scheduled ETL run

Listing updates three times per UTC week for an **activated** tenant. Not a second
onboarding 02 job set: no company registry, trade registry, directory / founder, website
crawl, or Parallel. New Google Maps / Facebook **reviews**, Maps **photos**, and Facebook /
Instagram **posts** (text + images) are the point.

## Trigger

River periodic: **Monday, Wednesday, and Friday** UTC per `tenant_id` with
`tenants.status=active` and at least one of `google_maps_listing_url` or
`facebook_profile_url` (or a persisted Instagram `social_profile` URL). Enqueue time
jittered from `tenant_id`. `existing_site_url` alone does not start a scheduled run.

Website activation ([08](../../../onboarding/pipeline/08-website-activation.md)) starts this
periodic for that tenant. Unactivated tenants only run 02.

## Pre

- Tenant `status=active`.
- Online research consent was recorded on the onboarding session that created this tenant.
- No `scheduled` run for this `tenant_id` with `started_at` on this UTC weekday (that Monday,
  Wednesday, or Friday).

## Must not

- Insert a run for an unactivated tenant.
- Enqueue the 02 job set (company registry, trade registry, directory / founder, website
  crawl, Parallel, services-and-area).
- Stack missed weekdays into a backlog of paid calls.
- Call Parallel.
- Refetch inside the 30-minute freshness window **as if that meant the watermark is done**
  — scheduled extract goes past the watermark ([architecture](../architecture.md)).
- Re-pin **top reviews** or rewrite `website_slot_reviews`.
- Attach new photos onto website slots.
- `set` a fold column that is `filled_by_user` or `conflict`.
- Recreate archived reviews or archived media library items.
- Use Facebook Login or Instagram Login.
- Propose new services / service areas / founder / trade from post text or a crawl.

## Do

Insert `etl.business_research_runs` (`trigger=scheduled`, `onboarding_session_id` null).
Enqueue **only** the listing jobs that have a URL / `place_id` on the fold. Jobs share that
`run_id`.

| Job | When | `etl.business_research_sources.kind` |
| --- | --- | --- |
| Google Maps listing | `google_maps_listing_url` or `place_id` | `google_maps_listing` (reviews + photos on that listing) |
| Facebook | `facebook_profile_url` | `facebook` / `facebook_post` (reviews, posts, post images) |
| Instagram | persisted Instagram `social_profile` URL | `instagram_post` |

Each job: extract past `etl.watermarks`, insert `etl.fetches` on a real call, upsert listing
rows, load **new** reviews and **new** photos.

## Persist

Run / events / sources / fetches / watermarks / listing tables / `imported_media`.
New reviews onto the fold (`in_pool`). New photos into the media library
(`pending_review`). Do not rewrite identity / founder / trade / services from this run.

## Fail

Retryable River jobs. Prior fold and listing rows stay. Source `status=error`. Do not skip
the next weekday because this one failed (the weekday is consumed by the insert; a failed job is
retried on the **same** run, not a second scheduled run that weekday).

## Out

New rows in the media library and All reviews. No onboarding SSE. No owner prompt.

## Invariants

- At most one scheduled run per tenant per UTC weekday (Monday, Wednesday, Friday).
- A scheduled run is listing updates, not onboarding business research.
- Safe to retry on external id.
- Fold does not move on conflict / owner-set.
