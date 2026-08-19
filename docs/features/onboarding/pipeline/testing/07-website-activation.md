# 07 — Claim (integration test)

- **Setup**: an active preview package; a Clerk testing-token user (org may be missing). Copy
  generation may still be running, or may have failed — neither blocks claim.
- **Invoke**: `POST .../claim/checkout`; deliver `checkout.session.completed` (Stripe SDK
  signature against a test key); replay it; attempt claim on an expired package.
- **Assert**: `preview_claims` written; `stripe_events` stored; `tenants` (`clerk_org_id`,
  `status=active`) + `tenant_memberships` (`owner`) + `tenant_domains` (`subdomain`); session
  `claimed` and package `claimed`; profile and session `tenant_id` set; **no**
  `website_publications`; replay does not activate twice; expired package cannot be claimed.
- **Mocked**: Stripe test mode (no real charge).
