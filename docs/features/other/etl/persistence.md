# ETL — persistence

Public-source extract tables. Conventions:
[persistence conventions](../../../general-architecture/persistence.md)
(Postgres schema `etl`).

Onboarding sessions stay in [onboarding](../../onboarding/persistence.md). The fold stays in
[details](../details/persistence.md). Media library items stay in
[media library](../media/persistence.md); this schema only maps external ids onto those rows.

## Run ledger

- `business_research_runs` — `id`, `tenant_id` fk, `onboarding_session_id` nullable fk
  (`onboarding.onboarding_sessions`; required when `trigger=onboarding`, null otherwise),
  `trigger` (`onboarding` / `source_change` / `import` / `scheduled`),
  `place_id` nullable (Google’s id when a Maps listing was selected), `started_at`.
  One row per enqueue of the job set, not per River job. Caps:
  [architecture](architecture.md).
- `business_research_events` — `id`, `business_research_run_id` fk, `event_type`,
  `payload` jsonb, `created_at`
- `business_research_sources` — `id`, `business_research_run_id` fk, `kind`
  (`google_maps_listing` / `company_registry` / `trade_registry` / `facebook` /
  `social_profile` / `website_crawl` / `review` / `directory` / `photo` / `facebook_post` /
  `instagram_post`), `external_id`, `source_ref`,
  `fetch_id` nullable fk (`etl.fetches` — reused or newly inserted for this kind),
  `raw` jsonb (dump only for kinds with no listing
  table; null when `kind` is `google_maps_listing`, `review`, `facebook`, `facebook_post`,
  or `instagram_post`; copy of the reused fetch, not a second network call),
  `status` (`matched` / `ambiguous` / `not_found` / `not_attempted` / `blocked` / `error`),
  `confidence`, `created_at`

`details.business_profile_edits.business_research_run_id` points at `etl.business_research_runs`.
There is no parent `waves` table and no second per-job run row. Each River job writes sources
and events on the same `run_id`.

## Fetches (append-only landing)

- `fetches` — `id`, `kind` (same closed set as sources, plus `web_search`), `cache_key`
  (canonical URL, scrape query, Facebook URL, Instagram URL, trade-registry id, Parallel
  query, or `place_id` for Maps scrape fallback), `raw` jsonb, `fetched_at`.

Each external call **inserts** a row. Never update `raw`. Latest-for-key is
`ORDER BY fetched_at DESC`. There is no unique `(kind, cache_key)` — that was the last-wins
cache (`onboarding.business_research_fetches`). Index `(kind, cache_key, fetched_at DESC)`.

Company registry parquet and Find autocomplete are not this table. Fetches and Maps /
Facebook listing tables are **global** (shared extract cache, no `tenant_id`). Runs,
watermarks, and `imported_media` are tenant-owned.

## Watermarks (incremental extract)

- `watermarks` — `id`, `tenant_id` fk, `kind`, `source_key` (stable: `place_id`, canonical
  Facebook URL, Instagram URL, existing site URL), `cursor` nullable text (API pagination cursor
  when the remote side uses one), `extracted_until` nullable timestamptz (post `posted_at` /
  review `published_at` high-water), `last_run_id` nullable fk, `updated_at`.
  Unique `(tenant_id, kind, source_key)`.

First run: no row → full extract, then insert. Later runs: extract after
`extracted_until` / `cursor`. Empty remote result still updates `last_run_id`.

## Google Maps listing

- `google_maps_listings` — `id`, `place_id` unique (Google’s id),
  `fetched_from` (`google_maps_details` / `scrape`), `display_name`, `primary_type`,
  `marketing_phone`, `website_url`, `google_maps_listing_url`, `listing_address`,
  `locality`, `rating`, `review_count`, `latest_fetch_id` fk (`etl.fetches`), `fetched_at`
- `google_maps_listing_opening_hours` — `id`, `listing_id` fk, `day_of_week`, `opens_at`,
  `closes_at`, `closed`
- `google_maps_listing_reviews` — `id`, `listing_id` fk, `external_id` (Google’s review id,
  unique per listing when present), `author_name`, `rating` (1–5), `body`, `published_at`
  nullable, `language` nullable

The listing address stays here; it is not a second legal address on the fold.
`details.business_profile_reviews.google_maps_listing_review_id` points at
`etl.google_maps_listing_reviews`.

## Facebook listings, reviews, posts

- `facebook_pages` — `id`, `canonical_url` unique, `page_external_id` nullable,
  `display_name` nullable, `latest_fetch_id` fk, `fetched_at`
- `facebook_page_reviews` — `id`, `page_id` fk, `external_id` unique per Facebook listing,
  `author_name`, `rating` nullable, `body`, `published_at` nullable, `language` nullable
- `facebook_posts` — `id`, `page_id` fk, `external_id` unique per Facebook listing, `body` nullable,
  `permalink` nullable, `posted_at` nullable, `latest_fetch_id` fk
- `facebook_post_photos` — `id`, `post_id` fk, `external_id` unique per post when present,
  `source_url`, `latest_fetch_id` fk

`details.business_profile_reviews.facebook_page_review_external_id` matches
`etl.facebook_page_reviews.external_id` (no second copy of the text except on the fold row
after load).

Instagram public posts use the same post/photo shape on `kind=instagram_post` sources; store
them in `facebook_posts` only when the network is Facebook. Instagram rows:

- `instagram_posts` — `id`, `canonical_url` (profile URL) unique with `external_id`,
  `body` nullable, `permalink` nullable, `posted_at` nullable, `latest_fetch_id` fk
- `instagram_post_photos` — `id`, `post_id` fk, `external_id` nullable, `source_url`,
  `latest_fetch_id` fk

No Instagram table when no Instagram URL was persisted.

## `imported_media` mapping

- `imported_media` — `id`, `tenant_id` fk, `media_asset_id` fk (`media_library.media_assets`),
  `kind` (`google_maps_listing` / `facebook_post` / `instagram_post` / `website_crawl` /
  `photo`), `external_id`, `source_url` nullable, `post_id` nullable (Facebook or Instagram
  post id when the image came from a post), `fetch_id` fk, `created_at`.
  Unique `(tenant_id, kind, external_id)`.

Load consults this table before insert. Archived `media_assets` keep the mapping so a later
run does not recreate the photo.

## Indexes

`business_research_runs` `(tenant_id, started_at)`, `(tenant_id, trigger, started_at)`.
`fetches` `(kind, cache_key, fetched_at DESC)`.
`watermarks` unique `(tenant_id, kind, source_key)`.
`imported_media` unique `(tenant_id, kind, external_id)`.
