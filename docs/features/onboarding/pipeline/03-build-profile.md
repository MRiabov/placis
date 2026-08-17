# 03 — Build the profile (source ingestion + merge)

Every source — registry, Maps, crawl, research, interview — normalizes into one typed profile
through the source-ingestion step: each field carries its value, status, source refs, and
confidence.

- **Merge rules**: contractor answers win over research (unless marked uncertain); official registry
  wins for legal identity; trade registry wins for accreditations; conflicts become targeted
  questions, never silent overwrites.

- **Anti-fabrication**: a fact is only ever filled from a source (registry, Maps, crawl, research,
  or the contractor). There is no "guess" value — unverifiable fields stay empty and become a
  targeted question, never an invented default. Registry-derived legal facts are authoritative; a
  registry "not found" is recorded, not papered over.

- **Legal identity vs operating reality**: the registered office (legal address) and the operating
  / service address are distinct and stay distinct — research never writes one into the other.

- **VAT conditional**: `vat_registration_status` marks whether the business is VAT-registered; the
  VAT number is required (and publish blocks without it) only when that status is set, so we never
  demand a VAT number from a non-registered business.

- **Persists** `business_profiles` + `business_profile_versions` (append-only: `details`,
  `source_refs`, `created_by`) + `business_profile_services` / `_service_areas` / `_opening_hours`.
