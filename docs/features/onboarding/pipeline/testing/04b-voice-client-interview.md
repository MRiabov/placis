# 04b — Voice client interview (integration test)

**Do not run as v1 E2E.** 04b is **out**. Keep this file as the writer-design
test; do not implement or schedule it this pass.

- **Setup**: 01 done; 03 skipped or dwelled; 02 may still be running.
- **Invoke**: create a realtime connection; tool calls (`obtained_information` /
  `mark_information_status` / `request_lookup` / `confirm_conflict` /
  `update_interview_plan` / `end_interview`); second realtime connection after
  disconnect; failure to create; `end_interview` with an open required
  `conflict`.
- **Assert**: realtime connection payload includes live business profile +
  checklist projection + extra notes + last plan; not a blank interview; no
  transcript replay; accepted tools append `business_profile_edits`;
  `channel=voice`; `end_interview` rejected until the same complete gate as 04a;
  second realtime connection does not re-ask filled rows; failure to create
  keeps the token and does not `POST` a new onboarding session; `end_interview`
  then `interview/complete` → 05.
- **Fail**: invalid tool call rejected; live business profile unchanged.
- **Mocked**: voice agent (returns fixed tool-call proposals).
