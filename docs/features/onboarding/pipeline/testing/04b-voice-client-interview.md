# 04b — Voice client interview (integration test)

- **Setup**: 01 done; 03 skipped or dwelled; 02 may still be running.
- **Invoke**: mint realtime connection; tool calls (`obtained_information` /
  `mark_information_status` / `request_lookup` / `confirm_conflict` / `update_interview_plan` /
  `end_interview`); second mint after disconnect; mint failure; `end_interview` with an open
  required `conflict`.
- **Assert**: mint payload includes fold + checklist projection + extra notes + last plan; not
  a blank interview; no transcript replay; accepted tools append `business_profile_edits`;
  `channel=voice`; `end_interview` rejected until the same complete gate as 04a; second mint does
  not re-ask filled rows; mint failure keeps the token and does not `POST` a new onboarding session; `end_interview` then `interview/complete` → 05.
- **Fail**: invalid tool call rejected; fold unchanged.
- **Mocked**: voice agent (returns fixed tool-call proposals).
