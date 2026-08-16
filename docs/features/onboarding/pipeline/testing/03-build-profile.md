# 03 — Build the profile (integration test)

- **Setup**: research sources + interview submissions present.
- **Invoke**: run source ingestion + merge.
- **Assert**: `business_profiles` + `business_profile_versions` (append-only `details` with
  `source_refs` + `created_by`) + services/areas/hours; merge rules hold (contractor answer beats
  research, registry beats directory for legal identity); a conflict is surfaced, not silently
  resolved; `current_version_id` points at the latest version.
- **Mocked**: nothing.
