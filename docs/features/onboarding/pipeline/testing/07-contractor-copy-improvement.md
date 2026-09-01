# 07 — Contractor copy improvement (integration test)

- **Setup**: unpublished website from 05. Wait-end already navigated to
  `/onboarding/preview-and-edit/` (home website page copy done or wait
  cap). 06 may still be running.
  Clerk testing-token contractor (or unsigned hydrate only).
- **Invoke**: `GET /v1/onboarding/website/assistant/thread` (onboarding
  session token). After 06 idle, signed-in Send (or Voice) that PATCHes
  `PATCH /v1/onboarding/website/editor/pages/{page_id}`. Also Send while 06 is
  `running`. Also a sixth owner prompt.
- **Assert**: hydrate returns 06 `tool_summary` without Clerk. Send while 06
  `running` is **409** `in_flight_run`. After idle, one owner prompt applies
  (unpublished PATCH; Follow). Sixth prompt is **409** `unpaid_prompt_cap`, not
  402. Onboarding session stays `preview_and_edit`. No `website_publications`
  from
  this step. Onboarding session token cannot PATCH / Send / Voice. CMS
  `/v1/assistant/…` stays **403** `tenant_unactivated`. 09 still allowed
  without more prompts.
- **Mocked**: the Assistant LLM (website editor tools faked to a small
  `update_slot` batch).

Named tables: `assistant.runs`, `assistant.thread_items`.
