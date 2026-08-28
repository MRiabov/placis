# 04a — Text client interview (integration test)

- **Setup**: 01+03 done (03 may have been skipped); 02 may still be running.
- **Invoke**: `PUT .../text-interview/autosave`;
  `POST .../text-interview/submissions` `kind=final`;
  `POST .../interview/complete`; also attempt complete with a required
  `conflict` / `empty` / `in_progress` row.
- **Assert**: `client_interview_submissions`; `business_profile_edits` for saved
  fields only; `channel=text`; complete rejected until the build-profile gate;
  skip 03 does not relax the gate; marking a required row `skipped` then
  complete succeeds; complete sets `accepted_edit_id` and enqueues 05; no second
  tenant; services and service areas are list rows (not a textarea blob); no
  LLM combine of services after complete.
- **Fail**: invalid complete keeps `client_interviewing`.
- **Mocked**: none required for text path.
