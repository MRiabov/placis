# 08 — Website activation

The contractor pays on the **website preview**. Clerk sign-in/sign up if needed, then Stripe
checkout. Website activation **upgrades** the existing unactivated tenant (`status=active`); it
does not insert a second tenant. The site stays an **unpublished website** until website
publication in the CMS ([ADR 12](../ADR.md)). Does **not** wait for 06.

Stripe (via `stripe-go`) handles this checkout only. Amount is the activation price (predecessor:
EUR 4900). `checkout.session.completed` is accepted only after the SDK verifies the signature
(`webhook.ConstructEvent`) and the metadata matches (`website_preview_id`, authenticated owner).
The raw payload is saved on `stripe_events`, the work is enqueued on
[River](../../../general-architecture/jobs.md), and the request returns. Activation can be
replayed safely and is never triggered by a browser success URL alone.

## Trigger

Verified Stripe `checkout.session.completed` for an `active` website preview.

## Pre

- Website preview `status=active` (not superseded, not already activated).
- Authenticated owner (Clerk).
- `onboarding_sessions.tenant_id` is the unactivated tenant from 01.

## Must not

- Insert a second `tenants` row.
- First-write child `tenant_id`s (website/media/profile already have it).
- Write `website_publications`.
- Wait for 06.
- Activate a superseded or already-activated website preview.
- Treat the browser success URL as activation.

## Do

1. Load the unactivated [tenant](../../other/auth/data-model.md) on
   `onboarding_sessions.tenant_id`.
2. Resolve or create the Clerk organization; set `tenants.clerk_org_id`. Tenant name is the
   **business**; Clerk organization name is the **person**.
3. `tenant_memberships` (`owner`) for the paying owner.
4. Provision the website address → `tenants.website_address` (unique label, **fixed**) and a
   `website_addresses` row (`type=subdomain`, `status=reserved`, `is_primary=true`; hostname in
   [cloudflare.md](../../website/cloudflare.md)). Wildcard on **our** `placis.com` zone already
   points at the Worker. After website publication that host is the live default (glossary
   Website preview, Distinct from) — never call it a website preview. Custom website address is a later modal.
5. `tenants.status=active`. Onboarding session → `activated`. Website preview → `activated`.
6. In-flight 06 **continues** on the same `tenant_id`. CMS website assistant 409 until that run
   ends.

## Persist

`website_activations`; `stripe_events`; **update** existing `tenants`; `tenant_memberships`;
`website_addresses`.

## Fail

Signature/metadata mismatch → ignore / 4xx; no upgrade. Replay does not activate twice.

## Out

`/cms/website`. `/me` now returns the tenant. Unpublished website from 05 (+ whatever 06 has
written) is what they edit.

## Invariants

- Same `tenant_id` as 01.
- No `website_publications`.
- `/me` tenant only when `status=active`.
- Clerk organization 1-1 for **active** tenants only.
