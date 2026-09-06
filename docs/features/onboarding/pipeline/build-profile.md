# Build the profile (concurrent persist)

Not a wait step. 01, 02, and 04a **append** [business profile](../../business-profile/details/persistence.md)
`business_profile_edits` (one increment per field or list item actually set —
never a full profile). 05 reads the live business profile as of
`accepted_edit_id` at client interview complete.

This file owns the **complete-gate keys**, the **status function**, and the
**conflict-merge rule**. 03 only renders found vs missing. 04a and complete
**link** here. No `checklist.md`. No `checklist_rows` table — derived
fill status.

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
- Persist `"no vat number"` or `"—"` in `vat_number` when they are not
  VAT-registered.
- Insert an ETL `business_profile_edits` increment without ≥1
  `business_profile_edit_sources` row.
- Write `registered_office` into `business_profile_service_areas` or the
  reverse.
- Use Maps listing address as a second legal address (it stays on
  `etl.google_maps_listings`).
- Upsert a fill-status row (there is no such table).
- Treat a second company pick as a conflict-merge. Scratch 01 re-inits
  the live profile then this pick’s increments only
  ([01](01-find-business.md)). An abandoned onboarding `enqueue_id` must
  not write the live business profile.

## Do — merge

`MergeProfileIncrement` appends one increment per field or list item
actually set.

Each writer `SELECT … FOR UPDATE` the profile row, inserts only its increments,
updates only those live profile columns. ETL increments also insert ≥1
`business_profile_edit_sources`. Client interview / Details insert no junction
rows.

- **Conflict:** two disagreeing values for the same complete-gate key → status
  `conflict`. That live profile column **is not updated** (keep previous value,
  or empty). Research must not `UPDATE` that column while `conflict`. A
  contractor edit writes the live business profile, sets `filled_by_user`, and
  sets `algorithm=human`. That is the only “contractor wins.”
- **`algorithm` / `schema_revision`:** ETL transform writes the current
  transform identity and the current schema revision. Client interview / Details
  write `algorithm=human`. Transform skips when both match and `force` is false.
  A bumped `schema_revision` extracts by default (empty new fields may fill). It
  never overwrites `human` ([ETL pipeline](../../etl/pipeline/README.md)).
- **Legal identity:** registry wins `legal_name`, `company_number`,
  `registered_office`, `incorporation_date` even if Maps/crawl
  disagree; not a contractor question when a registry source exists.
- **Accreditations:** trade registry wins the same way.
- **Anti-fabrication:** unverifiable fields stay empty and become a targeted
  question. Registry “not found” is recorded, not papered over.
- **VAT:** `vat_registration_status` marks whether they are VAT-registered.
  The VAT number is required **only if** that status is set; otherwise
  leave `vat_number` null. Never persist `"no vat number"` or `"—"`.
  Empty VAT is not a website publication blocker. Worker omit of the
  footer VAT line:
  [website variables](../../website/variables.md).

### Complete-gate keys

Stable keys. 03 groups them for display. ETL transform may fill; 04a fills
gaps.

| Key | Group | Column / list | 02 may fill | Complete |
| --- | --- | --- | --- | --- |
| `display_name` | who | `display_name` | Maps | required |
| `trade` | who | `trade` | crawl | required |
| `description` | who | `description` | crawl | optional |
| `founder` | who | founder columns | crawl | optional |
| `legal_name` | legal | `legal_name` | registry only | required if registry |
| `company_number` | legal | `company_number` | registry only | required if registry |
| `registered_office` | legal | `registered_office` | registry only | required if registry |
| `vat_registration_status` | legal | `vat_registration_status` | — | optional |
| `vat_number` | legal | `vat_number` | — | required if `vat_registration_status` is set |
| `contact_name` | contact | `contact_name` | — | required |
| `marketing_phone` | contact | `marketing_phone` | Maps | required |
| `marketing_email` | contact | `marketing_email` | crawl | required |
| `existing_site_url` | contact | `existing_site_url` | Maps / crawl | optional |
| `emergency_phone` | contact | `emergency_phone` | — | required |
| `opening_hours` | contact | `business_profile_opening_hours` | Maps | optional |
| `services` | work | `business_profile_services` | crawl | required |
| `service_areas` | work | `business_profile_service_areas` | crawl | required |
| `accreditations` | certifications | list / notes | trade registry | optional |
| `photos` | photos | media library | Maps / Facebook photos + ETL transform classification; owner upload | optional |
| `reviews` | reviews | `business_profile_reviews` | Maps; ETL transform writes review citations. Facebook page reviews are not an extract this slice. `reviews_ranking_for_display` orders the pool + pins **top reviews** | optional |
| `projects` | photos | `business_profile.projects` | Facebook / Instagram / website crawl / reviews usable as a Project; rank top 4 for client interview / 05 | optional |
| `facebook_profile_url` | reviews | `facebook_profile_url` | Facebook | optional |

Found photos are shown in the client interview. There is no `photos_choice`
question (`use_found` / `source_from_google` / `upload_later` / `use_neutral`).
Complete does not require photos. Empty work-photo website slots are website
[03 automatic website copy generation](../../website/pipeline/03-website-copy-generation.md)
`generate_image` (attach first; logo / face still must not generate). There is
no photos-fill River job. The no-photos complete warning is frontend-only
([frontend.md](../frontend.md)). Projects is optional (same as `reviews`).
Complete does not require Projects.

### Rank Projects (client interview / 05)

Among business research origin `business_profile.projects` that are still
`active` (not archived, not owner project drafts), order by **completeness**:

1. Has a cover (`cover_media_asset_id` set) before those without.
2. Then longer text: `len(description) + len(title)`.
3. Tie-break: newer `created_at`.

**Top 4** are what 04a Text client interview shows, nested on
`OnboardingLiveBusinessProfileRead.projects` (GET profile, client interview PUT
/ complete, SSE `business_profile.profile`). Website 02 does **not** bake those
ids into gallery slots (`{{projects.*}}` stay). SSE may reshuffle as scrape
fills covers. `/cms/projects` lists all `active` extras. Client interview
Archive sets `algorithm=human` and `archived` — that row leaves the pool; the
next-complete `active` business research origin may appear. Later 02 / scheduled
inserts add Profile rows only; they do not add service pages or rewrite a copied
gallery token. The next website publication (04) resolves `{{projects.*}}` from
the live profile.

### Rank reviews (after ETL fast extract; again when ETL finishes)

Onboarding orchestration. After **ETL fast extract** has written `in_pool`
reviews, **inserts** River job kind `reviews_ranking_for_display` — typically
**in parallel** with client interview. That inserts a ranking batch
(`is_top` / `top_position`, `provisional=true`) while overlapping ETL
is still running. Those pins are not locked: a later ranking job may
replace them. They are not `algorithm=human`. `provisional` is not a
skip key.

When the last overlapping ETL run for this onboarding enqueue finishes:
**inserts** again if additional `in_pool` rows landed (replace pins,
`provisional=false`). If no additional rows, insert a copy of the
latest batch with `provisional=false` — no second generate.

**Scheduled ETL** (Monday / Wednesday / Friday): after a scheduled run
**succeeds** and new `in_pool` rows landed, **inserts** the same job
**once** (not per chunk). Writes `provisional=false`. One replace of
pins.

ETL transform inserts review rows only; it does not rank. Profile does
not enqueue. Website does not enqueue. Persist columns:
[certifications-and-reviews ADR](../../business-profile/certifications-and-reviews/ADR.md).
Job, `thread_kind`, `prompt_id`, I/O:
[jobs](../../../general-architecture/jobs.md),
[AI layer](../../../general-architecture/ai-layer.md).
`{{reviews.1}}` … resolve from that order. This is not
`website_reviews_picker` when copying the website template’s pages.

### Status function (one winner)

`in_progress` (in-flight ETL run for that key) → `conflict` →
`filled_by_user` → `filled_by_research` → `skipped` /
`not_applicable` → else `empty`.

Derived from the live business profile + winning edit origin + in-flight
`etl.runs` + interview-only choices.

### Complete gate

Required keys not `empty` / `in_progress` / `conflict`. `skipped` /
`not_applicable` allowed. 04a applies this. Skip 03 does not change it.

## Persist

`business_profiles` (live) + `business_profile_edits` +
`business_profile_edit_sources` (ETL increments only) +
`business_profile_services` / `business_profile_service_areas` /
`business_profile_opening_hours` / `business_profile_reviews` /
`business_profile_review_rankings` /
`facebook_profiles` / `facebook_posts` / `instagram_profiles` /
`instagram_posts` / `business_profile.projects` /
`business_profile.project_sources` (ETL Projects only). `last_edit_id` is the
latest applied edit. 05 sets `accepted_edit_id` at complete.

## Fail

Writer error: that increment is not applied; other writers unaffected. Conflict
stays until the contractor acts.

## Out

SSE fill-status projection. 05 reads `accepted_edit_id`. Later ETL transform
writes after complete are new edits after that id; they must not mutate the
accepted live business profile in place.

## Invariants

- No silent overwrite.
- No checklist table.
- Registry legal identity never overwritten by Maps/crawl.
- 05 never reads the conflict UI.
