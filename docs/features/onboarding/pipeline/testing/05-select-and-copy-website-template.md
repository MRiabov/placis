# 05 — Select and copy the website template (integration test)

Onboarding owns the DAG. Website 01 then 02 do the writes. This test
SELECTs both.

- **Setup**: 04a complete gate passed. `tenants`
  (`status=unactivated`). `onboarding_sessions`
  (`status=client_interviewing` until complete). Named services on the
  profile. Zero `websites` / `website_addresses` / `website_settings` /
  `website_pages` / `website_publications`. Production-ready website
  templates exist in the website template catalog.
- **Exercise**: `POST /v1/onboarding/interview/complete` (**inserts**
  `select_and_copy_website_template`). 01 is real
  occupancy + `website_id % len` (no LLM). 02 write is real.
  Also complete when the gate fails (required `conflict` /
  `in_progress`).
- **Verify** (Postgres, after `select_and_copy_website_template` succeeds,
  **before** website 03 / onboarding 06 runs):
  - `business_profile.business_profiles.accepted_edit_id` = `last_edit_id` at
    complete.
  - `onboarding_sessions.status=selecting_and_copying_website_template`
    (wait-end has not run yet).
  - `websites` row + `onboarding_sessions.website_id` set.
    `website_addresses` `type=subdomain` for
    `{website_prefix}.preview.placis.com`.
    `website_settings.website_template_id` in the production-ready set and
    `preset_id` = that website template’s associated website style catalog
    preset. **Must not**: `ai.threads` / `ai_generations` for this step
    (no `website_template_picker`).
  - Website 02 rows: unpublished `website_pages` (home, about, contact,
    legal, service website pages = named services, N ≥ 1);
    `website_sections` including two `page_id` null look sections;
    tokenized `website_slots` (image website slots still `{{images.*}}` /
    `{{logo_url}}`, no `media_asset_id`); derived `website.menus`; zero
    `website_slot_reviews`; zero `website_publications`.
  - **Handoff to 06**: schema `jobs` has one River job kind
    `website_copy_generation`,
    unique key = that `website_id`. No
    `website_slots.origin=website_copy_generation` yet.
  - All website rows use the unactivated `tenant_id` from 01 find.
  - Gate-fail complete: onboarding session stays `client_interviewing`;
    no 05 rows; `accepted_edit_id` unchanged.
- **Fail**: 01 or 02 throws →
  `onboarding_sessions.status=select_and_copy_website_template_failed`; no
  unpublished website kept from this copy; no `website_copy_generation`; no
  `website_publications`; `websites.website_prefix` already reserved.
- **Mocked**: nothing for 01/02 (no picker LLM). Maps / billing occupancy
  fixtures as website 01 testing when this tenant has coords.
