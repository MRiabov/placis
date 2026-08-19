# 02b — Review + client interview (integration test)

- **Setup**: an onboarding session with some checklist rows already `filled_by_source`.
- **Invoke**: read the checklist (review); save a text-interview autosave (`PUT .../text-interview/draft`);
  submit the final text client interview; also exercise voice tool calls (`obtained_information` /
  `confirm_conflict`) on a second onboarding session.
- **Assert**: checklist statuses (`filled_by_source` vs `filled_by_user` vs `empty` vs
  `conflict`); autosave then final `client_interview_submissions`; an invalid voice tool call is
  rejected; accepted details merge into a new `business_profile_history` row; conflicts surface,
  not silent overwrites; `interview/complete` moves the onboarding session to
  `applying_website_template`.
- **Mocked**: the voice agent (returns fixed tool-call proposals).
