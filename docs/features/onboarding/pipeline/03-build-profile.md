# 03 — Build the profile (source ingestion + merge)

Every source — registry, Maps, crawl, research, interview — normalizes into one typed profile
through the source-ingestion step: each field carries its value, status, source refs, and
confidence.

- **Merge rules**: contractor answers win over research (unless marked uncertain); official registry
  wins for legal identity; trade registry wins for accreditations; conflicts become targeted
  questions, never silent overwrites.

- **Persists** `business_profiles` + `business_profile_versions` (append-only: `details`,
  `source_refs`, `created_by`) + `business_profile_services` / `_service_areas` / `_opening_hours`.
