# 06 — Preview (integration test)

- **Setup**: a generated website draft (04). Do **not** wait for copy generation (05).
- **Invoke**: create the preview package; open it with the issued token; wait until `expires_at`.
- **Assert**: `preview_packages` (`token_hash` stored, plaintext token returned once,
  `personas`, `unresolved_fields`, `expires_at`, `status=active`); `preview_events`; session
  `previewing`; GET with the token succeeds while 05 may still be running; GET after expiry is
  410; a second generate supersedes the first package; 05 does not supersede the package; SSE
  generation/copy events live on the session stream — this step does not require a separate
  preview SSE.
- **Mocked**: nothing.
