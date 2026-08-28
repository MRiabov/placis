# 08 — Website activation

The contractor pays on the **preview website address** (FQDN in
[cloudflare.md](../../website/cloudflare.md)). Clerk **create account** if needed (modal island); an existing
Clerk session skips to pay. Then Stripe checkout (island POSTs public checkout
to `cmd/api`, CORS by `Host` / `website_prefix`; not
`/v1/website-previews/{token}/…`; do not bake a Checkout Session URL into R2
HTML). The website-activation strip is **sticky to the bottom of the viewport**
while the website scrolls ([frontend.md](../frontend.md), [design decision](../design-decision-record.md) 10). Website
activation **upgrades** the existing unactivated tenant (`status=active`); it
does not insert a second tenant. Does **not** wait for 06.

Stripe (via `stripe-go`) handles this checkout only. Amount is the activation
price (predecessor: EUR 4900). `checkout.session.completed` is accepted only
after the SDK verifies the signature (`webhook.ConstructEvent`) and the metadata
matches (`tenant_id`, authenticated Clerk subject). The raw payload is saved on
`stripe_events`, the work is enqueued on [River](../../../general-architecture/jobs.md), and the request returns.
Activation can be replayed safely and is never triggered by a browser success
URL alone.

**Whoever pays becomes the owner.** Unauthenticated visitors may authenticate
and pay. First verified `checkout.session.completed` wins.

## Trigger

Verified Stripe `checkout.session.completed` for an unactivated tenant whose
host is up (07 `latest/` present). Not a superseded 05-retry of a different
in-flight checkout that already lost.

## Pre

- `tenants.website_prefix` already reserved at 07.
- `website_publications` v1 `active` (strip on) or a later onboarding write on
  that prefix.
- Authenticated Clerk subject (the payer).
- `onboarding_sessions.tenant_id` is the unactivated tenant from 01.

## Must not

- Insert a second `tenants` row.
- First-write child `tenant_id`s (website/media/profile already have it).
- Invent or rename `website_prefix`.
- Wait for 06.
- Activate twice (replay / second payer).
- Treat the browser success URL as activation.
- Leave v1 as a website-rollback target (archive it).
- Take the host down (not a 404).

## Do

1. Load the unactivated [tenant](../../other/auth/persistence.md) on
   `onboarding_sessions.tenant_id`.
2. Resolve or create the Clerk organization; set `tenants.clerk_org_id`. Tenant
   name is the **business**; Clerk organization name is the **person**.
3. `tenant_memberships` (`owner`) for the paying owner.
4. `tenants.status=active`. Onboarding session → `activated`.
5. Write **`website_publications` v2** without the website-activation strip,
   `published_by=onboarding`, `active`. Archive v1. Same R2 write as 07 / CMS
   website publication; purge Cache so v1-with-strip does not linger. Host stays
   up. Website address is a later CMS modal.
6. In-flight 06 **continues** on the same `tenant_id`. CMS website assistant 409
   until that run ends.

## Persist

`website_activations`; `stripe_events`; **update** existing `tenants`;
`tenant_memberships`; `website_publications` v2 + archive v1; R2 `latest/`
without the strip.

## Fail

Signature/metadata mismatch → ignore / 4xx; no upgrade. Replay does not activate
twice. A second payer after the first verified completion is refused.

## Out

`/cms/website` with **Publish**. `/me` now returns the tenant. The preview
website address stays up without the strip (live website, not website preview).
Unpublished website from 05 (+ whatever 06 has written) is what they edit. First
**owner** website publication is v3+ and the first rollback-eligible website
version.

## After website activation (billing)

Unpaid access to the application is **forbidden**. Copy later:
**keep your Placis Pro subscription to continue to edit and host the website** —
not “Upgrade.”

1. **One upfront pay** (this checkout; predecessor EUR 4900 stays until that
   epic).
2. Then about **50 EUR / month**. If it lapses, the website is **unpublished**.
3. **Do not commit to Clerk Billing yet.** Optimistic DB cache of subscription
   status; refresh when expected.
4. Monthly **usage credit** is visible in the UI as **$**. OpenRouter (or the
   generation hop) prices are **×5** for the owner:
   $50 shown ⇒ they can spend **$10** of OpenRouter cost. Persist remaining
   credit; check it on LLM calls.

Currency for the retainer is **EUR**. Usage credit display is **$**.

## Invariants

- Same `tenant_id` as 01.
- Same `website_prefix` as 07.
- `/me` tenant only when `status=active`.
- Clerk organization 1-1 for **active** tenants only.
- v1 and v2 are never website-rollback targets.
