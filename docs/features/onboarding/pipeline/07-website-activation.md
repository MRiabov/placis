# 07 — Website activation

The contractor pays on the **website preview**. Clerk sign-in/sign up if needed, then Stripe
checkout. Website activation **upgrades** the existing unactivated tenant (`status=active`); it does
not insert a second tenant. The site stays an **unpublished website** until website publication
in the CMS ([ADR 12](../ADR.md)).

Stripe (via `stripe-go`) handles this checkout only. Amount is the activation price (predecessor:
EUR 4900). `checkout.session.completed` is accepted only after the SDK verifies the signature
(`webhook.ConstructEvent`) and the metadata matches (`website_preview_id`, authenticated owner).
The raw payload is saved on `stripe_events`, the work is enqueued on
[River](../../../general-architecture/jobs.md), and the request returns. Activation can be
replayed safely and is never triggered by a browser success URL alone.

## What website activation writes

1. Load the unactivated [tenant](../../other/auth/data-model.md) already on the onboarding session
   (`onboarding_sessions.tenant_id`). Do not insert a new `tenants` row. Session and profile
   already share that `tenant_id`.
2. Resolve or create the Clerk organization and set `tenants.clerk_org_id`. Tenant name is the
   **business**; Clerk organization name is the **person**.
3. `tenant_memberships` (`owner`) for the paying owner.
4. Provision the website address → `tenants.website_address` (unique label, **fixed**) and a
   `website_addresses` row (`type=subdomain`, `status=reserved`, `is_primary=true`; hostname in
   [cloudflare.md](../../website/cloudflare.md), table in
   [website data-model](../../website/data-model.md)). A
   wildcard on **our** `placis.com` zone already points at the Worker; do not create one CNAME
   per tenant. The website editor lists that host as a website publication destination; it has
   no `latest/` until the first website publication. Custom website address is a later modal
   ([Connect website address](../../website/cloudflare.md)).
5. `tenants.status=active`. Onboarding session → `activated`. Website preview → `activated`.
   Children (website pages, media, profile edits) already have `tenant_id`; do not re-stamp them.
6. Does **not** write `website_publications`. The unpublished website from 04 (plus whatever 05
   has already written) is what they edit. Website activation does **not** wait for website copy
   generation.

A superseded or already-activated website preview cannot be activated. Replaying the webhook does not
activate twice.

- **Persists** `website_activations` (`clerk_subject`, `checkout_session_id`, `payment_status`,
  `amount`, `currency`, `activated_at`), `stripe_events`; **updates** the existing `tenants` row;
  writes `tenant_memberships`, `website_addresses`.
