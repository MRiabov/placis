# ETL — persistence

Conventions:
[persistence conventions](../../general-architecture/persistence.md)
(Postgres schema `etl`). Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).

Transformed Facebook / Instagram rows live on the
[business profile](../business-profile/details/persistence.md), not here.
`jsonb` is `raw` on each fetch table only. Live listing / crawl HTML URL /
profile / post rows have no `raw`.

## Tables

### `runs`

- **Columns:** `id` uuid, `tenant_id` fk, `enqueue_id` uuid, `trigger`,
  `etl_run_kind`, `status`, `onboarding_session_id` uuid nullable fk,
  `place_id` text nullable, `website_url` text nullable,
  `facebook_page_url` text nullable, `instagram_handle` text nullable,
  `error` text nullable, `started_at` timestamptz, `finished_at`
  timestamptz
- **Enums:** `trigger` → `onboarding` / `scheduled`; `etl_run_kind` →
  `google_maps_listing` / `facebook` / `instagram` / `website_crawl` /
  `trade_registry` / `web_search`; `status` → `pending` / `extracting` /
  `transforming` / `succeeded` / `error` /
  `insufficient_data_for_lookup`
- **Uniques:** `(enqueue_id, etl_run_kind)`
- **Written by:** `StartRun`; extract / transform `Run` (`status`,
  timestamps, `error`)
- **Notes:** One row per ETL run kind that **started**. River retry
  keeps this `id`. Key columns copy details for the running job; details
  themselves live on the onboarding session attach and the live profile.

### Run status and ETL run kinds

`insufficient_data_for_lookup` when scheduled and no **Starts when**
tuple is met, or when onboarding has nothing left that can produce that
detail. Distinct from checklist `skipped`. Timeouts and exhausted
retries are `error`. Do not persist `directory`, `review`, or `photo` as
`etl_run_kind`. Triggers:
[ETL run kind triggers](pipeline/etl-run-kind-triggers.md).

### `sources`

- **Columns:** `id` uuid (`source_id`), `tenant_id` fk, `source_kind`,
  `natural_key` text, timestamps
- **Enums:** `source_kind` → `google_maps_listing` /
  `google_maps_listing_review` / `facebook_profile` / `facebook_post` /
  `instagram_profile` / `instagram_post` / `website_crawl_extract` /
  `website_crawl_html` / `company_registry_record` /
  `trade_registry_record`
- **Uniques:** `(tenant_id, source_kind, natural_key)`
- **Written by:** `extract/googlemaps.Run`; `extract/facebook.Run`;
  `extract/instagram.Run`; `extract/crawl.Run`;
  `extract/traderegistry.Run`; onboarding 01 (`company_registry_record`)
- **Notes:** Identity only. Not mixed fetches, not `raw`, not a Project
  table. No `algorithm`, no yes/no, no `project_id`.

### Cite rules

Insert a row before any cite of that source. Trade registry: insert when
that extract writes profile columns. Company registry: 01 inserts
`source_kind=company_registry_record` when Find registry increments
write legal identity (not an ETL run kind). Web-search / listing photos
are not inserted this spec unless a detail or file cites them.

A `source_id` is never a nullable column. Junctions live next to the
written row
([edit sources](../business-profile/details/persistence.md),
[project sources](../business-profile/projects/persistence.md),
`imported_media_sources`). Owner / client interview writes have **no**
junction rows. Not `ai_generations` and not `etl_run_id`. Do not store
citations as a generic `table.column` string map.

Live rows that **are** the extract have a required `source_id` fk:
listing, listing review, Facebook / Instagram profile and post. Fetches
do not. Images are not `etl.sources` rows. Crawl HTML URL stays one URL
and its photos; Extract markdown and goquery visible text are **two**
sources (same `html_url`, two `source_kind`s, two `source_id`s). Apify
stands in for the crawled HTML when GET fails — not a third source.
`business_profile_reviews` is a copy of the listing review: cite the
listing-review `source_id` on the edit that inserted the profile review.

### Fetch tables (append-only)

Never update a row. Latest body for a natural key is the newest
`fetched_at`. One ETL run may insert **several** fetch rows (ETL fast
extract, then ETL slow extract chunks). Retry reuses a row that already
landed for that chunk. `trigger=scheduled` extracts again. Company
registry parquet and Find autocomplete are not these tables.

### `google_maps_fetches`

- **Columns:** `id` uuid, `place_id` text, `fetched_from`, `run_id` fk
  → `runs`, `fetched_at` timestamptz, `raw` jsonb
- **Enums:** `fetched_from` → `google_maps_details` / `scrape`
- **Written by:** `extract/googlemaps.Run`
- **Notes:** Retry key is `(place_id, fetched_from)` for this `run_id`.

### `facebook_fetches`

- **Columns:** `id` uuid, `facebook_page_id` text,
  `facebook_profile_url` text, `handle` text, `run_id` fk → `runs`,
  `fetched_at` timestamptz, `raw` jsonb
- **Written by:** `extract/facebook.Run`
- **Notes:** Retry of this `run_id` does not insert a second fetch for
  the same `facebook_page_id` already landed.

### `instagram_fetches`

- **Columns:** `id` uuid, `handle` text, `instagram_user` text,
  `run_id` fk → `runs`, `fetched_at` timestamptz, `raw` jsonb
- **Written by:** `extract/instagram.Run`
- **Notes:** Retry of this `run_id` does not insert a second fetch for
  a handle that already landed.

### `website_crawl_fetches`

- **Columns:** `id` uuid, `requested_url` text, `fetched_from`,
  `run_id` fk → `runs`, `fetched_at` timestamptz, `raw` jsonb
- **Enums:** `fetched_from` → `parallel_extract` / `http_get` /
  `apify` / `robots_txt` / `sitemap`
- **Uniques:** `(run_id, requested_url, fetched_from)`
- **Written by:** `extract/crawl.Run`
- **Notes:** One vendor dump per row. HTML URLs use `parallel_extract`
  and `http_get` (or `apify` if GET failed). Discovery GETs use
  `robots_txt` / `sitemap`. Image files are not in `raw`.
  `requested_url` is the resolved absolute URL of this fetch (HTML,
  `robots.txt`, or sitemap), not website `seo_canonical_url`.

### `trade_registry_fetches`

- **Columns:** `id` uuid, `trade_registry_record_id` text, `run_id` fk
  → `runs`, `fetched_at` timestamptz, `raw` jsonb
- **Written by:** `extract/traderegistry.Run`
- **Notes:** Retry of this `run_id` does not insert a second fetch for
  a `trade_registry_record_id` that already landed. A later Companies
  House / CRO API fetch gets its own fetch table.

### `web_search_fetches`

- **Columns:** `id` uuid, `run_id` fk → `runs`, `fetched_at`
  timestamptz, `raw` jsonb
- **Written by:** `extract/websearch.Run`
- **Notes:** Parallel gateway dumps. Retry of this `run_id` reuses a
  fetch that already landed. Transform must not write Parallel prose
  onto the profile.

### `website_crawl_pages`

- **Columns:** `id` uuid, `tenant_id` fk, `html_url` text, `status`,
  `latest_extract_fetch_id` uuid nullable fk → `website_crawl_fetches`,
  `latest_html_fetch_id` uuid nullable fk → `website_crawl_fetches`,
  `latest_apify_fetch_id` uuid nullable fk → `website_crawl_fetches`,
  `fetched_at` timestamptz
- **Enums:** `status` → `discovered` / `fetched`
- **Uniques:** `(tenant_id, html_url)`
- **Written by:** `extract/crawl.Run`
- **Notes:** HTML URLs only (homepage + remainder under the 20 HTML
  cap). Not robots, not sitemaps. Analog of `google_maps_listings`.
  Each `latest_*_fetch_id` is the watermark of the dump that
  contributed (Extract markdown, HTML GET, Apify), not newest
  `fetched_at`.

### Crawl HTML URL sources

Discovered rows have no `source_id` column (a nullable fk is
forbidden). When Extract markdown lands, insert `sources`
`source_kind=website_crawl_extract`. When HTML (GET or Apify) lands,
insert `source_kind=website_crawl_html`. Natural key for both is
`html_url`. Sitemap parse inserts `discovered`. Extract + HTML (or
Apify) complete → `fetched`.

### `website_crawl_page_photos`

- **Columns:** `id` uuid, `page_id` fk → `website_crawl_pages`,
  `source_url` text, `media_asset_id` uuid nullable fk, `content_hash`
  text nullable
- **Written by:** `extract/crawl.Run`
- **Notes:** Depicting photo for a crawl-origin Project must be one of
  these children.

### `imported_media`

- **Columns:** `id` uuid, `tenant_id` fk, `imported_media_kind`,
  `external_id` text, `media_asset_id` fk
- **Enums:** `imported_media_kind` → `google_maps_listing` / `facebook`
  / `instagram` / `website_crawl` / `google_maps_listing_review`
- **Uniques:** `(tenant_id, imported_media_kind, external_id)`
- **Written by:** `transform/googlemaps.Run`; `transform/facebook.Run`;
  `transform/instagram.Run`; `transform/crawl.Run`
- **Notes:** A later extract does not insert a second media library
  item, including when that item is `archived`. Named from
  [media library persistence](../other/media/persistence.md).

### `imported_media_sources`

- **Columns:** `imported_media_id` fk, `source_id` fk → `sources`,
  `tenant_id` fk
- **Uniques:** `(imported_media_id, source_id)`
- **Written by:** `transform/googlemaps.Run`; `transform/facebook.Run`;
  `transform/instagram.Run`; `transform/crawl.Run`
- **Notes:** Every `imported_media` row has **at least one** cite.
  Owner uploads are not this table.

### `google_maps_listings`

- **Columns:** `id` uuid, `source_id` fk → `sources`, `place_id` text,
  `fetched_from`, `latest_fetch_id` fk → `google_maps_fetches`,
  `display_name` text, `primary_type` text, `marketing_phone` text,
  `website_url` text, `google_maps_listing_url` text, `listing_address`
  text, `locality` text, `country`, `latitude` double precision
  nullable, `longitude` double precision nullable, `rating`,
  `review_count`, `fetched_at` timestamptz
- **Enums:** `fetched_from` → `google_maps_details` / `scrape`;
  `country` → `ie` / `gb` / `us` / null
- **Uniques:** `place_id`
- **Written by:** `extract/googlemaps.Run`
- **Notes:** `latest_fetch_id` is the watermark of the dump that
  contributed, not newest `fetched_at`. `country` is Places address
  country, not parsed from `listing_address`. `latitude` /
  `longitude` from Places Details `location`; both null when Details
  never ran.

### Listing children

Hours, reviews, and photo refs are child rows. Review photos from
scrape are children of the review. Profile hours / reviews / media
library items are copies transform writes; the listing stays here.

### `google_maps_listing_opening_hours`

- **Columns:** `id` uuid, `listing_id` fk → `google_maps_listings`,
  `day_of_week`, `opens_at`, `closes_at`, `closed` bool
- **Written by:** `extract/googlemaps.Run`

### `google_maps_listing_reviews`

- **Columns:** `id` uuid, `listing_id` fk → `google_maps_listings`,
  `source_id` fk → `sources`, `external_id` text, `author_name` text,
  `rating` int, `body` text, `published_at` timestamptz nullable,
  `language` text nullable
- **Uniques:** `(listing_id, external_id)` when `external_id` is
  present
- **Written by:** `extract/googlemaps.Run`
- **Notes:** `external_id` is Google’s review id. `source_kind` is
  `google_maps_listing_review`.

### `google_maps_listing_review_photos`

- **Columns:** `id` uuid, `review_id` fk →
  `google_maps_listing_reviews`, `source_url` text, `media_asset_id`
  uuid nullable fk, `content_hash` text nullable
- **Written by:** `extract/googlemaps.Run`
- **Notes:** Scrape photos **on that review** (not listing-level).
  Reviewer avatar is not a row here.

### `google_maps_listing_photos`

- **Columns:** `id` uuid, `listing_id` fk → `google_maps_listings`,
  `external_id` text, `source_url` text, `content_hash` text nullable
- **Written by:** `extract/googlemaps.Run`

### `llm_source_to_project_classifications`

Dedicated prediction table in `etl`, not columns on `etl.sources` and
not a table in `ai`
([classifications and predictions](../../general-architecture/persistence.md#classifications-and-predictions)).

- **Columns:** `id` uuid, `tenant_id` fk, `source_id` fk → `sources`,
  `algorithm` text nullable, `schema_revision` int nullable,
  `usable_as_project` bool, `project_id` uuid nullable fk →
  `business_profile.projects`, `ai_generation_id` uuid nullable fk →
  `ai.ai_generations`, timestamps
- **Uniques:** `source_id`
- **Written by:** `transform/projects.Run`
- **Notes:** Check: `usable_as_project` iff `project_id` is set.
  `project_id` is the Project, not a source. Omit `ai_generation_id`
  when the length gate wrote no with no call.

### Project skip

Do **not** copy title, description, or cover here. Skip when
`algorithm` + `schema_revision` match and `force` is false. Analog of
latest `media_asset_classifications` skip, not columns on
`media_assets`. Skip keys on this row; model / prompt / reasoning on
`ai_generations` (`thread_kind=etl_project_classify`). Must not hang
this skip on Facebook / Instagram posts, profile reviews, crawl HTML
URLs, or `etl.sources`.

## Indexes

Lookup: `(tenant_id, trigger, started_at)` on `runs`. Unique:
`(enqueue_id, etl_run_kind)` on `runs`;
`(tenant_id, source_kind, natural_key)` on `sources`;
`google_maps_listings.place_id`; `(tenant_id, html_url)` on
`website_crawl_pages`; `(run_id, requested_url, fetched_from)` on
`website_crawl_fetches`; `(tenant_id, imported_media_kind, external_id)`
on `imported_media`; `(imported_media_id, source_id)` on
`imported_media_sources`;
`llm_source_to_project_classifications.source_id`. Fetches:
`(place_id, fetched_at desc)` on `google_maps_fetches`;
`(handle, fetched_at desc)` on `instagram_fetches`.
