# 08 — Website activation (integration test)

- **Setup**: 07 has written `latest/` (strip on); a Clerk testing-token contractor (Clerk organization
  may be missing). Website copy generation may still be running, or may have failed —
  neither blocks website activation.
- **Invoke**: `POST .../activation/checkout`; deliver `checkout.session.completed` (Stripe SDK
  signature against a test key); replay it; attempt a second payer after the first verified
  completion.
- **Assert**: `website_activations` written; `stripe_events` stored; the **existing** `tenants` row
  (same `tenant_id` as confirm) now has `clerk_org_id` and `status=active`; `tenant_memberships`
  (`owner`); same `website_address` as 07; onboarding session `activated`;
  `website_publications` v2 without the strip, v1 archived; neither v1 nor v2 is returned by
  website rollback list; replay does not activate twice; second payer is refused; in-flight 06
  continues; host GET no longer includes the website-activation island.
- **Mocked**: Stripe test mode (no real charge).
