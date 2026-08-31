# 02 — Copy website template pages (integration test)

Writes the unpublished website. Next step is 03, enqueued as a River job
on this `tenant_id`.

- **Setup**: 01 already wrote `website_settings`
  (`website_template_id` + `preset_id`) and the picker
  `ai_generations` row. `business_profiles.accepted_edit_id` set. At
  least two named services on that accepted profile. Preferred real
  photos exist in the media library when the fixture has them. Zero
  `website_pages`. No River 06 job yet.
- **Invoke**: copy the website template’s pages onto the unpublished
  website (real write). Then, in a second case, insert a later ETL named
  service after this write (do not re-run 02).
- **Assert** (Postgres after 02, **before** 03 runs):
  - `website_pages`: `tenant_id` = the unactivated tenant from 01;
    `status=unpublished`; one `page_type=home`, one `contact`, one
    `legal`, and one `service` page per named service on the accepted
    profile (not per later ETL). Unique `(tenant_id, path)`.
  - `website_sections`: every page has sections;
    `origin=website_template`; exactly two `page_id` null look sections
    (top-menu look, footer look). No extra look rows.
  - `website_slots`: `origin=website_template`; `status` is not
    `approved`. `value` jsonb still contains website placeholders
    (`{{business_name}}`, `{{marketing_phone}}`, `{{reviews.1}}`,
    `{{projects.featured}}` / `{{projects.*}}` as the template uses). Go
    did not rewrite those tokens into profile strings. Image slots are
    a token or a media asset id — not an invented URL.
  - `website.menus`: one row, `tenant_id` unique. `top_menu` and
    `footer` page nodes equal that page set. Legal is not on
    `top_menu`; legal is on `footer` (under cap). Trees are not a
    catalog menu JSON blob. Bar CTA values stay
    `{{marketing_phone}}` / `{{marketing_email}}`.
  - `website_forms` / `website_form_fields`: present iff the catalog
    template has them; `tenant_id` matches.
  - `website_settings` unchanged from 01 (`website_template_id`,
    `preset_id`).
  - **Must not**: zero `website_slot_reviews`. Zero
    `website_publications`. Zero `website_publication_issues`. No slot
    `origin=website_copy_generation` yet. No `edit_history` batch from
    this apply.
  - Same pick + same accepted profile, second tenant (or replay on a
    clean tenant): same `website_pages` paths / `page_type` set and the
    same derived `website.menus` trees.
  - Later ETL named service: `website_pages` where `page_type=service`
    count **unchanged**.
- **Handoff to 03**: schema `jobs` has one River job for onboarding 06 / website
  03; unique key = that `tenant_id`; job is available / running, not cancelled.
  `onboarding_sessions.status` still `selecting_and_copying_website_template`.
  03 Pre can load unpublished pages for that tenant.
- **Fail**: website-component contract fail during copy →
  `onboarding_sessions.status=select_and_copy_website_template_failed`; this
  apply’s unpublished pages / sections / slots / menus are not kept
  (transaction); `website_settings` pick from 01 may remain; **no**
  River 06 job; no `website_publications`; `tenants.website_prefix`
  still null.
- **Mocked**: nothing for the write (01 LLM already faked).
