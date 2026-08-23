# 07 — Website preview (integration test)

- **Setup**: an unpublished website from 05. Do **not** wait for website copy generation (06).
- **Invoke**: create the website preview; open it with the issued token.
- **Assert**: `website_previews` (`token_hash` stored, plaintext token returned once,
  `status=active`, no `expires_at`); `website_preview_events`; onboarding session
  `previewing`; GET with the token succeeds while 06 may still be running and still succeeds after
  14 days of wall time would have passed under the old clock; GET is 410 only when the token is
  unknown, superseded, or already activated; applying the website template again supersedes the
  first website preview; 06 does not supersede the website preview; SSE apply-template/copy events
  live on the onboarding session stream — this step does not require a separate website preview
  SSE. Empty details show as website placeholders.
- **Mocked**: nothing.
