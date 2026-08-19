# 03 — Build the profile (continuous merge)

Not a wait step. Every registry select, Maps attach, business research slot, and client interview
detail **appends** a [business profile](../../other/details/data-model.md)
`business_profile_versions` row as it arrives. Applying the website template (04) reads
`current_version_id` at
client interview complete.

Each field carries its value, status, source refs, and confidence.

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
  other. The Maps listing address stays on the Google profile, not as a second legal address.
- **VAT conditional**: `vat_registration_status` marks whether they are VAT-registered; the VAT
  number is required (and later website publication may block) only when that status is set.

- **Persists** `business_profiles` + `business_profile_versions` (append-only: `details`,
  `source_refs`, `created_by`) + `business_profile_services` / `_service_areas` / `_opening_hours`.
  `current_version_id` always points at the latest `business_profile_versions` row.
