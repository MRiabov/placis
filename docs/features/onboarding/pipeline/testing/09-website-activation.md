# 09 — Website activation (integration test)

- **Setup**: unpublished website from 05; wait-end on
  `/onboarding/preview-and-edit/`. 08 share is **optional**. A Clerk
  testing-token contractor (Clerk organization may be missing). Automatic
  website copy generation may still be running, or may have failed — neither
  blocks website activation.
- **Invoke**: public checkout POST (app origin **or** CORS by `Host` /
  `website_prefix` if they shared); deliver `checkout.session.completed`
  (Stripe SDK signature against a test key); replay it; attempt a second payer
  after the first verified completion.
- **Assert**: `website_activations` written; `stripe_events` stored; the
  **existing** `tenants` row (same `tenant_id` as business lookup) now has
  `clerk_org_id` and `status=active`; `tenant_memberships` (`owner`); unpaid
  `ai.threads` `kind=cms_assistant` `current` completed and `running` ended in
  the same transaction; onboarding session `activated`; live R2 without the
  strip (first write if they never shared; archive strip v1 if they did); replay
  does not activate twice; second payer is refused; in-flight 06 continues as
  River-only (not cancelled, no new thread items); CMS assistant POSTs are not
  409 because 06 is running; `/onboarding/preview-and-edit/` redirects to
  `/cms/website`.
- **Mocked**: Stripe test mode (no real charge).
