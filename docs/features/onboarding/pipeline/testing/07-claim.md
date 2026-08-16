# 07 — Claim (integration test)

- **Setup**: a preview package.
- **Invoke**: deliver `checkout.session.completed` (Stripe SDK signature against a test key), then
  replay it.
- **Assert**: `preview_claims` written; `tenants` activated + `tenant_memberships` (`owner`); the
  site is **not** published (no `website_publications`); replaying the webhook does not activate
  twice.
- **Mocked**: Stripe test mode (no real charge).
