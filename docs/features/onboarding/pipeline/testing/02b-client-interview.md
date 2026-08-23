# 02b — Review + client interview (integration test)

- **Setup**: an onboarding session with some checklist rows already `filled_by_research`.
- **Invoke**: read the checklist (review); save a text-interview autosave (`PUT .../text-interview/autosave`);
  submit the final text client interview; also exercise voice tool calls (`obtained_information` /
  `confirm_conflict`) on a second onboarding session.
- **Assert**: checklist statuses (`filled_by_research` vs `filled_by_user` vs `empty` vs
  `conflict`); autosave then final `client_interview_submissions` (`kind=autosave` then `kind=final`);
  an invalid voice tool call is rejected; accepted details append `business_profile_edits` (only
  fields the interview set);
  conflicts surface,
  not silent overwrites; `interview/complete` moves the onboarding session to
  `applying_website_template`; `update_interview_plan` persists
  `interview_plan_markdown` / `interview_plan_completed` / `interview_plan_next_questions` on the
  onboarding session; a second voice mint does not re-ask filled checklist rows.
- **Mocked**: the voice agent (returns fixed tool-call proposals).
