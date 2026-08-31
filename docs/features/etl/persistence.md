# ETL — persistence

Conventions: [persistence conventions](../../general-architecture/persistence.md) (Postgres schema `etl`). Transformed
Facebook / Instagram rows and photo classification live on the
[business profile](../business-profile/details/persistence.md), not here.

`jsonb` is `raw` on each fetch table only.

## Runs

- `runs` — `id`, `tenant_id` fk, `enqueue_id` (uuid, shared by every ETL run kind
  that started in one `StartRun` call), `trigger` (`onboarding` / `scheduled`),
  `etl_run_kind` (`google_maps_listing` / `facebook` / `instagram` /
  `website_crawl` / `trade_registry` / `web_search`), `status` (`pending` /
  `extracting` / `transforming` / `succeeded` / `error` / `skipped`),
  `onboarding_session_id` nullable fk, `place_id` nullable, `website_url`
  nullable, `facebook_page_url` nullable, `instagram_handle` nullable, `error`
  nullable, `started_at`, `finished_at`. One row per ETL run kind that **started**.
  River retry keeps this `id`. Key columns copy details for the running job
  (Maps `place_id`, crawl `website_url`, Facebook page URL, Instagram handle).
  Details themselves live on the onboarding session attach and the live
  profile. `skipped` when scheduled and no **Starts when** tuple is met, or
  when onboarding has nothing left that can produce that detail. Do not persist
  `directory`, `review`, or `photo` as `etl_run_kind` — those are not ETL run kinds.
  Triggers: [ETL run kind triggers](pipeline/etl-kind-triggers.md).

## Sources (live extract identity)

Anything extractable that later writes may **cite**. Identity only. Not mixed
fetches, not `raw`, not a Project table.

- `sources` — `id` (`source_id`), `tenant_id` fk, `source_kind`
  (`google_maps_listing` / `google_maps_listing_review` /
  `facebook_profile` / `facebook_post` / `instagram_profile` /
  `instagram_post` / `website_crawl_extract` / `website_crawl_html` /
  `company_registry_record` / `trade_registry_record`), `natural_key` (text;
  unique per `(tenant_id, source_kind)`), timestamps

**No** `algorithm`, **no** yes/no, **no** `project_id`. Insert a row before any
cite of that source. Trade registry: insert when that extract writes profile
columns (cannot cite a missing id). Company registry: **01** inserts
`source_kind=company_registry_record` when Find registry increments write legal
identity (not an ETL run kind). Web-search / listing **photos** are not
inserted this spec unless a detail or file cites them.

A `source_id` is never a nullable column. The junction is many-to-many with
**at least one** `source_id` when extracts produced the data. Junctions live
next to the written row ([edit sources](../business-profile/details/persistence.md),
[project sources](../business-profile/projects/persistence.md),
`imported_media_sources` below). Owner / client interview writes have **no**
junction rows (they were not generated from extracts). This is which
extracts produced the data. It is not `ai_generations` (the LLM call) and not
`etl_run_id` (which run). Do not store citations as a generic `table.column`
string map.

Live rows that **are** the extract have a required `source_id` fk (not
nullable): listing, listing review, Facebook / Instagram profile and post.
Fetches do not. Images are not `etl.sources` rows. Crawl **HTML URL** stays one
URL + photos; Extract markdown and goquery visible text are **two** sources
(same canonical URL, two `source_kind`s, two `source_id`s). Apify stands in for
the crawled HTML when GET fails — not a third source. `business_profile_reviews`
is a copy of the listing review: cite the listing-review `source_id` on the edit
that inserted the profile review, not a second source.

## Fetches (append-only, one table per extract type)

Never update a row. Latest body for a natural key is the newest `fetched_at`.
One ETL run may insert **several** fetch rows (ETL fast extract, then ETL slow
extract chunks). Retry reuses a row that already landed for that chunk; it does
not collapse the run to a single fetch.

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
`fetched_from` for crawl). Remaining ETL slow extract chunks still insert. A
`trigger=scheduled` run extracts again.

## Website crawled URLs (live row, no `raw`)

HTML URLs only (homepage + remainder under the 20 HTML cap). Not robots, not
sitemaps. Analog of `google_maps_listings` / `facebook_posts`. Depicting
photos live here. Project skip does **not**.

- `website_crawl_pages` — `id`, `tenant_id` fk, canonical URL unique per tenant,
  `status` (`discovered` / `fetched`), latest fetch ids for extract / html /
  apify, `fetched_at`

  Discovered rows have no `source_id` column (a nullable fk is forbidden). When
  Extract markdown lands, insert `sources`
  `source_kind=website_crawl_extract`. When HTML (GET or Apify) lands, insert
  `source_kind=website_crawl_html`. Natural key for
  both is the canonical URL.

- `website_crawl_page_photos` — `id`, `page_id` fk, `source_url`,
  `media_asset_id` nullable fk, `content_hash` nullable

Sitemap parse inserts `discovered`. Extract + HTML (or Apify) complete →
`fetched`. Depicting photo for a crawl-origin Project must be one of these
children.

## `imported_media`

- `imported_media` — `id`, `tenant_id` fk, `imported_media_kind`
  (`google_maps_listing` / `facebook` / `instagram` / `website_crawl` /
  `google_maps_listing_review`), `external_id`, `media_asset_id` fk. Unique
  `(tenant_id, imported_media_kind, external_id)`
  so a later extract does not insert a second media library item, including
  when that item is `archived`. Named from
  [media library persistence](../other/media/persistence.md).
- `imported_media_sources` — `imported_media_id` fk, `source_id` fk →
  `etl.sources`, `tenant_id` fk. Unique `(imported_media_id, source_id)`.
  Every `imported_media` row has **at least one** cite (parent source: listing,
  listing review, Facebook / Instagram post, crawl extract and/or HTML).
  Owner uploads are not this table.

## Google Maps listing (live row, no `raw`)

- `google_maps_listings` — `id`, `source_id` fk required → `etl.sources`
  (`source_kind=google_maps_listing`), `place_id` unique, `fetched_from`
  (`google_maps_details` / `scrape`), `latest_fetch_id` fk, `display_name`,
  `primary_type`, `marketing_phone`, `website_url`, `google_maps_listing_url`,
  `listing_address`, `locality`, `country` (`ie` / `gb` / `us` nullable; Places
  address country, not parsed from `listing_address`), `latitude` double
  precision nullable, `longitude` double precision nullable (Places Details
  `location`; skip when Details never ran), `rating`, `review_count`,
  `fetched_at`
- `google_maps_listing_opening_hours` — `id`, `listing_id` fk, `day_of_week`,
  `opens_at`, `closes_at`, `closed`
- `google_maps_listing_reviews` — `id`, `listing_id` fk, `source_id` fk
  required → `etl.sources` (`source_kind=google_maps_listing_review`),
  `external_id`
  (Google’s review id, unique per listing when present), `author_name`,
  `rating` (1–5), `body`, `published_at` nullable, `language` nullable
- `google_maps_listing_review_photos` — `id`, `review_id` fk, `source_url`,
  `media_asset_id` nullable fk, `content_hash` nullable. Scrape photos **on
  that review** (not listing-level). Reviewer avatar is not a row here.
- `google_maps_listing_photos` — `id`, `listing_id` fk, `external_id`,
  `source_url`, `content_hash` nullable

The Google Maps listing is this row, not unstructured jsonb on a fetch. Hours,
reviews, and
photo refs are child rows. Review photos from scrape are children of the
review. Profile hours / reviews / media library items are copies transform
writes; the listing stays here.

## Project verdict (skip)

- `llm_source_to_project_classifications` — `id`, `tenant_id` fk, `source_id`
  fk unique required → `etl.sources`, `algorithm` nullable,
  `schema_revision` nullable, `usable_as_project` (yes or no), `project_id`
  nullable fk → `business_profile.projects` (required when yes; **null** when
  no — that UUID is the Project, not a source), `ai_generation_id` nullable
  fk → `ai.ai_generations` (the LLM call for that classify; omit when the
  length gate wrote no with no call), timestamps

  Check: `usable_as_project` iff `project_id` is set. Do **not** copy title,
  description, or cover here. Skip when `algorithm` + `schema_revision` match
  and `force` is false. Analog of `photo_kind_*` on the classified thing:
  skip keys on this row; model / prompt / reasoning on `ai_generations`
  (`thread_kind=etl_project_classify`).
  Must not hang this skip on Facebook / Instagram posts, profile reviews,
  crawl HTML URLs, or `etl.sources`.

## Indexes

`runs` (`tenant_id`, `trigger`, `started_at`); unique (`enqueue_id`,
`etl_run_kind`). Fetches: (`place_id`, `fetched_at` desc) on Maps fetches;
(`handle`, `fetched_at` desc) on Instagram fetches; (`canonical URL`,
`fetched_from`) unique per `run_id` on crawl fetches. Unique
`google_maps_listings.place_id`. Unique `website_crawl_pages` canonical URL
per tenant. Unique `(tenant_id, source_kind, natural_key)` on `sources`. Unique
`llm_source_to_project_classifications.source_id`.
