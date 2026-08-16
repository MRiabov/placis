# 02b — Interview (integration test)

- **Setup**: an onboarding session with research results already present (found rows).
- **Invoke**: submit interview answers for the gaps.
- **Assert**: `text_interview_submissions` rows (versioned); known fields are prefilled and locked,
  only the gaps are answerable.
- **Mocked**: nothing (pure persistence).
