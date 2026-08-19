# 06 — Website preview (integration test)

- **Setup**: an unpublished website from 04. Do **not** wait for website copy generation (05).
- **Invoke**: create the website preview; open it with the issued token; wait until `expires_at`.
- **Assert**: `website_previews` (`token_hash` stored, plaintext token returned once,
  `expires_at`, `status=active`); `website_preview_events`; onboarding session
  `previewing`; GET with the token succeeds while 05 may still be running; GET after expiry is
  410; applying the website template again supersedes the first website preview; 05 does not
  supersede the website preview; SSE apply-template/copy events live on the onboarding session
  stream — this step does not require a separate website preview SSE. Empty details show as
  website placeholders.
- **Mocked**: nothing.
