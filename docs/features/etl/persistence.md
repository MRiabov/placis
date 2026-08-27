# ETL — persistence

Conventions: [persistence conventions](../../general-architecture/persistence.md)
(Postgres schema `etl`). Transformed Facebook / Instagram rows and photo classification live on
the [business profile](../other/details/persistence.md), not here.

`jsonb` is `raw` on each fetch table only.

## Runs

- `runs` — `id`, `tenant_id` fk, `enqueue_id` (uuid, shared by every kind in one `StartRun`
  call), `trigger` (`onboarding` / `scheduled`), `kind` (`google_maps_listing` / `facebook` /
  `instagram` / `website_crawl` / `trade_registry` / `directory` / `review` / `photo` /
  `web_search`), `status` (`pending` / `extracting` / `transforming` / `succeeded` / `error` /
  `skipped`), `onboarding_session_id` nullable fk, `place_id` nullable, `error` nullable,
  `started_at`, `finished_at`. One row per source kind extract. River retry keeps this `id`.
  `skipped` when scheduled and that kind has no key.

## Fetches (append-only, one table per extract type)

Never update a row. Latest body for a natural key is the newest `fetched_at`. One ETL run may
insert **several** fetch rows (fast extract, then slow extract chunks). Retry reuses a row that
already landed for that chunk; it does not collapse the run to a single fetch.

- `google_maps_fetches` — `id`, `place_id`, `fetched_from` (`google_maps_details` / `scrape`),
  `run_id` fk, `fetched_at`, `raw` jsonb
- `facebook_fetches` — `id`, Facebook page id / URL, handle, `run_id` fk, `fetched_at`, `raw` jsonb
- `instagram_fetches` — `id`, handle, Instagram user, `run_id` fk, `fetched_at`, `raw` jsonb
- `website_crawl_fetches` — `id`, canonical URL, `run_id` fk, `fetched_at`, `raw` jsonb
  (one row per crawled URL; fast crawl is the first URL, slow crawl is the rest)
- `trade_registry_fetches` — `id`, registry id, `run_id` fk, `fetched_at`, `raw` jsonb

Company registry parquet and Find autocomplete are not these tables. A later Companies House /
CRO API fetch gets its own fetch table.

Retry of the **same** run reuses the fetch for a chunk that already landed (`place_id` +
`fetched_from` for Maps Details vs scrape; canonical URL for crawl). Remaining slow extract
chunks still insert. A `trigger=scheduled` run extracts again.

## Google Maps listing (live row, no `raw`)

- `google_maps_listings` — `id`, `place_id` unique, `fetched_from` (`google_maps_details` /
  `scrape`), `latest_fetch_id` fk, `display_name`, `primary_type`, `marketing_phone`,
  `website_url`, `google_maps_listing_url`, `listing_address`, `locality`, `rating`,
  `review_count`, `fetched_at`
- `google_maps_listing_opening_hours` — `id`, `listing_id` fk, `day_of_week`, `opens_at`,
  `closes_at`, `closed`
- `google_maps_listing_reviews` — `id`, `listing_id` fk, `external_id` (Google’s review id,
  unique per listing when present), `author_name`, `rating` (1–5), `body`, `published_at`
  nullable, `language` nullable
- `google_maps_listing_photos` — `id`, `listing_id` fk, `external_id`, `source_url`,
  `content_hash` nullable

The Google Maps listing is this row, not a blob on a fetch. Hours, reviews, and photo refs are
child rows. Profile hours / reviews / media library items are copies transform writes; the listing
stays here.

## Indexes

`runs` (`tenant_id`, `trigger`, `started_at`); unique (`enqueue_id`, `kind`). Fetches: (`place_id`,
`fetched_at` desc) on Maps fetches; (`handle`, `fetched_at` desc) on Instagram fetches. Unique
`google_maps_listings.place_id`.
