# 07 — Website activation (integration test)

- **Setup**: an active website preview; a Clerk testing-token user (Clerk organization may be
  missing). Website copy generation may still be running, or may have failed — neither blocks
  website activation.
- **Invoke**: `POST .../activation/checkout`; deliver `checkout.session.completed` (Stripe SDK)
  signature against a test key); replay it; attempt website activation on an expired website preview.
- **Assert**: `website_activations` written; `stripe_events` stored; `tenants` (`clerk_org_id`,
  `status=active`) + `tenant_memberships` (`owner`) + `tenant_domains` (`subdomain`); onboarding
  session `activated` and website preview `activated`; profile and onboarding session `tenant_id`
  set; **no** `website_publications`; replay does not activate twice; expired website preview cannot
  be activated.
- **Mocked**: Stripe test mode (no real charge).
