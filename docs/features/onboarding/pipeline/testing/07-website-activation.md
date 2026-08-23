# 07 — Website activation (integration test)

- **Setup**: an active website preview; a Clerk testing-token contractor (Clerk organization may be
  missing). Website copy generation may still be running, or may have failed — neither blocks
  website activation.
- **Invoke**: `POST .../activation/checkout`; deliver `checkout.session.completed` (Stripe SDK)
  signature against a test key); replay it; attempt website activation on an expired website preview.
- **Assert**: `website_activations` written; `stripe_events` stored; the **existing** `tenants` row
  (same `tenant_id` as confirm) now has `clerk_org_id` and `status=active`; `tenant_memberships`
  (`owner`) + `website_addresses` (`type=subdomain`); onboarding session `activated` and website
  preview `activated`; no second tenant; **no** `website_publications`; replay does not activate
  twice; expired website preview cannot be activated.
- **Mocked**: Stripe test mode (no real charge).
