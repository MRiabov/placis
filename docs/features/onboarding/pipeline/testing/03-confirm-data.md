# 03 — Review (integration test)

- **Setup**: 01 business lookup returned; 02 jobs still running (at least one `in_progress` checklist row).
- **Invoke**: open `/onboarding/review`; Continue immediately (skip); also linger and Continue
  after some SSE fills.
- **Assert**: screen renders before 02 jobs finish; Continue with empty / `in_progress` rows is
  allowed; skip and dwell are both valid; no extra `onboarding_sessions` row; no Review
  POST; 02 still running after skip; legal identity visible; no `interview/complete`.
- **Fail**: `GET .../profile` error keeps the token; no replacement `POST`.
- **Mocked**: none beyond 02 fakes already running.
