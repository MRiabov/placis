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

## Doc gap

- **5. `certification_definitions.registry_url`**
  Comment: on HTTP (`CertificationDefinitionRead`); nothing paints
  it.
  Action: badge links the registry, or drop column + DTO together.

- **6. Website variables with no backing column**
  Comment: `{{address}}` vs details ADR 8 (no business-location
  column). `{{projects.categories}}` has no source.
  Action: name the resolver or remove the token. Separate from
  website template catalog CI (website item 21).

- **9. `business_profile_services.website_page_path`**
  Comment: `BusinessProfileServiceOp` can carry it. 02 Copy website
  template pages does not say whether it backfills the column.
  Action: that pipeline step writes it, or drop.

- **10. `emergency_phone` vs Details screen**
  Comment: on Read/Update, client interview, and the complete gate.
  CMS Details field list omits a field its PATCH accepts.
  Action: add the field on Details, or say client-interview-only.

- **11. `list=projects` increments**
  Comment: ETL projects pipeline writes the increment. CMS
  `POST`/`PATCH /v1/projects` may not.
  Action: owner edits append an increment, or say ETL-only.

- **12. Linked-Facebook card vs `facebook_profiles` columns**
  Comment: details ADR 5 wants name / photo / rating / review count.
  Table has id/URL/handle/algorithm.
  Action: add columns or hydrate from the fetch row.

## Actually drop

- **11b. `business_profile_edits.list` = `facebook_posts` /
  `instagram_posts`**
  Comment: ETL upserts those tables; owner PATCH must not. No
  increment writer.
  Action: drop those list values (CHECK swap later if needed).

## False alarms (closed)

- **Four `brand_*` columns** — details ADR 3 (2026-09-02); gone from
  persistence and Read.
- **`trading_name` / `legal_form`** — same amendment.
- **`business_profile_reviews.position`** — ranking moved to
  `business_profile_review_rankings` (ADR 4, 2026-09-02).
- **`vat_registration_status` write-only** — on Read and PATCH dirty
  keys. Onboarding still needs a writer (onboarding item 4).
- **`top_reviews_provisional`** — moved to the rankings table.
- **Review `published_at`** — ranking-job input. Only `language` has
  no reader (import metadata, or drop that one column).
