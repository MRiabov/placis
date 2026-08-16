# 02b — Interview (review the checklist, then fill gaps)

The **checklist** is the review surface. Each field shows its status — `filled_by_source`,
`filled_by_user`, `empty`, `in_progress`, `needs_confirmation`, `conflict`, `skipped`,
`not_applicable` — plus where it came from. The contractor sees "here's what we already have",
confirms or corrects, and answers only the gaps.

- Tool calls (`obtained_information`, `mark_information_status`, `request_lookup`,
  `confirm_conflict`) are validated on input and write profile events; accepted facts merge into the
  next profile version.

- **Persists** `text_interview_submissions` (`version`, `payload` jsonb) and profile-version deltas.
