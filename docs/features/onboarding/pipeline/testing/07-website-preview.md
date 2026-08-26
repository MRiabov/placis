# 07 — Website preview (integration test)

- **Setup**: an unpublished website from 05. Wait gate: copy generation finished **or** the wait
  cap elapsed. Do **not** require 06 to have finished if the cap hit first.
- **Invoke**: run 07 (reserve `website_prefix` from `display_name`, write website publication v1).
- **Assert**: `tenants.website_prefix` set; `website_addresses` (`type=subdomain`);
  `website_publications` v1 (`published_by=onboarding`, strip on, `active`); R2 `latest/` objects;
  onboarding session `previewing`; no `website_previews` / `token_hash`; GET of the host HTML
  includes the website-activation island; 05 retry keeps the same `website_prefix` and writes a
  new onboarding publication (previous archived); 06 does not supersede; SSE apply-template/copy
  events live on the onboarding session stream — the host is not an SSE endpoint. Empty details
  show as website placeholders. Collision on `display_name` appends locality once, then
  sequential `-2`, `-3`.
- **Mocked**: nothing (R2 can be MinIO / fake keys).
