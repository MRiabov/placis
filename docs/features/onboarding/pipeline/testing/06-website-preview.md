# 06 — Website preview (integration test)

- **Setup**: a generated unpublished website (04). Do **not** wait for website copy generation (05).
- **Invoke**: create the website preview; open it with the issued token; wait until `expires_at`.
- **Assert**: `website_previews` (`token_hash` stored, plaintext token returned once,
  `personas`, `unresolved_fields`, `expires_at`, `status=active`); `website_preview_events`; onboarding session
  `previewing`; GET with the token succeeds while 05 may still be running; GET after expiry is
  410; a second generate supersedes the first website preview; 05 does not supersede the website
  preview; SSE generation/copy events live on the onboarding session stream — this step does not
  require a separate website preview SSE.
- **Mocked**: nothing.
