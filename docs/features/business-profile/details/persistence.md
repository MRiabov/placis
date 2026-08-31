# Details — persistence

The live `business_profiles` row plus the list tables below **is** the business
profile (except projects: [projects persistence](../projects/persistence.md)). Details the screen edits a
subset; this file still owns the tables because schema `details` is not renamed
yet ([ETL ADR #9](../../etl/ADR.md)). Onboarding and ETL transform write these rows; the website
shows them; ads read them.

Conventions: [persistence conventions](../../../general-architecture/persistence.md) (Postgres schema `details`). Later:
rename this schema to `business_profile` or `profile`. [ADR](ADR.md). Facebook /
Instagram profile and post rows live here (tenant-owned). The Google Maps
listing stays in [ETL](../../etl/persistence.md).

A **detail** is a column (or a row in a list table). Their existing site URL is
a detail; it is not **Website** and not **Placis website**.

Contact split: **marketing phone** and **marketing email** are on the website
and in ads (where leads call / write). **`emergency_phone`** is how we contact
the owner (unpublished; may be the same number). The owner’s sign-in email is
Clerk’s, not a profile column.

Website, ads, and Details read the live row. Apply-the-website-template reads it
as of `accepted_edit_id`. They do not replay profile history on every call.

- `business_profiles` — `id`, `tenant_id` fk unique (required; the unactivated
  tenant created at business lookup, same row later activated), `trade` (open
  text, `minLength` 1, `maxLength` 80 — not a closed enum), `display_name`,
  `trading_name`, `legal_name`, `legal_form`, `company_status`, `description`,
  `established_year`, `company_number`, `vat_number`, `vat_registration_status`,
  `incorporation_date`, `registered_office`, `contact_name`, `marketing_phone`,
  `emergency_phone`, `marketing_email`, `existing_site_url`,
  `google_maps_listing_url`, `facebook_profile_url`, `founder_name`,
  `founder_role`, `founder_occupation`, `founder_nationality`,
  `founder_country_of_residence`, `founder_appointed_on`,
  `founder_media_asset_id` nullable fk, `logo_media_asset_id` nullable fk,
  `brand_tone`, `brand_typography`, `brand_primary_color`, `brand_accent_color`,
  `last_edit_id` nullable fk, `accepted_edit_id` nullable fk, timestamps

- `business_profile_edits` — Profile history. Append-only typed increments.
  Never `details` jsonb and never a full-row dump of the profile. Each row is
  one field or one list-item change.

  `id`, `tenant_id` fk, `business_profile_id` fk, `op`
  (`set`/`clear`/`add`/`remove`/`update`), `field` nullable (scalar column when
  `op` is `set`/`clear`: `trade`, `display_name`, `trading_name`, `legal_name`,
  `legal_form`, `company_status`, `description`, `established_year`,
  `company_number`, `vat_number`, `vat_registration_status`,
  `incorporation_date`, `registered_office`, `contact_name`, `marketing_phone`,
  `emergency_phone`, `marketing_email`, `existing_site_url`,
  `google_maps_listing_url`, `facebook_profile_url`, `founder_name`,
  `founder_role`, `founder_occupation`, `founder_nationality`,
  `founder_country_of_residence`, `founder_appointed_on`,
  `founder_media_asset_id`, `logo_media_asset_id`, `brand_tone`,
  `brand_typography`, `brand_primary_color`, `brand_accent_color`), `list`
  nullable
  (`services`/`service_areas`/`opening_hours`/`reviews`/`certifications`/
  `facebook_posts`/`instagram_posts`/`projects` when the op is a list change),
  `list_item_id` nullable, `text_value`, `int_value`, `date_value`, `bool_value`
  (check: the column that matches `field` is set; the others are null — not a
  json `value`), `created_by`
  (`business_research`/`voice`/`text`/`human`/`llm`), origin (where it came
  from: `google_maps_listing`/`company_registry_record`/`client_interview`/
  `business_research`/`facebook`/`instagram`/`website_crawl`/`owner`),
  `algorithm` (ETL transform identity, or `human` when the contractor wrote it),
  `schema_revision` (integer; bump when that schema gains fields — next extract
  runs by default), `request_id`, `etl_run_id` nullable, `created_at`

  No `source_id` column on this table.

- `business_profile_edit_sources` — `edit_id` fk, `source_id` fk →
  `etl.sources`, `tenant_id` fk. Unique `(edit_id, source_id)`. Every **ETL**
  increment has **at least one** cite (Maps listing for marketing phone; both
  crawl blobs when both dumps informed trade / services; listing-review for a
  review add). Client interview / Details / `confirm_conflict` increments have
  **no** junction rows (they were not generated from extract blobs). Keep
  `origin` for product copy (the ETL source kind); the junction is the blob
  list. `etl_run_id` is which run. `ai_generations` is the LLM call if any.

This table is the audit for profile edits (the increment row, not the junction).
Generic `audit_events` stays for website publication / website activation /
etc.

**Write:** `SELECT … FOR UPDATE` the profile row, insert one increment per field
or list item the writer actually set (never the whole profile), `UPDATE` only
those live profile columns or list rows in the same transaction. Client
interview writes `algorithm=human`; ETL transform writes the current transform
`algorithm` and `schema_revision` **and** ≥1 `business_profile_edit_sources`.
ETL must not `UPDATE` a live profile column whose winning edit is
`algorithm=human` (empty new fields after a `schema_revision` bump may still
fill). Client interview and business research run at the same time; the row
lock serializes them. Different fields both persist. Same field: both edits
stay in the log; if the values disagree, that is a research conflict (show
both). Do not read the whole profile, merge in memory, and write it back.

**Replay** the edit list only to rebuild a damaged live business profile, to
show Profile history, or to reconstruct the profile as of `accepted_edit_id`
(client interview complete).

- `business_profile_services` — `id`, `tenant_id` fk, `business_profile_id` fk,
  `name`, `description`, `website_page_path`. Featured services on Details is
  this list (list-item PATCH), not a textarea.
- `business_profile_service_areas` — `id`, `tenant_id` fk, `business_profile_id`
  fk, `locality`, `radius_km` nullable (for Meta when ad posting exists; the
  owner picks a Google Maps territory, not a free-text area list)
- `business_profile_opening_hours` — `id`, `tenant_id` fk, `business_profile_id`
  fk, `day_of_week`, `opens_at`, `closes_at`, `closed`. Hours they pick up the
  marketing phone. No `note` column.
- `business_profile_reviews` — `id`, `tenant_id` fk, `business_profile_id` fk,
  `google_maps_listing_review_id` nullable fk →
  `etl.google_maps_listing_reviews`, `facebook_page_review_external_id` nullable
  (unique per profile when set), `author_name`, `rating` (1–5), `body` (full
  imported text; owner-written `maxLength` 500), `citation` (`maxLength` 500;
  about two or three sentences; what cards, the website, and ads paint; fallback
  `body` if empty), `published_at` nullable, `language` nullable, `origin`
  (`google_maps_listing` / `facebook_business_page` / `owner`), `is_top` bool,
  `top_position` nullable int (only when `is_top`; dense order 1…n, **n ≤ 30**;
  1 is most featured), `status` (`in_pool` / `archived`), `position`

  Top set: partial unique index
  `(business_profile_id, top_position) WHERE top_position IS NOT NULL` (non-top
  rows keep `top_position` null). Check: `is_top` iff `top_position` is set, and
  `top_position` is 1–30. Unique 1–30 is the cap — two rows cannot share a
  number. Writers never assign a single `top_position`. They replace the whole
  ordered id list in one transaction (`SELECT … FOR UPDATE` the profile row,
  then densify 1…n from that list). River job `reviews_ranking_for_display`
  ([jobs](../../../general-architecture/jobs.md); provisional after ETL fast
  extract, persistent after ETL finishes) and Certifications and reviews
  PATCH do the same replace, not a merge. Provisional pins are not
  a skip key. Owner PATCH is `algorithm=human` and is not overwritten.
  Orchestration:
  [build-profile](../../onboarding/pipeline/build-profile.md).

Website sections hold their own ordered ids via `website_slot_reviews`. Ads use
`is_top`. They do not copy the text except at website publication (citation
baked into the website manifest). Archive is not delete: archived imported rows
stay so re-import does not duplicate that external id; archive also drops that
id from every website section array. Profile-history list ops for `reviews`
include `update` for top pin/reorder.

- `facebook_profiles` — `id`, `tenant_id` fk, `business_profile_id` fk unique,
  `source_id` fk required → `etl.sources` (`source_kind=facebook_profile`),
  Facebook page id / URL, handle, `algorithm`, `schema_revision`,
  `latest_fetch_id` nullable fk → `etl.facebook_fetches`
- `facebook_posts` — `id`, `tenant_id` fk, `facebook_profile_id` fk,
  `source_id` fk required → `etl.sources` (`source_kind=facebook_post`),
  `external_id` unique per profile, body / media library refs, `published_at`
  nullable, `algorithm`, `schema_revision`
- `instagram_profiles` — `id`, `tenant_id` fk, `business_profile_id` fk unique,
  `source_id` fk required → `etl.sources` (`source_kind=instagram_profile`),
  handle, Instagram user, `algorithm`, `schema_revision`, `latest_fetch_id`
  nullable fk → `etl.instagram_fetches`
- `instagram_posts` — `id`, `tenant_id` fk, `instagram_profile_id` fk,
  `source_id` fk required → `etl.sources` (`source_kind=instagram_post`),
  `external_id` unique per profile, body / media library refs, `published_at`
  nullable, `algorithm`, `schema_revision`

ETL transform upserts these on source `external_id` unless `algorithm=human`.
Raw stays on the fetch tables. Skip / `force` / `human`: [ETL pipeline](../../etl/pipeline/README.md).

Photo classification (hero / project / service / founder / logo) is `photo_kind`
on [`media_assets`](../../other/media/persistence.md) used by this profile. There is no
`etl.photo_classifications` table.

- `certification_definitions` — global (not tenant): `id`, `name`,
  `short_label`, `trades`, `country`, `badge` (file or URL), `registry_url`.
  Postgres schema `details`, not `website`.
- `business_profile_certification_selections` — `id`, `tenant_id` fk,
  `business_profile_id` fk, `certification_id` fk (`certification_definitions`),
  `status` (`selected`/`removed`), `created_at`. Unchecking is `removed`. HTTP
  is `GET`/`PUT /v1/business-profile/certifications` (`available[]` plus
  selected); this table is not an HTTP collection.

The website and ads read selected certifications from these rows. They do not
copy the definitions except at website publication (slim `certifications[]` in
the website manifest).
