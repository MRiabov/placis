# ETL — Architecture

How public sources become listing rows, then profile increments and media library items.
Onboarding [02](../../onboarding/pipeline/02-business-research.md) is one trigger. This file
is the extract contract every trigger uses.

## Layers

Do not collapse these into one upsert of the fold.

```text
Extract   →  etl.fetches (append-only raw body)
Transform →  typed listing tables + etl.sources (this run)
Load      →  business_profile_edits / media_assets (via build-profile + media library insert)
```

- **Extract** talks to Maps, Facebook, crawl, Parallel, trade registries **on onboarding 02**.
  It writes `etl.fetches` and advances `etl.watermarks`. It does not write `business_profiles`.
  **Scheduled** extract is listing updates only (Maps, Facebook, Instagram) — see Triggers.
- **Transform** turns the latest fetch (and prior listing rows) into typed columns: Maps
  listing / hours / reviews, `etl.facebook_pages` / reviews / posts, crawl-derived source rows.
  Photo classification tags found images. LLM extract of post text, when used, is recorded
  in `ai_generations` (internal reasoning, user-visible output, tool calls).
- **Load** copies **new** reviews onto `details.business_profile_reviews`, **new** photos onto
  `media_library.media_assets` (mapping in `etl.imported_media`). Onboarding 02 also loads
  **new or still-empty** scalar/list details through [build-profile](../../onboarding/pipeline/build-profile.md).

HTTP never returns `etl.fetches.raw` or listing `latest_fetch` bodies
([HTTP conventions](../../../general-architecture/api.md)).

## Triggers

| `etl.business_research_runs.trigger` | When | `onboarding_session_id` |
| --- | --- | --- |
| `onboarding` | 01 business lookup or source change on an unactivated onboarding session, under the 02 run cap | required |
| `source_change` | Owner sets `facebook_profile_url` or `google_maps_listing_url` on Details | null |
| `import` | `POST /v1/business-profile/reviews/import` | null |
| `scheduled` | Three times per UTC week for an **activated** tenant with a Maps and/or Facebook URL (Instagram if persisted). Listing updates only — not the 02 job set | null |

A run is one enqueue of **that trigger’s** job set. Onboarding 02 enqueues the full business research
jobs ([02](../../onboarding/pipeline/02-business-research.md)). Scheduled enqueues
only Maps / Facebook / Instagram listing jobs ([scheduled](pipeline/scheduled.md)).
Source-change and import enqueue the jobs that match the URL(s)
([source-change](pipeline/source-change.md)). Each River job writes
`etl.business_research_sources` and events on that `run_id`. River retries of those jobs are
the same run.

**Extract sources** on the fold: `google_maps_listing_url`, `facebook_profile_url`,
`existing_site_url`. Instagram may appear as a `social_profile` source when a public URL was
stored. No Facebook Login and no Instagram Login in this pass; public Facebook URL or scrape only.
If there are no public posts, the Facebook/Instagram post job finishes `not_found` / empty
and does not fail the run. Scheduled ignores `existing_site_url` (no crawl). Onboarding 02
still uses crawl / Parallel / registries when those jobs run.

## Caps

Paid lookups still must not run unbounded.

- **Onboarding (`trigger=onboarding`):** at most **5 runs per `tenant_id` per rolling 30
  minutes** — unchanged from [02](../../onboarding/pipeline/02-business-research.md).
- **CMS (`source_change` and `import`):** same **5 per 30 minutes** bucket (any of those two
  triggers). A 6th returns `429` with `research_wait_until`. Details still persist the URL.
- **Scheduled:** at most **one** `scheduled` run per `tenant_id` per UTC weekday. Weekdays are
  **Monday, Wednesday, and Friday** (three times per UTC week). Missed weekdays do not stack.
  Jitter the enqueue from `tenant_id` so many tenants do not hit Facebook at once.

A scheduled run does not consume the onboarding 30-minute bucket. An onboarding run does
not consume a scheduled weekday.

## Extract

Before any **external** call:

1. Look up `etl.watermarks` for this `tenant_id` + kind + source key (`place_id`, canonical
   Facebook URL, Instagram URL, site URL). Incremental extract uses that cursor (`since`,
   pagination token, or “stop when we see an external id we already stored”).
2. Look up the **latest** `etl.fetches` row for `(kind, cache_key)` by `fetched_at`.
3. **Freshness window (onboarding and CMS only):** if that latest fetch is younger than **30
   minutes**, reuse it. Do not call Maps / Facebook / crawl / Parallel. Still write
   `etl.sources` for **this** run (`fetch_id` points at the reused row). Point listing
   `latest_fetch_id` at the reused row.
4. **Scheduled:** do not treat a fetch inside the 30-minute window as “already complete”.
   Extract past the watermark. If the remote side has nothing new, insert a fetch that
   records the empty/unchanged body (or a typed no-new-items event) and leave listing rows
   as they are. Do not no-op the run without a row.

On an actual network call: **insert** `etl.fetches` (`kind`, `cache_key`, `raw`, `fetched_at`).
Never `UPDATE` `raw` on an older fetch. Company registry parquet and Find autocomplete are
not this cache.

Maps path: upsert `etl.google_maps_listings` by `place_id` (columns + `latest_fetch_id`),
hours, reviews. Do not also dump the body onto `etl.sources.raw`.

Facebook path: upsert `etl.facebook_pages` by canonical Facebook URL / Facebook id; reviews onto
`etl.facebook_page_reviews`; posts onto `etl.facebook_posts` (external post id unique per
Facebook listing). Post images are extract children, then load.

## Transform

- Upsert listing rows on the **external id** (Maps `place_id`, Google review id, Facebook
  review id, Facebook/Instagram post id). A second run does not insert a second listing
  row for the same id.
- `etl.sources` still records lookup `status` + confidence **for this run**, even on reuse.
- Photo classification (hero / project / service / founder / logo) runs on newly landed
  image bytes from **this** run’s listing jobs. Same classifier as 02; not the client interview.
  Scheduled does not crawl the existing site for more photos.
- Post text: on **onboarding 02** only, optional LLM pass to propose **add** of services /
  service areas when the post clearly names them. Do not invent. Do not `set` a scalar the
  owner already filled. Scheduled does not run that pass.

## Load

- **Reviews:** copy onto `details.business_profile_reviews` when that external id is not
  already on the profile. `origin` is `google_maps_listing` or `facebook_business_page`.
  Land `in_pool`. Skip when a row with that external id is `archived` (do not recreate).
  Import does not truncate `body`. Scheduled runs do **not** run the top-reviews pin job
  and do **not** write `website_slot_reviews`.
- **Photos:** insert `media_library.media_assets` (`source=imported`,
  `supplied_by=business_research`, `review_status=pending_review`) and
  `etl.imported_media` (`kind`, `external_id`). Unique `(tenant_id, kind, external_id)`.
  If that mapping exists, skip — including when the media item is `archived`. Do not
  replace `file_id`. Do not attach scheduled photos onto website slots; they wait in the
  media library. Onboarding 02 classification may still feed 05 image slots for **that**
  first run.
- **Details:** [build-profile](../../onboarding/pipeline/build-profile.md). Conflict: fold
  does not move. After client-interview complete, later runs are new edits after
  `accepted_edit_id`; they must not mutate the accepted fold in place. Scheduled load is
  **new reviews and new photos only** — not founder, trade, services, or identity from
  crawl / registry / directory.

Every load path is safe to retry: the external id is the key.

## Replay

A fetch already stored is enough to re-run transform + load without a network call (River
retry; eval). Do not refetch because a worker crashed after `etl.fetches` insert.

## Observability

`etl.business_research_runs` + `etl.business_research_events`. Each River job writes
sources on that `run_id`. Watermark `last_run_id` + `extracted_until`. LLM post extract →
`ai_generations`. Do not put fetch bodies on SSE or `frontend-2`.
