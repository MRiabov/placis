# 03 — Build the profile (integration test)

- **Setup**: business research sources + client interview submissions present.
- **Invoke**: ingest each source as it arrives (not a single batch after client interview).
- **Assert**: `business_profiles` (fold) + `business_profile_edits` (one increment per field/list
  item set, not a full-profile dump) + services/areas/hours; contractor answer beats business
  research; registry beats Maps for legal identity; a conflict is surfaced, not silently resolved;
  registered office is not copied into service areas; `last_edit_id` is the latest applied edit.
  Concurrent interview + research increments on different fields both persist. See
  [details/data-model.md](../../../other/details/data-model.md).
- **Mocked**: nothing.
