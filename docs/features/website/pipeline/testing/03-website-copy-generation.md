# 03 — Automatic website copy generation (integration test)

Writes copy into **existing** unpublished website slots. Does not hand
off a publication row. Wait-end is onboarding session `preview_and_edit`. 04
is a later caller.

- **Setup**: 02 rows exist (`website_pages` / `website_sections` /
  `website_slots` `origin=website_template`; derived `website.menus`; look
  sections). Image website slots are still `{{images.*}}` / `{{logo_url}}`
  (no `media_asset_id` from 02). Schema `jobs`: one
  `website_copy_generation` on this `tenant_id`.
  `onboarding_sessions.status=selecting_and_copying_website_template`.
  `business_profiles.accepted_edit_id` set. At least two named services
  (roof repairs and gutter cleaning). Record website page ids, website
  slot ids, and tokenized `website_slots.value` before invoke. Two cases
  for photo selection: (a) unused non-founder/non-logo photos whose
  **media caption** matches those named services; (b) no matching media
  caption in that pool (founder / logo photos only, or a media caption
  that does not match).
- **Invoke**: run that River job. Fake the website-editor-tool LLM to a
  small `update_slot` / `update_seo` batch (no `create_page`, no
  `update_reviews`). In (a) also `update_slot` + `media_asset_id` attach
  of the matching photos. In (b) also `generate_image` for a service
  image website slot. Real Worker (`websiteRender`). Also: start a second
  03; also: run 09 (activate) while the job is in flight; also: wait-end
  (home website page copy done or wait cap) without 08/09.
- **Assert** (Postgres + Worker):
  - **Worker:** turn 1 asked **one** Worker `websiteRender` of the
    unpublished tree + `WebsiteBusinessProfileRead` (tokens still in
    `pages`). After each `update_slot`, another `websiteRender` of the
    affected website page (`before_pages` + `pages`). Those website image
    renders are **not** in `website_slots.value`. Zero R2 / WebP / purge
    from this job. 03 did not call `websitePublication`.
  - **Website slots / website pages:** targeted `website_slots.value`
    changed; `origin=website_copy_generation` on those rows only.
    Untargeted website slots still `origin=website_template`. Reusable
    `{{…}}` detail tokens still in prose `value`. No website slot
    `status=approved`. SEO columns on targeted `website_pages`
    updated. Website page **count** and website page **ids** unchanged
    (no `create_page`). `website.menus` trees unchanged. Look sections
    (`page_id` null) unchanged.
  - `website_slot_reviews`: still zero.
  - `ai.threads`: `thread_kind=website_copy_generation` for that
    tenant; `ai_generations` on it with `prompt_id=website_copy_generation`,
    `input`, `internal_reasoning`,
    `output`, `tool_calls` all present (`status=succeeded` for the
    batch). `tool_calls` includes `update_slot` / `update_seo` and does
    **not** include `create_page` or `update_reviews`. (a) roof-repairs
    vs gutter-cleaning image website slots got the matching unused
    non-founder/non-logo photos (not each other’s, not founder/logo);
    no reuse. (b) `tool_calls` includes `generate_image`; a new media
    library item `supplied_by=ai` pending review is attached — not a
    leftover unmatched photo. Logo image website slots stay
    `{{logo_url}}` (no `generate_image`).
  - While unactivated: `ai.threads` `thread_kind=cms_assistant`
    `status=current`; `assistant.runs` one `running` on that thread
    (`unique` running); `assistant.thread_items` `tool_summary` for
    applied tools.
  - `onboarding_sessions.status=preview_and_edit` at wait-end (home
    website page copy done or wait cap), not at 08 share.
  - **Must not:** zero `website_publications`. `tenants.website_prefix`
    still null if 08 never ran. Second 03 start is **409** from River
    unique-insert; still one `website_copy_generation` row for that
    `tenant_id`.
  - After 09 while in flight: `assistant.runs` has no `running` on CMS
    `cms_assistant`; leftover job still in schema `jobs` on the same
    `tenant_id` (not deleted, not cancelled). Further 03 website slot
    writes may land; they do **not** insert `website_publications` and
    do **not** rewrite R2. CMS PATCH / assistant HTTP are not 409
    because this job is running.
- **Handoff to 04**: none from this job. 08/09/CMS Publish SELECTs the
  unpublished tree (tokens + 03 copy) when they call 04. After wait-end
  the onboarding session is `preview_and_edit` so 07/08 may run.
- **Fail**: fake the LLM to throw → unpublished 02 rows kept (website slot
  `origin` still `website_template` where 03 never applied);
  `ai_generations.status=failed` with `error`; onboarding session still
  `selecting_and_copying_website_template` or `preview_and_edit` if wait-end
  already happened; still zero `website_publications`; 09 still allowed (no
  activation blocker row).
- **Mocked**: copy-generation LLM (including `generate_image` in (b)).
  Not the Worker. R2 / `purge_cache` unused (03 must not call them).
