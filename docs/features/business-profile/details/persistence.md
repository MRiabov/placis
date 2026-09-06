# Details — persistence

The live `business_profiles` row plus the list tables below **is** the
business profile (except projects:
[projects persistence](../projects/persistence.md)). Details the screen
edits a subset; this file still owns those tables. Postgres schema is
`business_profile` (same namespace as projects;
[ETL ADR 9](../../etl/ADR.md)). Onboarding and ETL transform write these
rows; the website shows them; ads read them.

Conventions:
[persistence conventions](../../../general-architecture/persistence.md)
(Postgres schema `business_profile`). Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).
[ADR](ADR.md). Facebook / Instagram profile and post rows live here
(tenant-owned). The Google Maps listing stays in
[ETL](../../etl/persistence.md).

A **detail** is a column (or a row in a list table). Their existing
site URL is a detail; it is not **Website** and not **Placis website**.

Contact split: **marketing phone** and **marketing email** are on the
website and in ads (where leads call / write). **`emergency_phone`** is
how we contact the owner (unpublished; may be the same number). The
owner’s sign-in email is Clerk’s, not a profile column.

Website, ads, and Details read the live row. Apply-the-website-template
reads it as of `accepted_edit_id`. They do not replay profile history
on every call.

## Tables

### `business_profiles`

- **Columns:** `id` uuid pk, `tenant_id` fk, `trade` text, `display_name`
  text, `legal_name` text, `description` text, `established_year` int
  nullable, `company_number` text nullable, `vat_number` text nullable,
  `vat_registration_status` text nullable, `incorporation_date` date
  nullable, `registered_office` text nullable, `contact_name` text
  nullable, `marketing_phone` text nullable, `emergency_phone` text
  nullable, `marketing_email` text nullable, `existing_site_url` text
  nullable, `google_maps_listing_url` text nullable,
  `facebook_profile_url` text nullable, `founder_name` text nullable,
  `founder_role` text nullable, `founder_occupation` text nullable,
  `founder_nationality` text nullable, `founder_country_of_residence`
  text nullable, `founder_appointed_on` date nullable,
  `founder_media_asset_id` uuid nullable fk, `logo_media_asset_id` uuid
  nullable fk, `last_edit_id` uuid nullable fk, `accepted_edit_id` uuid
  nullable fk, `created_at` timestamptz, `updated_at` timestamptz
- **Enums:** none closed. `trade` is open text (`minLength` 1,
  `maxLength` 80)
- **Uniques:** `tenant_id` (required; the unactivated tenant created at
  business lookup, same row later activated)
- **Written by:** `ApplyBusinessProfileIncrement` (`UpdateBusinessProfile`,
  `update_details`, `UndoBusinessProfileEdit`,
  `UpdateOnboardingBusinessProfile`, `UndoOnboardingBusinessProfileEdit`);
  onboarding client interview; ETL transform
- **Notes:** No `trading_name` / `legal_form` / `company_status`. No
  `brand_*` — website look is
  [`website_settings`](../../website/persistence.md). No ranking
  columns — pins live on `business_profile_review_rankings`.
  `registered_office` is the address (`{{address}}` and
  `{{registered_office}}` both resolve from it). No second location
  column.

### `business_profile_edits`

- **Columns:** `id` uuid pk, `tenant_id` fk, `business_profile_id` fk,
  `op` text, `field` text nullable, `list` text nullable,
  `list_item_id` uuid nullable, `text_value` text nullable, `int_value`
  int nullable, `date_value` date nullable, `bool_value` bool nullable,
  `created_by` text, `origin` text, `algorithm` text,
  `schema_revision` int, `request_id` text, `etl_run_id` uuid nullable,
  `created_at` timestamptz
- **Enums:** `op` → `set` / `clear` / `add` / `remove` / `update`;
  `field` (when `op` is `set` / `clear`) → `trade` / `display_name` /
  `legal_name` / `description` / `established_year` / `company_number` /
  `vat_number` / `vat_registration_status` / `incorporation_date` /
  `registered_office` / `contact_name` / `marketing_phone` /
  `emergency_phone` / `marketing_email` / `existing_site_url` /
  `google_maps_listing_url` / `facebook_profile_url` / `founder_name` /
  `founder_role` / `founder_occupation` / `founder_nationality` /
  `founder_country_of_residence` / `founder_appointed_on` /
  `founder_media_asset_id` / `logo_media_asset_id`; `list` (when the op
  is a list change) →
  `services` / `service_areas` / `opening_hours` / `reviews` /
  `certifications` / `projects`;
  `created_by` → `business_research` / `voice` / `text` / `human` /
  `llm`; `origin` → `google_maps_listing` / `company_registry_record` /
  `client_interview` / `business_research` / `facebook` / `instagram` /
  `website_crawl` / `owner`; `algorithm` is ETL transform identity, or
  `human` when the contractor wrote it
- **Uniques:** `id`
- **Written by:** `ApplyBusinessProfileIncrement`;
  `UndoBusinessProfileEdit` (compensating increment); onboarding client
  interview; ETL transform; `CreateProject`; `UpdateProject`;
  `ApproveProject`; `ArchiveProject`; `UnarchiveProject`
- **Notes:** Append-only typed increments. Never `details` jsonb and
  never a full-row dump of the profile. Each row is one field or one
  list-item change. Check: the typed value column that matches `field`
  is set; the others are null — not a json `value`. No `source_id`
  column on this table. `schema_revision` bumps when that schema gains
  fields (next extract runs by default). This table is the trail for
  profile edits (the increment row, not the junction). Website
  publication and website activation live on `website_publications`
  and `website_activations`. Profile-history list ops for `reviews`
  include `update` for top pin/reorder (the increment names the list
  change; live pins are `business_profile_review_rankings`). No `list`
  `facebook_posts` / `instagram_posts` — ETL upserts those tables, not
  via increments (CHECK swap later if leftover enum values exist).
  Owner Project HTTP appends `list=projects` the same way ETL Projects
  does.

### Write

`SELECT … FOR UPDATE` the profile row, insert one increment per field
or list item the writer actually set (never the whole profile),
`UPDATE` only those live profile columns or list rows in the same
transaction. Client interview writes `algorithm=human`; ETL transform
writes the current transform `algorithm` and `schema_revision` **and**
≥1 `business_profile_edit_sources`. ETL must not `UPDATE` a live
profile column whose winning edit is `algorithm=human` (empty new
fields after a `schema_revision` bump may still fill). Client interview
and business research run at the same time; the row lock serializes
them. Different fields both persist. Same field: both edits stay in
the log; if the values disagree, that is a research conflict (show
both). Do not read the whole profile, merge in memory, and write it
back.

**Replay** the edit list only to rebuild a damaged live business
profile, to show Profile history, or to reconstruct the profile as of
`accepted_edit_id` (client interview complete).

### `business_profile_edit_sources`

- **Columns:** `edit_id` fk, `source_id` fk → `etl.sources`,
  `tenant_id` fk
- **Enums:** none
- **Uniques:** `(edit_id, source_id)`
- **Written by:** ETL transform (every ETL increment)
- **Notes:** Every **ETL** increment has **at least one** cite (Maps
  listing for marketing phone; both crawl sources when both dumps
  informed trade / services; listing-review for a review add). Client
  interview / Details / `confirm_conflict` increments have **no**
  junction rows (they were not generated from extracts). Keep `origin`
  for product copy (the ETL source kind); the junction is the source
  list. `etl_run_id` is which run. `ai_generations` is the LLM call if
  any.

### `business_profile_services`

- **Columns:** `id` uuid pk, `tenant_id` fk, `business_profile_id` fk,
  `name` text, `description` text nullable, `website_page_path` text
  nullable
- **Enums:** none
- **Uniques:** `id`
- **Written by:** `ApplyBusinessProfileIncrement` (list `services`);
  onboarding client interview; ETL transform;
  `CopyWebsiteTemplatePages` (`website_page_path` only)
- **Notes:** Featured services on Details is this list (list-item
  PATCH), not a textarea. `website_page_path` is the service website
  page 02 copied. Owner PATCH / `BusinessProfileServiceOp` must not
  write it. Null until 02; a service added after 02 stays null.

### `business_profile_service_areas`

- **Columns:** `id` uuid pk, `tenant_id` fk, `business_profile_id` fk,
  `locality` text, `radius_km` numeric nullable
- **Enums:** none
- **Uniques:** `id`
- **Written by:** `ApplyBusinessProfileIncrement` (list
  `service_areas`); onboarding client interview; ETL transform
- **Notes:** The owner picks a Google Maps territory, not a free-text
  area list. `radius_km` is for Meta when ad posting exists.

### `business_profile_opening_hours`

- **Columns:** `id` uuid pk, `tenant_id` fk, `business_profile_id` fk,
  `day_of_week` text, `opens_at` time nullable, `closes_at` time
  nullable, `closed` bool
- **Enums:** `day_of_week` → weekday
- **Uniques:** `(business_profile_id, day_of_week)`
- **Written by:** `ApplyBusinessProfileIncrement` (list
  `opening_hours`); onboarding client interview; ETL transform
- **Notes:** Hours they pick up the marketing phone. No `note` column.
  One Opens / Closes / Closed per weekday.

### `business_profile_reviews`

- **Columns:** `id` uuid pk, `tenant_id` fk, `business_profile_id` fk,
  `google_maps_listing_review_id` uuid nullable fk →
  `etl.google_maps_listing_reviews`,
  `facebook_page_review_external_id` text nullable, `author_name`
  text, `rating` int, `body` text, `citation` text, `published_at`
  timestamptz nullable, `language` text nullable, `origin` text,
  `status` text
- **Enums:** `origin` → `google_maps_listing` /
  `facebook_business_page` / `owner`; `status` → `in_pool` /
  `archived`
- **Uniques:** nullable unique
  `(business_profile_id, facebook_page_review_external_id)` when set
- **Written by:** `CreateBusinessProfileReview`;
  `ImportBusinessProfileReviews`; `ArchiveBusinessProfileReview`;
  `UnarchiveBusinessProfileReview`; ETL transform
- **Notes:** The review row is imported or owner-written text. No
  `is_top` / `top_position` / `position` — pins live on
  `business_profile_review_rankings`. `rating` 1–5. Imported `body` is
  full text; owner-written `maxLength` 500. `citation` `maxLength` 500
  (about two or three sentences; what cards, the website, and ads
  paint; fallback `body` if empty). Archive is not delete: archived
  imported rows stay so re-import does not duplicate that external id;
  archive also drops that id from every website section array and
  inserts a ranking row with `is_top=false` so latest is not a stale
  pin. Website sections hold their own ordered ids via
  `website_slot_reviews`. Ads hydrate `is_top` from the latest ranking
  join. They do not copy the text except at website publication
  (citation baked into the website manifest).

### `business_profile_review_rankings`

- **Columns:** `id` uuid pk, `tenant_id` fk, `business_profile_id` fk,
  `review_id` fk → `business_profile_reviews`, `is_top` bool,
  `top_position` int nullable, `provisional` bool, `algorithm` text,
  `schema_revision` int, `ai_generation_id` uuid nullable fk →
  `ai.ai_generations`, `created_at` timestamptz
- **Enums:** `algorithm` is the ranking job identity, or `human` when
  the contractor pinned
- **Uniques:** `id`. Not unique on `review_id` (many rows per review)
- **Written by:** `UpdateBusinessProfileReviews`;
  `ArchiveBusinessProfileReview`; River job
  `reviews_ranking_for_display`
  ([jobs](../jobs.md))
- **Notes:** Ranking prediction about a review, not a column on the
  review
  ([classifications and predictions](../../../general-architecture/persistence.md#classifications-and-predictions)).
  Insert only. Current = latest `created_at` for that `review_id`. No
  pointer on the review or profile. HTTP / ads / Certifications
  hydrate `is_top` / `top_position` from this join.
  `top_reviews_provisional` on `ReviewListRead` is the latest ranking
  batch’s `provisional` (same `created_at` / `ai_generation_id` for
  that replace). Ranking job and owner PATCH insert one row per
  `in_pool` review in that replace (`SELECT … FOR UPDATE` the profile
  row). Unpinned `in_pool` rows get `is_top=false` / `top_position`
  null so latest is not a stale pin. `top_position` only when
  `is_top`; dense order 1…n on the **current** batch, **n ≤ 30**; 1 is
  most featured. Check: `is_top` iff `top_position` is set, and
  `top_position` is 1–30. Writers never assign a single
  `top_position`. `provisional=true` when overlapping ETL for this
  onboarding enqueue is still running; `false` when that enqueue’s ETL
  is done, on scheduled ranking, or on owner PATCH
  (`algorithm=human`). Not a skip key. Skip overwrite when latest
  ranking for that review is `algorithm=human`. ETL finish with no
  extra `in_pool` rows: insert a copy of the latest batch with
  `provisional=false`, no LLM (same pattern as copying a
  classification onto a crop child). Orchestration:
  [build-profile](../../onboarding/pipeline/build-profile.md).
  `ai_generation_id` is the ranking LLM call (omit on a copy or owner
  PATCH).

### `facebook_profiles`

- **Columns:** `id` uuid pk, `tenant_id` fk, `business_profile_id` fk,
  `source_id` fk required → `etl.sources`, `facebook_page_id` text,
  `facebook_profile_url` text, `handle` text, `name` text nullable,
  `photo_url` text nullable, `rating` numeric nullable,
  `review_count` int nullable, `algorithm` text,
  `schema_revision` int, `latest_fetch_id` uuid nullable fk →
  `etl.facebook_fetches`
- **Enums:** none closed
- **Uniques:** `business_profile_id`
- **Written by:** `transform/facebook.Run`
- **Notes:** `source_kind=facebook_profile`. `latest_fetch_id` is the
  watermark of the dump that contributed, not newest `fetched_at`.
  Transform writes `name` / `photo_url` / `rating` / `review_count`
  from that fetch (must not dump `raw` onto this row). Details GET
  hydrates `LinkedFacebookProfileRead` from this row when
  `facebook_profile_url` is linked. Null card until transform has
  upserted those fields. `photo_url` is a text URL; post photos stay
  media-library attach.

### `facebook_posts`

- **Columns:** `id` uuid pk, `tenant_id` fk, `facebook_profile_id` fk,
  `source_id` fk required → `etl.sources`, `external_id` text, body /
  media library refs, `published_at` timestamptz nullable, `algorithm`
  text, `schema_revision` int
- **Enums:** none closed
- **Uniques:** `(facebook_profile_id, external_id)`
- **Written by:** `transform/facebook.Run`
- **Notes:** `source_kind=facebook_post`. Owner
  `PATCH /v1/business-profile` must not write this table. No
  `business_profile_edits.list` value. Skip /
  `force` / `human`:
  [ETL pipeline](../../etl/pipeline/README.md).

### `instagram_profiles`

- **Columns:** `id` uuid pk, `tenant_id` fk, `business_profile_id` fk,
  `source_id` fk required → `etl.sources`, `handle` text,
  `instagram_user` text, `name` text nullable, `photo_url` text
  nullable, `algorithm` text, `schema_revision` int,
  `latest_fetch_id` uuid nullable fk → `etl.instagram_fetches`
- **Enums:** none closed
- **Uniques:** `business_profile_id`
- **Written by:** `transform/instagram.Run`
- **Notes:** `source_kind=instagram_profile`. `latest_fetch_id` is the
  watermark of the dump that contributed, not newest `fetched_at`.
  Transform writes `name` / `photo_url` from that fetch (must not dump
  `raw` onto this row). No `rating` / `review_count` (not a listing).
  Not a Details linked card. Post photos stay media-library attach.

### `instagram_posts`

- **Columns:** `id` uuid pk, `tenant_id` fk, `instagram_profile_id` fk,
  `source_id` fk required → `etl.sources`, `external_id` text, body /
  media library refs, `published_at` timestamptz nullable, `algorithm`
  text, `schema_revision` int
- **Enums:** none closed
- **Uniques:** `(instagram_profile_id, external_id)`
- **Written by:** `transform/instagram.Run`
- **Notes:** `source_kind=instagram_post`. Owner
  `PATCH /v1/business-profile` must not write this table. No
  `business_profile_edits.list` value. ETL transform
  upserts on source `external_id` unless `algorithm=human`.

Photo kind (`logo` / `photo`) is latest `photo_kind` on
[`media_asset_classifications`](../../other/media/persistence.md),
written by `DescribeImage`. There is no `etl.photo_classifications`
table.

### `certification_definitions`

- **Columns:** `id` uuid pk, `name` text, `short_label` text, `trades`
  text[], `country` text, `badge` text, `registry_url` text nullable
- **Enums:** none closed
- **Uniques:** `id`
- **Written by:** catalogue seed (not tenant HTTP)
- **Notes:** Global (not tenant). Postgres schema `business_profile`,
  not `website`. `available[]` on certifications HTTP.
  `registry_url` is optional. When set, the website and CMS paint the
  badge/card as a link to that URL. Null: not a link.

### `business_profile_certification_selections`

- **Columns:** `id` uuid pk, `tenant_id` fk, `business_profile_id` fk,
  `certification_id` fk (`certification_definitions`), `status` text,
  `created_at` timestamptz
- **Enums:** `status` → `selected` / `removed`
- **Uniques:** `(business_profile_id, certification_id)`
- **Written by:** `PutBusinessProfileCertifications`; onboarding client
  interview
- **Notes:** Unchecking is `removed`. HTTP is
  `GET` / `PUT /v1/business-profile/certifications` (`available[]`
  plus selected); this table is not an HTTP collection. The website
  and ads read selected certifications from these rows. They do not
  copy the definitions except at website publication (slim
  `certifications[]` in the website manifest, including optional
  `registry_url`).

## Indexes

Lookup: `(tenant_id)` on `business_profiles` (also unique). Lookup:
`(tenant_id, business_profile_id, created_at)` on
`business_profile_edits`. Unique: `business_profile_edit_sources`
`(edit_id, source_id)`. Unique: `facebook_profiles.business_profile_id`;
`instagram_profiles.business_profile_id`. Unique:
`facebook_posts` `(facebook_profile_id, external_id)`;
`instagram_posts` `(instagram_profile_id, external_id)`. Lookup:
`business_profile_review_rankings` `(review_id, created_at)`;
`(business_profile_id, created_at)`. Unique weekday:
`business_profile_opening_hours` `(business_profile_id, day_of_week)`.
Unique: `business_profile_certification_selections`
`(business_profile_id, certification_id)`. The current ranking batch’s
dense `top_position` 1…n (n ≤ 30) is an invariant on latest rows, not
a unique on this table (insert-only history).
