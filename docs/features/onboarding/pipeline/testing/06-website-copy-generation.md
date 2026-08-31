# 06 — Automatic website copy generation (integration test)

Onboarding owns the lock, wait teaser, unpaid thread, and that this job
must not block 09. Website 03 does the website slot writes.

- **Setup**: 05 succeeded. Unpublished 02 rows exist. Schema `jobs`: the 06
  River job on this `tenant_id`. Onboarding session
  `selecting_and_copying_website_template`. Record website slot ids and
  tokenized `value`s.
- **Invoke**: run that River job (website 03). Also start a second 06;
  also activate (09) while the job is in flight; also wait-end (home
  website page copy done or wait cap) without share.
- **Assert** (Postgres):
  - `onboarding_sessions.status=preview_and_edit` at wait-end, not at 08
    share.
  - Targeted `website_slots`: `origin=website_copy_generation`,
    `value` still has reusable `{{…}}`, not `approved`. Website page
    count unchanged. Zero `website_slot_reviews`. Zero
    `website_publications`.
  - `ai.threads` `thread_kind=website_copy_generation`;
    `ai_generations` `input` / `internal_reasoning` / `output` /
    `tool_calls` present; `tool_calls` has no `create_page` or
    `update_reviews`.
  - While unactivated: `assistant.runs` one `running` on
    `ai.threads` `cms_assistant` `current`; unique running.
  - Second 06 start is 409 on the River unique key; still one job for
    that `tenant_id`.
  - After 09: leftover job still in schema `jobs` on that
    `tenant_id` (not cancelled); `assistant.runs` has no `running` on
    CMS; CMS PATCH / assistant HTTP are not 409 because 06 is running.
- **Fail**: fake the LLM to throw → 02 unpublished rows kept;
  onboarding session still `selecting_and_copying_website_template` or
  `preview_and_edit`; 09 still allowed.
- **Mocked**: as website 03 (copy-generation LLM; Worker internal
  website page render).
