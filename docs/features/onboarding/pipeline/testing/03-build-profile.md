# 03 — Build the profile (integration test)

- **Setup**: research sources + interview submissions present.
- **Invoke**: build the profile.
- **Assert**: `business_profiles` + `business_profile_versions` (`details` with `source_refs` +
  `created_by`) + services/areas/hours written; `current_version_id` points at the version; a
  conflict between research and interview is surfaced, not silently resolved.
- **Mocked**: nothing.
