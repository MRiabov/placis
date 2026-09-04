# 01 — Select website template (integration test)

Does not write unpublished website pages. Next step is 02, which SELECTs
`website_settings` on this `website_id`.

- **Setup**: `tenants` (`status=unactivated`, `subscription_status=none`).
  `websites` row with `website_prefix` reserved. `onboarding_sessions`
  (`status=selecting_and_copying_website_template`, that `tenant_id`,
  `website_id`). `business_profile.business_profiles.accepted_edit_id` set
  (client interview complete). Named services already on that accepted profile.
  Zero `website_pages` / `website_sections` / `website_slots` / `website.menus`
  / `website_settings` / `website_publications`. Production-ready website
  templates exist (`production_ready=true`). WIP ids (`production_ready=false`)
  exist and must not be chosen.
- **Exercise**: website 01 in River job kind
  `select_and_copy_website_template` (no LLM). Cases below share that
  invoke.
- **Verify** (Postgres after 01, **before** 02 runs):
  - `website_settings`: one row, `website_id` = that website,
    `website_template_id` in the production-ready set, `preset_id` = that
    website template’s associated website style catalog preset.
    `edit_history_head` null.
  - **Must not**: `ai.threads` / `ai_generations` for this step (no
    `website_template_picker`). `website_pages`, `website_sections`,
    `website_slots`, `website.menus`, `website_forms`,
    `website_slot_reviews`, `website_publications`, `edit_history` all stay
    empty for that tenant. Schema `jobs`: no `website_copy_generation` yet.
    `onboarding_sessions.status` still
    `selecting_and_copying_website_template`. `websites.website_prefix`
    already set. `website_template_id` is never a `production_ready=false` id.
- **Cases**:
  - Two occupying tenants (`subscription_status=active`, coords 100 km
    apart) already hold distinct production-ready ids. This tenant with
    coords between them does not reuse either while an unused
    production-ready id remains (lowest count is 0).
  - Ten **unactivated** tenants in Dublin do not occupy; this tenant may
    still receive a production-ready id those unpaid rows used.
  - Occupying tenant `billing.subscriptions` (`status=canceled`, `canceled_at`
    **5 months** ago still occupies. Same setup at **7 months** does not occupy.
  - Coords 300 km from the only occupying tenant: may share that website
    template.
  - No Maps listing / no lat/lng on `google_maps_listings`: skip geo; pick is
    `sorted_production_ready[website_id % len]`.
  - Same `tenant_id` retry: same `website_settings` row, unchanged ids.
- **Handoff to 02**: 02 Pre can SELECT this `website_settings` row. No
  unpublished tree yet.
- **Fail**: production-ready catalog empty →
  `onboarding_sessions.status=select_and_copy_website_template_failed`; no
  `website_settings` row (or `website_template_id` null and 02 must not
  run); still zero unpublished website rows; still no
  `website_copy_generation`.
- **Mocked**: nothing (no LLM). Catalog sidecars are real.
