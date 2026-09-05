# 04a — Text client interview (integration test)

- **Setup**: 01 done (03 may have been skipped); 02 may still be running.
- **Exercise**: `PUT /v1/onboarding/interview`;
  `POST /v1/onboarding/interview/complete` (optional last dirty answers
  on the same body); also attempt complete with a required `conflict` /
  `empty` / `in_progress` key;
  `POST /v1/onboarding/projects/{projectId}/archive` on a client
  interview card.
- **Verify**: `client_interview_submissions`;
  `business_profile.business_profile_edits` for saved fields only;
  `channel=text`; complete rejected until the build-profile gate; skip 03 does
  not relax the gate; marking a required key `skipped` then complete succeeds;
  complete sets `accepted_edit_id` and **inserts**
  `select_and_copy_website_template`; no second tenant; services and service
  areas are list rows (not a textarea); no LLM combine of services after
  complete. Complete succeeds with zero photos (photos optional; no
  `photos_fill`). Zero `active` business research origin Projects → no Projects
  block. Archive sets `archived` + `algorithm=human`; next-ranked `active` may
  appear. No Clerk `/v1/projects/{id}/archive`. While 02 is still running: an
  empty marketing-phone column fills when Details transform lands; a marketing
  phone the contractor already saved is unchanged; scrape reviews and Projects
  persist without a second complete. VAT: `ClientInterviewUpdate` writes
  `vat_registration_status` / `vat_number`; not-registered complete
  leaves `vat_number` null; registered without a number is rejected.
- **Fail**: invalid complete keeps `client_interviewing`.
- **Mocked**: none required for text path.
