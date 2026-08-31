# Build the profile (concurrent persist)

Not a wait step. 01, 02, 04a, and 04b **append** [business profile](../../business-profile/details/persistence.md)
`business_profile_edits` (one increment per field or list item actually set —
never a full profile). 05 reads the live business profile as of
`accepted_edit_id` at client interview complete.

This file owns the **closed checklist**, the **status function**, and the
**conflict-merge rule**. 03 only renders the projection. 04a/04b and complete
**link** here. No `checklist.md`. No `checklist_rows` table — derived
projection.

## Trigger

Every registry select, Maps attach, ETL transform write, and client interview
write.

## Pre

`business_profiles` row exists for the unactivated `tenant_id`.

## Must not

- Read the whole profile, merge in memory, and write it back.
- Silently overwrite a disagreeing value onto the live business profile.
- Overwrite a live profile field or list row whose winning `algorithm` is
  `human` (ETL, including `force=true`). A later override is a manual transform.
- Fabricate a value with no source (registry, Maps, crawl, business research, or
  the contractor).
- Insert an ETL `business_profile_edits` increment without ≥1
  `business_profile_edit_sources` row.
- Write `registered_office` into `business_profile_service_areas` or the
  reverse.
- Use Maps listing address as a second legal address (it stays on
  `etl.google_maps_listings`).
- Upsert a checklist row (there is no such table).

## Do — merge

Each writer `SELECT … FOR UPDATE` the profile row, inserts only its increments,
updates only those live profile columns. ETL increments also insert ≥1
`business_profile_edit_sources`. Client interview / Details /
`confirm_conflict` insert no junction rows.

- **Conflict:** two disagreeing values for the same checklist key → status
  `conflict`. That live profile column **is not updated** (keep previous value,
  or empty). Research must not `UPDATE` that column while `conflict`. Contractor
  `confirm_conflict` or a contractor edit writes the live business profile, sets
  `filled_by_user`, and sets `algorithm=human`. That is the only “contractor
  wins.”
- **`algorithm` / `schema_revision`:** ETL transform writes the current
  transform identity and the current schema revision. Client interview / Details
  / `confirm_conflict` write `algorithm=human`. Transform skips when both match
  and `force` is false. A bumped `schema_revision` extracts by default (empty
  new fields may fill). It never overwrites `human` ([ETL pipeline](../../etl/pipeline/README.md)).
- **Legal identity:** registry wins `legal_name`, `company_number`,
  `registered_office`, `company_status`, `incorporation_date` even if Maps/crawl
  disagree; not a contractor question when a registry source exists.
- **Accreditations:** trade registry wins the same way.
- **Anti-fabrication:** unverifiable fields stay empty and become a targeted
  question. Registry “not found” is recorded, not papered over.
- **VAT:** `vat_registration_status` marks whether they are VAT-registered; the
  VAT number is required (and later website publication may block) only when
  that status is set.

## Checklist

Stable keys. 03 groups them for display. ETL transform may fill; 04a/04b fill
gaps.

| Key | Group | Column / list | 02 may fill | Complete |
| --- | --- | --- | --- | --- |
| `display_name` | who | `display_name` | Maps | required |
| `trade` | who | `trade` | crawl / directory | required |
| `description` | who | `description` | crawl | optional |
| `founder` | who | founder columns | directory | optional |
| `legal_name` | legal | `legal_name` | registry only | required if registry |
| `company_number` | legal | `company_number` | registry only | required if registry |
| `registered_office` | legal | `registered_office` | registry only | required if registry |
| `company_status` | legal | `company_status` | registry only | optional |
| `contact_name` | contact | `contact_name` | — | required |
| `marketing_phone` | contact | `marketing_phone` | Maps | required |
| `marketing_email` | contact | `marketing_email` | crawl | required |
| `existing_site_url` | contact | `existing_site_url` | Maps / crawl | optional |
| `emergency_phone` | contact | `emergency_phone` | — | required |
| `opening_hours` | contact | `business_profile_opening_hours` | Maps | optional |
| `services` | work | `business_profile_services` | crawl | required |
| `service_areas` | work | `business_profile_service_areas` | crawl / directory | required |
| `accreditations` | certifications | list / notes | trade registry | optional |
| `photos` | photos | media library | Maps / Facebook photos + ETL transform classification; owner upload | required enough photos (found + uploaded). Source from the internet / AI photo only if still short |
| `reviews` | reviews | `business_profile_reviews` | Maps / Facebook / review job; ranking job orders the pool + pins **top reviews** | optional |
| `projects` | photos | `business_profile.projects` | Facebook / Instagram / website crawl / reviews usable as a Project; rank top 4 for client interview | optional |
| `facebook_profile_url` | reviews | `facebook_profile_url` | Facebook | optional |

Found photos are shown in the client interview. There is no `photos_choice`
question (`use_found` / `source_from_google` / `upload_later` / `use_neutral`).
Projects is optional (same as `reviews`). Complete does not require Projects.

## Rank Projects (client interview / 05)

Among business research origin `business_profile.projects` that are still
`active` (not archived, not owner project drafts), order by **completeness**:

1. Has a cover (`cover_media_asset_id` set) before those without.
2. Then longer text: `len(description) + len(title)`.
3. Tie-break: newer `created_at`.

**Top 4** are what 04a shows. Website 02 does **not** bake those ids into
gallery slots (`{{projects.*}}` stay). SSE may reshuffle as scrape fills
covers. `/cms/projects` lists all `active` extras. Client interview Archive
sets `algorithm=human` and `archived` — that row leaves the pool; the
next-complete `active` business research origin may appear. Later 02 /
scheduled inserts add Profile rows only; they do not add service pages or
rewrite a copied gallery token. The next website publication (04) resolves
`{{projects.*}}` from the live profile.

## Rank reviews (parallel to client interview; again when ETL finishes)

If `business_profile_reviews` already has rows during the client interview,
enqueue a ranking job (`thread_kind=website_reviews_ranking`) **in parallel**
with questioning. When the last overlapping ETL run for this onboarding enqueue
finishes, run it **again**: rank the pool and select **top reviews** (ads).
Spec: [certifications-and-reviews ADR](../../business-profile/certifications-and-reviews/ADR.md). `{{reviews.1}}` … resolve from that
order. This is not `website_reviews_picker` when copying the website template’s
pages.

## Status function (one winner)

`in_progress` (in-flight ETL run for that key) → `conflict` →
`needs_confirmation` → `filled_by_user` → `filled_by_research` → `skipped` /
`not_applicable` → else `empty`.

Derived from the live business profile + winning edit origin + in-flight
`etl.runs` + interview-only choices.

## Complete gate

Required keys not `empty` / `in_progress` / `conflict`. `skipped` /
`not_applicable` allowed. 04a and 04b apply this. Skip 03 does not change it.

## Persist

`business_profiles` (live) + `business_profile_edits` +
`business_profile_edit_sources` (ETL increments only) +
`business_profile_services` / `business_profile_service_areas` /
`business_profile_opening_hours` / `business_profile_reviews` /
`facebook_profiles` / `facebook_posts` / `instagram_profiles` /
`instagram_posts` / `business_profile.projects` /
`business_profile.project_sources` (ETL Projects only). `last_edit_id` is the
latest applied edit. 05 sets `accepted_edit_id` at complete.

## Fail

Writer error: that increment is not applied; other writers unaffected. Conflict
stays until the contractor acts.

## Out

SSE checklist projection. 05 reads `accepted_edit_id`. Later ETL transform
writes after complete are new edits after that id; they must not mutate the
accepted live business profile in place.

## Invariants

- No silent overwrite.
- No checklist table.
- Registry legal identity never overwritten by Maps/crawl.
- 05 never reads the conflict UI.
