# 05 — Select and copy the website template (integration test)

Onboarding owns the DAG. Website 01 then 02 do the writes. This test
SELECTs both.

- **Setup**: 04a/04b complete gate passed. `tenants`
  (`status=unactivated`). `onboarding_sessions`
  (`status=client_interviewing` until complete). Named services on the
  profile. Zero `website_settings` / `website_pages` /
  `website_publications`.
- **Invoke**: `POST .../interview/complete` (enqueues 05). Fake the
  picker LLM to a fixed website template catalog id + `preset_id`. 02
  write is real.
  Also complete when the gate fails (required `conflict` /
  `in_progress`).
- **Assert** (Postgres, after 05 job succeeds, **before** 03 runs):
  - `business_profiles.accepted_edit_id` = `last_edit_id` at complete.
  - `onboarding_sessions.status=selecting_and_copying_website_template`
    (wait-end has not run yet).
  - Website 01 rows: `website_settings.website_template_id` and
    `preset_id`; `ai.threads` `website_template_picker`;
    `ai_generations` `input` / `internal_reasoning` / `output`.
  - Website 02 rows: unpublished `website_pages` (home, about, contact,
    legal, service website pages = named services, N ≥ 1);
    `website_sections` including two `page_id` null look sections;
    tokenized `website_slots` (image website slots still `{{images.*}}` /
    `{{logo_url}}`, no `media_asset_id`); derived `website.menus`; zero
    `website_slot_reviews`; zero `website_publications`.
  - **Handoff to 06**: schema `jobs` has one `website_copy_generation`,
    unique key = that `tenant_id`. No
    `website_slots.origin=website_copy_generation` yet.
  - All website rows use the unactivated `tenant_id` from 01 find.
  - Gate-fail complete: onboarding session stays `client_interviewing`;
    no 05 rows; `accepted_edit_id` unchanged.
- **Fail**: 01 or 02 throws →
  `onboarding_sessions.status=select_and_copy_website_template_failed`; no
  unpublished website kept from this apply; no `website_copy_generation`; no
  `website_publications`; `tenants.website_prefix` still null.
- **Mocked**: the website template / website styles LLM.
