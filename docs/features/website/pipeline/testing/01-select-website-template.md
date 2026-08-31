# 01 — Select website template (integration test)

Does not write unpublished website pages. Next step is 02, which SELECTs
`website_settings` on this tenant.

Picker implementation is **out until the stacked rewrite**
([01](../01-select-website-template.md),
[open questions](../../catalog.md#open-questions)). This file is the persist
oracle when that rewrite lands. Do not implement the LLM picker to satisfy
it on this branch.

- **Setup**: `tenants` (`status=unactivated`, `website_prefix` null).
  `onboarding_sessions` (`status=selecting_and_copying_website_template`, that
  `tenant_id`). `business_profiles.accepted_edit_id` set (client
  interview complete). Named services already on that accepted profile.
  Zero `website_pages` / `website_sections` / `website_slots` /
  `website.menus` / `website_settings` / `website_publications`.
- **Invoke**: website 01 in the 05 job (stacked rewrite). Persist a
  website template catalog id and `preset_id`.
- **Assert** (Postgres after 01, **before** 02 runs):
  - `website_settings`: one row, `tenant_id` = that tenant,
    `website_template_id` = the persisted website template catalog id,
    `preset_id` = the persisted styles. `edit_history_head` null.
  - **Must not**: `website_pages`, `website_sections`, `website_slots`,
    `website.menus`, `website_forms`, `website_slot_reviews`,
    `website_publications`, `edit_history` all still empty for that
    tenant. Schema `jobs`: no River job for 06 / website 03 yet.
    `onboarding_sessions.status` still `selecting_and_copying_website_template`.
    `tenants.website_prefix` still null.
- **Handoff to 02**: 02 Pre can SELECT that `website_settings` row. No
  unpublished tree yet.
- **Fail**: no website template catalog id to persist →
  `onboarding_sessions.status=select_and_copy_website_template_failed`; no
  `website_settings` row (or `website_template_id` null and 02 must not
  run); still zero unpublished website rows; still no River 06 job.
- **Mocked**: stacked-rewrite picker only. Do not add an LLM picker on
  this branch to make this test green.
