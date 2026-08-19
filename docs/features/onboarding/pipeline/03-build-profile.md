# 03 — Build the profile (continuous merge)

Not a wait step. Every registry select, Maps attach, business research row, and client interview
detail **appends** [business profile](../../other/details/data-model.md) `business_profile_edits`
rows (one increment per field or list item actually set — never a full profile). Applying the
website template (04) reads the fold as of `accepted_edit_id` at client interview complete.

Each field carries its value, status, where it came from, and confidence.

- **Merge rules**: contractor answers win over business research (unless marked uncertain). Official
  registry wins for legal identity (`legal_name`, `company_number`, `registered_office`,
  `company_status`, `incorporation_date`) — Google / crawl never overwrite those once a registry
  source exists. Trade registry wins for accreditations. Conflicts become checklist questions,
  never silent overwrites.
- **Anti-fabrication**: a value is only ever filled from a source (registry, Maps, crawl,
  business research, or the contractor). Unverifiable fields stay empty and become a targeted question.
  A registry "not found" is recorded, not papered over.
- **Legal identity vs where they work**: `registered_office` is the legal address.
  `business_profile_service_areas` is operating geography. Business research never writes one into the
  other. The Maps listing address stays on `google_maps_listings`, not as a second legal address.
- **VAT conditional**: `vat_registration_status` marks whether they are VAT-registered; the VAT
  number is required (and later website publication may block) only when that status is set.
- **Concurrency**: interview and research run at the same time. Each writer `SELECT … FOR UPDATE`
  the profile row, inserts only its increments, and updates only those fold columns. Do not read
  the whole profile, merge in memory, and write it back.

- **Persists** `business_profiles` (the fold) + `business_profile_edits` + `business_profile_services`
  / `_service_areas` / `_opening_hours` / `_reviews`. `last_edit_id` is the latest applied edit.
