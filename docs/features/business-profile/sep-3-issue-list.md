# Sep 3 issue list — Business profile

Reclassified 2026-09-03 against [details/ADR.md](details/ADR.md) and
[projects/ADR.md](projects/ADR.md). Several original items were already
executed on 2026-09-02 (brand columns, ranking table). Bold numbers are
original audit ids (not compacted).

## Keep (ADR)

- **1. Founder columns besides `founder_name`**
  Comment: details ADR 3 (amended 2026-09-02): founder columns and
  `logo_media_asset_id` remain; only `brand_*` went.
  `BusinessProfileRead` lists them. `details/frontend.md` “do not add
  unless asked” is the **screen**, not the contract.

## Closed (2026-09-06)

- **5. `certification_definitions.registry_url`**
  Keep the optional column. When set, the website and CMS paint the
  certification image/card as an `<a href>` to that URL. Null: not a
  link. Slim `certifications[]` includes `registry_url`.

- **6. Website variables with no backing column (`{{address}}`)**
  `{{address}}` resolves from `registered_office` (the address).
  Service areas remain where they work. No second location column.
  `{{projects.categories}}` is still a separate website item 21
  question.

- **9. `business_profile_services.website_page_path`**
  02 Copy website template pages writes the path. Owner PATCH /
  `BusinessProfileServiceOp` must not.

- **10. `emergency_phone` vs Details screen**
  Contact panel on Details (unpublished; not on the website). Onboarding
  Details == this field.

- **11. `list=projects` increments**
  Owner Project HTTP appends `business_profile_edits` (`list=projects`),
  same log ETL already writes.

- **11b. `business_profile_edits.list` = `facebook_posts` /
  `instagram_posts`**
  Dropped from the `list` enum. ETL still upserts those tables. CHECK
  swap later if leftover enum values exist.

- **12. Linked-Facebook card vs `facebook_profiles` columns**
  Transform writes card fields on `facebook_profiles`. GET reads that
  row. Maps GET reads `google_maps_listings`. Instagram transform
  writes `name` / `photo_url` on `instagram_profiles` (not a Details
  card). Never GET-from-fetch `raw`.

## False alarms (closed)

- **Four `brand_*` columns** — details ADR 3 (2026-09-02); gone from
  persistence and Read.
- **`trading_name` / `legal_form`** — same amendment.
- **`business_profile_reviews.position`** — ranking moved to
  `business_profile_review_rankings` (ADR 4, 2026-09-02).
- **`vat_registration_status` write-only** — on Read and PATCH dirty
  keys. Onboarding client interview writes the same columns
  (`ClientInterviewUpdate`).
- **`top_reviews_provisional`** — moved to the rankings table.
- **Review `published_at`** — ranking-job input. Only `language` has
  no reader (import metadata, or drop that one column).
