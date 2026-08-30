# ETL — persistence

Conventions: [persistence conventions](../../general-architecture/persistence.md) (Postgres schema `etl`). Transformed
Facebook / Instagram rows and photo classification live on the
[business profile](../business-profile/details/persistence.md), not here.

`jsonb` is `raw` on each fetch table only.

## Runs

- `runs` — `id`, `tenant_id` fk, `enqueue_id` (uuid, shared by every kind in one
  `StartRun` call), `trigger` (`onboarding` / `scheduled`), `kind`
  (`google_maps_listing` / `facebook` / `instagram` / `website_crawl` /
  `trade_registry` / `directory` / `review` / `photo` / `web_search`), `status`
  (`pending` / `extracting` / `transforming` / `succeeded` / `error` /
  `skipped`), `onboarding_session_id` nullable fk, `place_id` nullable, `error`
  nullable, `started_at`, `finished_at`. One row per source kind extract. River
  retry keeps this `id`. `skipped` when scheduled and that kind has no key.

## Fetches (append-only, one table per extract type)

Never update a row. Latest body for a natural key is the newest `fetched_at`.
One ETL run may insert **several** fetch rows (fast extract, then slow extract
chunks). Retry reuses a row that already landed for that chunk; it does not
collapse the run to a single fetch.

- `google_maps_fetches` — `id`, `place_id`, `fetched_from`
  (`google_maps_details` / `scrape`), `run_id` fk, `fetched_at`, `raw` jsonb
- `facebook_fetches` — `id`, Facebook page id / URL, handle, `run_id` fk,
  `fetched_at`, `raw` jsonb
- `instagram_fetches` — `id`, handle, Instagram user, `run_id` fk, `fetched_at`,
  `raw` jsonb
- `website_crawl_fetches` — `id`, canonical URL, `fetched_from`
  (`parallel_extract` / `http_get` / `apify` / `robots_txt` / `sitemap`),
  `run_id` fk, `fetched_at`, `raw` jsonb. One vendor dump per row. Retry key
  is `(canonical URL, fetched_from)` for this `run_id`. HTML URLs use
  `parallel_extract` + `http_get` (or `apify` if GET failed). Discovery GETs
  use `robots_txt` / `sitemap`. Image files are not in `raw`.
- `trade_registry_fetches` — `id`, registry id, `run_id` fk, `fetched_at`, `raw`
  jsonb

Company registry parquet and Find autocomplete are not these tables. A later
Companies House / CRO API fetch gets its own fetch table.

Retry of the **same** run reuses the fetch for a chunk that already landed
(`place_id` + `fetched_from` for Maps Details vs scrape; canonical URL +
`fetched_from` for crawl). Remaining slow extract chunks still insert. A
`trigger=scheduled` run extracts again.

## Website crawled URLs (live row, no `raw`)

HTML URLs only (homepage + remainder under the 20 HTML cap). Not robots, not
sitemaps. Analog of `google_maps_listings` / `facebook_posts`. Skip keys live
here, not on fetches.

- `website_crawl_pages` — `id`, `tenant_id` fk, canonical URL unique per
  tenant, `status` (`discovered` / `fetched`), latest fetch ids for extract /
  html / apify, `project_from_source_algorithm` nullable,
  `project_from_source_schema_revision` nullable, whether that HTML URL produced
  a Project, `fetched_at`
- `website_crawl_page_photos` — `id`, `page_id` fk, `source_url`,
  `media_asset_id` nullable fk, `content_hash` nullable

Sitemap parse inserts `discovered`. Extract + HTML (or Apify) complete →
`fetched`. Depicting photo for a crawl-origin Project must be one of these
children.

## `imported_media`

- `imported_media` — `id`, `tenant_id` fk, `kind` (`google_maps_listing` /
  `facebook` / `instagram` / `website_crawl` / `google_maps_listing_review`),
  `external_id`, `media_asset_id` fk. Unique `(tenant_id, kind, external_id)`
  so a later extract does not insert a second media library item, including
  when that item is `archived`. Named from
  [media library persistence](../other/media/persistence.md).

## Google Maps listing (live row, no `raw`)

- `google_maps_listings` — `id`, `place_id` unique, `fetched_from`
  (`google_maps_details` / `scrape`), `latest_fetch_id` fk, `display_name`,
  `primary_type`, `marketing_phone`, `website_url`, `google_maps_listing_url`,
  `listing_address`, `locality`, `country` (`ie` / `gb` / `us` nullable; Places
  address country, not parsed from `listing_address`), `rating`, `review_count`,
  `fetched_at`
- `google_maps_listing_opening_hours` — `id`, `listing_id` fk, `day_of_week`,
  `opens_at`, `closes_at`, `closed`
- `google_maps_listing_reviews` — `id`, `listing_id` fk, `external_id` (Google’s
  review id, unique per listing when present), `author_name`, `rating` (1–5),
  `body`, `published_at` nullable, `language` nullable
- `google_maps_listing_review_photos` — `id`, `review_id` fk, `source_url`,
  `media_asset_id` nullable fk, `content_hash` nullable. Scrape photos **on
  that review** (not listing-level). Reviewer avatar is not a row here.
- `google_maps_listing_photos` — `id`, `listing_id` fk, `external_id`,
  `source_url`, `content_hash` nullable

The Google Maps listing is this row, not a blob on a fetch. Hours, reviews, and
photo refs are child rows. Review photos from scrape are children of the
review. Profile hours / reviews / media library items are copies transform
writes; the listing stays here.

## Indexes

`runs` (`tenant_id`, `trigger`, `started_at`); unique (`enqueue_id`, `kind`).
Fetches: (`place_id`, `fetched_at` desc) on Maps fetches; (`handle`,
`fetched_at` desc) on Instagram fetches; (`canonical URL`, `fetched_from`)
unique per `run_id` on crawl fetches. Unique `google_maps_listings.place_id`.
Unique `website_crawl_pages` canonical URL per tenant.
