# 02 — Copy website template pages (integration test)

Writes the unpublished website. Next step is 03: 02 **inserts** River job
kind `website_copy_generation` on this `tenant_id`. Mapping:
[catalog.md](../../catalog.md).

- **Setup**: 01 already wrote `website_settings`. No picker
  `ai_generations` row. `business_profiles` (`accepted_edit_id` set). At
  least two named services on that accepted profile. Media library photos
  may exist; 02 does not attach them. Zero `website_pages`. No
  `website_copy_generation` yet.
- **Exercise**: copy the website template’s pages onto the unpublished
  website (real write). Then, in a second case, insert a later ETL named
  service after this write (do not re-run 02).
- **Verify** (Postgres after 02, **before** 03 runs):
  - `website_pages`: `tenant_id` = the unactivated tenant from 01;
    `status=unpublished`; one `page_type=home`, one `about`, one
    `contact`, one `legal` (privacy policy), and one `service` page per
    named service on the accepted profile (not per later ETL). Same
    layout on every service page. Unique `(tenant_id, path)`. No gallery /
    services-index / testimonials / careers rows.
  - `website_sections`: every page has sections;
    `origin=website_template`; exactly two `page_id` null look sections
    (top-menu look, footer look) from the website template. No extra look
    rows.
  - `website_slots`: `origin=website_template`; `status` is not
    `approved`. `value` jsonb still contains website placeholders
    (`{{business_name}}`, `{{marketing_phone}}`, `{{reviews.1}}`,
    `{{projects.featured}}` / `{{projects.*}}` as the template uses). Go
    did not rewrite those tokens into profile strings. Image website slots
    are `slot_type=image` and still `{{images.*}}` / `{{logo_url}}` — no
    `media_asset_id` from this copy, not an invented URL.
  - `website.menus`: one row, `tenant_id` unique. Top menu top-level:
    Home, Services (text heading + service page children in accepted
    profile list order), About, Contact. Footer top-level: Home, About,
    Services (same children), Contact, Legal (text heading) + privacy
    policy child. Legal is not on `top_menu`. `show_phone=true`,
    `show_email=false`, `show_contact=true`. Trees are not a catalog menu
    JSON. Bar CTA values stay `{{marketing_phone}}` /
    `{{marketing_email}}`.
  - `website_forms` / `website_form_fields` / `website_form_field_options`:
    present iff the website template has form website sections; `form_key`
    matches the catalog form key; `tenant_id` matches.
  - `website_urls`: present iff the template menus have `url` nodes.
  - `website_settings` unchanged from 01 (`website_template_id`,
    `preset_id`).
  - **Must not**: zero `website_slot_reviews`. Zero
    `website_publications`. Zero `website_publication_issues`. No slot
    `origin=website_copy_generation` yet. No `edit_history` batch from
    this copy. No `ai.threads` / `ai_generations` for 01/02.
  - Same pick + same accepted profile, second tenant (or replay on a
    clean tenant): same `website_pages` paths / `page_type` set and the
    same derived `website.menus` trees.
  - Later ETL named service: `website_pages` where `page_type=service`
    count **unchanged**.
- **Handoff to 03**: schema `jobs` has one `website_copy_generation`;
  unique key = that `tenant_id`; job is available / running, not cancelled.
  `onboarding_sessions.status` still `selecting_and_copying_website_template`.
  03 Pre can load unpublished pages for that tenant.
- **Fail**: website-component contract fail during copy, or zero named
  services on the accepted profile →
  `onboarding_sessions.status=select_and_copy_website_template_failed`; this
  copy’s unpublished pages / sections / slots / menus are not kept
  (transaction); `website_settings` pick from 01 may remain; **no**
  `website_copy_generation`; no `website_publications`; `tenants.website_prefix`
  still null.
- **Mocked**: nothing for the write (01 pick already on `website_settings`).
