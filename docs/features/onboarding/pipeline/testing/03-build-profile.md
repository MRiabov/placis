# 03 — Build the profile (integration test)

- **Setup**: research sources + interview submissions present.
- **Invoke**: ingest each source as it arrives (not a single batch after interview).
- **Assert**: `business_profiles` + `business_profile_versions` (append-only `details` with
  `source_refs` + `created_by`) + services/areas/hours; contractor answer beats research;
  registry beats Maps for legal identity; a conflict is surfaced, not silently resolved;
  registered office is not copied into service areas; `current_version_id` points at the latest
  version. See [details/data-model.md](../../../other/details/data-model.md).
- **Mocked**: nothing.
