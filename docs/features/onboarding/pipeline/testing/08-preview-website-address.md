# 08 — Preview website address (integration test)

- **Setup**: an unpublished website from 05. Wait-end already navigated to
  `/onboarding/preview-and-edit/` (copy done or cap). Do **not** require 06 to
  have finished.
- **Invoke**: `POST /v1/onboarding-sessions/{id}/preview-website-address`.
- **Assert**: `tenants.website_prefix` set; `website_addresses`
  (`type=subdomain`); `website_publications` (`published_by=onboarding`, strip
  on, `active`); R2 `latest/` objects; onboarding session `previewing`; no
  `website_previews` / `token_hash`; GET of the host HTML includes the
  website-activation island; 05 retry keeps the same `website_prefix` and writes
  a new onboarding publication (previous archived); 06 does not supersede; SSE
  apply-template/copy events live on the onboarding session stream — the host is
  not an SSE endpoint. Empty details show as website placeholders. Collision on
  `display_name` appends locality once, then sequential `-2`, `-3`. Wait-end
  does **not** invoke this write.
- **Mocked**: nothing (R2 can be MinIO / fake keys).
