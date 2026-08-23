# 07 — Website activation

The contractor pays on the **website preview**. Clerk sign-in/sign up if needed, then Stripe
checkout. The tenant activates; the site stays an **unpublished website** until website publication
in the CMS ([ADR 12](../ADR.md)).

Stripe (via `stripe-go`) handles this checkout only. Amount is the activation price (predecessor:
EUR 4900). `checkout.session.completed` is accepted only after the SDK verifies the signature
(`webhook.ConstructEvent`) and the metadata matches (`website_preview_id`, authenticated owner).
The raw payload is saved on `stripe_events`, the work is enqueued on
[River](../../../general-architecture/jobs.md), and the request returns. Activation can be
replayed safely and is never triggered by a browser success URL alone.

## What website activation writes

1. Resolve or create the Clerk organization → [tenant](../../other/auth/data-model.md)
   (`tenants.clerk_org_id`). Tenant name is the **business**; Clerk organization name is the
   **person**.
2. `tenant_memberships` (`owner`) for the paying owner.
3. Attach `onboarding_sessions.tenant_id` and `business_profiles.tenant_id`.
4. Provision the website address → `tenants.website_address` (unique label, **fixed**) and
   `website_addresses` (`type=subdomain`, hostname `{website_address}.placis.com`,
   `status=reserved`). Create the CNAME for that host on **our** `placis.com` zone. Do not show
   it in the CMS as the live website. Custom website address is a later CMS step
   ([Connect website address](../../website/cloudflare.md)).
5. `tenants.status=active`. Onboarding session → `activated`. Website preview → `activated`.
6. Does **not** write `website_publications`. The unpublished website from 04 (plus whatever 05
   has already written) is what they edit. Website activation does **not** wait for website copy
   generation.

Expired website preview (`expires_at` passed) cannot be activated. Replaying the webhook does not
activate twice.

- **Persists** `website_activations` (`clerk_subject`, `checkout_session_id`, `payment_status`,
  `amount`, `currency`, `activated_at`), `stripe_events`, `tenants`, `tenant_memberships`,
  `website_addresses`.
