# 02b — Interview (integration test)

- **Setup**: an onboarding session with research results already filling some checklist rows.
- **Invoke**: submit interview answers for the gaps; exercise `obtained_information` /
  `mark_information_status` / `confirm_conflict` tool calls (faked agent).
- **Assert**: checklist rows show correct status (`filled_by_source` vs `filled_by_user` vs `empty`);
  an invalid tool call is rejected; accepted facts merge into a new `business_profile_versions`
  row; conflicts surface as questions, not silent overwrites.
- **Mocked**: the agent (returns fixed tool-call proposals).
