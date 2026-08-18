# 07 — Claim

The contractor pays on the **public preview** page. Clerk sign-in/up if needed, then Stripe
checkout. The tenant activates; the site stays a **draft** until they publish in the CMS
([ADR 12](../ADR.md)).

Stripe (via `stripe-go`) handles this checkout only. Amount is the activation price (OnCall:
EUR 4900). `checkout.session.completed` is accepted only after the SDK verifies the signature
(`webhook.ConstructEvent`) and the metadata matches (`preview_package_id`, authenticated user).
The raw payload is saved on `stripe_events`, the work is enqueued on
[River](../../../general-architecture/jobs.md), and the request returns. Activation can be
replayed safely and is never triggered by a browser success URL alone.

## What activation writes

1. Resolve or create the Clerk org → [tenant](../../other/auth/data-model.md)
   (`tenants.clerk_org_id`). Tenant name is the **business**; org name is the **person**.
2. `tenant_memberships` (`owner`) for the paying user.
3. Attach `onboarding_sessions.tenant_id` and `business_profiles.tenant_id`.
4. Provision the generated subdomain → `tenant_domains` (`type=subdomain`).
5. `tenants.status=active`. Session → `claimed`. Preview package → `claimed`.
6. Does **not** write `website_publications`. The draft from 04 (plus whatever 05 has already
   written) is what they edit. Claim does **not** wait for copy generation.

Expired preview (`expires_at` passed) cannot be claimed. Replaying the webhook does not activate
twice.

- **Persists** `preview_claims` (`clerk_subject`, `checkout_session_id`, `payment_state`,
  `amount`, `currency`, `activated_at`), `stripe_events`, `tenants`, `tenant_memberships`,
  `tenant_domains`.
