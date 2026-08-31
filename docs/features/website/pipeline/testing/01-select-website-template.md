# 01 — Select website template (integration test)

Does not write unpublished website pages. Next step is 02, which SELECTs
`website_settings` on this tenant.

- **Setup**: `tenants` (`status=unactivated`, `website_prefix` null).
  `onboarding_sessions` (`status=selecting_and_copying_website_template`, that
  `tenant_id`). `business_profiles.accepted_edit_id` set (client
  interview complete). Named services already on that accepted profile.
  Zero `website_pages` / `website_sections` / `website_slots` /
  `website.menus` / `website_settings` / `website_publications`.
- **Invoke**: website 01 in the 05 job. Fake the picker LLM to a fixed
  website template catalog id and `preset_id`. Also invoke with the LLM
  throwing (heuristic fallback pointer still resolves).
- **Assert** (Postgres after 01, **before** 02 runs):
  - `website_settings`: one row, `tenant_id` = that tenant,
    `website_template_id` = the faked website template catalog id,
    `preset_id` = the faked styles. `edit_history_head` null.
  - `ai.threads`: one `thread_kind=website_template_picker` for that
    `tenant_id`.
  - `ai_generations`: at least one row on that thread; `input`,
    `internal_reasoning`, `output` present; `status=succeeded`;
    `tool_calls` empty or unused (one-shot pick, not website-editor
    tools).
  - Heuristic fallback invoke: same `website_settings` shape; a
    `status=failed` picker generation may exist; the pick is still the
    pointer, not a second website template catalog family.
  - **Must not**: `website_pages`, `website_sections`, `website_slots`,
    `website.menus`, `website_forms`, `website_slot_reviews`,
    `website_publications`, `edit_history` all still empty for that
    tenant. Schema `jobs`: no River job for 06 / website 03 yet.
    `onboarding_sessions.status` still `selecting_and_copying_website_template`.
    `tenants.website_prefix` still null.
- **Handoff to 02**: 02 Pre can SELECT that `website_settings` row. No
  unpublished tree yet.
- **Fail**: picker and heuristic both miss (no website template catalog
  id to persist) →
  `onboarding_sessions.status=select_and_copy_website_template_failed`; no
  `website_settings` row (or `website_template_id` null and 02 must not
  run); still zero unpublished website rows; still no River 06 job.
- **Mocked**: the website template / website styles LLM. Heuristic
  fallback is the existing pointer only.
