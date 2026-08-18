# 02b — Review + interview (integration test)

- **Setup**: an onboarding session with some checklist rows already `filled_by_source`.
- **Invoke**: read the checklist (review); save a text-interview draft; submit the final text
  interview; also exercise voice tool calls (`obtained_information` / `confirm_conflict`) on a
  second session.
- **Assert**: checklist statuses (`filled_by_source` vs `filled_by_user` vs `empty` vs
  `conflict`); draft then final `text_interview_submissions`; an invalid voice tool call is
  rejected; accepted facts merge into a new `business_profile_versions` row; conflicts surface,
  not silent overwrites; `interview/complete` moves the session to `generating`.
- **Mocked**: the voice agent (returns fixed tool-call proposals).
