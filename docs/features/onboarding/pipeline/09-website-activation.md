# 09 — Website activation

The contractor pays on the **website preview** (`/onboarding/preview-and-edit/`)
or on the **preview website address** strip if they shared (FQDN in
[cloudflare.md](../../website/cloudflare.md)). Clerk **Sign in with Google** if needed (OAuth modal island;
not magic link, not SignUp name); an existing Clerk session skips to pay. Then
Stripe checkout (island POSTs `POST /v1/onboarding/activation/checkout` to
`cmd/api`, CORS by `Host` / `website_prefix` on the preview website address; on
the app origin CORS is the app. Not `/v1/website-previews/{token}/…`; do not
bake a Checkout Session URL into R2 HTML). Checkout **calls**
`AttachClerkOrganization` and returns `clerk_org_id` for `setActive` before
Stripe. The website-activation strip is **sticky to the bottom of the viewport**
while the website scrolls ([frontend.md](../frontend.md), [design decision](../design-decision-record.md) 10). Website
activation **upgrades** the existing unactivated tenant (`status=active`); it
does not insert a second tenant. Does **not** wait for 06. Does **not** require
a prior 08 share.

Stripe (via `stripe-go`) handles **this** Checkout:
`mode=subscription` plus a one-time activation Price (access-to-Placis
fee) and the choosable Placis Pro plan / month Price. Amounts **read** from
`billing.prices` (Stripe Prices), not a Go 4900. Missing activation or
Placis Pro plan / month Price fails the POST (no ad-hoc `price_data`).
`ActivateSubscription` **persists** `billing.subscriptions` from this
Checkout; it does not create a second Stripe Subscription. Access fee
is never charged again.
`checkout.session.completed` is accepted only after the SDK verifies
the signature (`webhook.ConstructEvent`) and the metadata matches
(`tenant_id`, authenticated Clerk subject). The raw payload is saved on
`stripe_events`, the webhook **inserts** River job kind `website_activation`,
and the request returns. Activation can be replayed safely and is never
triggered by a browser success URL alone.

**Whoever pays becomes the owner.** Unauthenticated visitors may authenticate
and pay. First verified `checkout.session.completed` wins.

## Trigger

Verified Stripe `checkout.session.completed` for an unactivated tenant. Host
need not exist yet. Not a superseded 05-retry of a different in-flight checkout
that already lost.

## Pre

- `websites.website_prefix` already reserved at Select and copy website
  template.
- If they shared: `website_publications` v1 `active` (strip on) or a later
  onboarding write on that prefix.
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
- Charge the access fee again after a refund.
- Un-activate the tenant or reopen this step after a refund.

## Do

This step **is** River job kind `website_activation`. Set
`tenants.status=active`, then **calls** `PublishWebsite` on the
**onboarding website** (earliest `websites.created_at`; strip off), then
**calls** `ActivateSubscription`. Must not publish every website.

1. Load the unactivated [tenant](../../other/auth/persistence.md) on
   `onboarding_sessions.tenant_id`.
2. **Calls** `AttachClerkOrganization` if `tenants.clerk_org_id` is still
   null (checkout usually already did). Clerk organization name and logo
   are the **business** (business logo when present).
3. **Calls** `InsertOwnerMembership` (`role=owner`) for the paying owner.
4. `tenants.status=active`. Onboarding session → `activated`. In the
   **same transaction**, complete `ai.threads` `thread_kind=cms_assistant`
   `current` and end any `assistant.runs` `running` ([website editor](../website-editor.md)).
5. Write **`website_publications`** without the website-activation strip,
   `published_by=onboarding`, `active`, on the onboarding website. Prefix is
   already on that row. If they never shared: write the **first** live R2
   **without** strip. If they already shared: archive v1 (strip on) and write
   live v2. HTML write is website
   [Website publication](../../website/pipeline/04-website-publication.md)
   (strip flag off). Host stays up. Website address is a later CMS modal.
6. In-flight 06 **continues** on the same `tenant_id` as River-only. Do not
   cancel it. Do not append Assistant thread items. CMS assistant / PATCH are
   not 409-blocked for leftover 06. Host HTML stays the 08/09 R2 `latest/` (06
   does not live-update R2 after 08). Same website-slot overlap: last-write /
   `edit_history_conflict`.

## Inserts

`website_activation` (webhook **inserts**; this step **is** that River job
kind).

## Persist

`website_activations`; `stripe_events`; schema `jobs` River job kind
`website_activation`; **update** existing `tenants`;
`tenant_memberships`; complete unpaid `ai.threads` `thread_kind=cms_assistant`
`current` + end `running`; `website_publications` live (no strip) + archive
strip v1 if it existed; R2 `latest/` without the strip;
`billing.subscriptions` (Placis Pro plan / month, `status=active`,
`stripe_customer_id`, `stripe_subscription_id` from this Checkout;
`ActivateSubscription`). First-month `included_usage_credit` is
`invoice.paid` / `AddIncludedUsageCredit` (unique Stripe invoice id),
not this job.

## Fail

Signature/metadata mismatch → ignore / 4xx; do not activate. Replay does not
activate twice. A second payer after the first verified completion is refused.
A refund after pay records `payment_status=refunded` and does not reopen
this step.

## Out

`/cms/website` with **Publish**. `/me` returns unactivated `TenantRead` after
Clerk org attach, then `status=active` after this step.
`/onboarding/preview-and-edit/` redirects to `/cms/website`. The preview website
address stays up without the strip (live website). If they never shared, 09
created that host. Unpublished website from 05 (+ 06 + 07 PATCHes)
is what they edit. First **owner** website publication is the next website
version and the first rollback-eligible website version.

### After website activation (billing)

Unpaid access to the application (never website-activated) is **forbidden**.
After activation, stopping the subscription price unpublishes the website
after three calendar months and blocks Publish; they can still edit. Copy
later: **keep your Placis Pro plan subscription to host the website**.

1. **One Checkout** (this step): one-time **activation Price** (access
   fee) plus **Placis Pro plan / month**. Amounts from Stripe Prices
   (Postgres cache). Access fee never charged again. First pay includes
   one month of included usage credit (`invoice.paid` /
   `AddIncludedUsageCredit`; unique Stripe invoice id — do not grant
   twice from `checkout.session.completed`). This step **calls**
   `ActivateSubscription` to **persist** `billing.subscriptions` from
   that Checkout (not a second Stripe Subscription). Public Pricing
   Choose on Placis Pro plan goes here. Plus / Max / year are deferred. If they
   stop paying, the three-month clock then **calls**
   `UnpublishWebsite` and they cannot **Publish** until the
   subscription is active again
   ([billing](../../billing/architecture.md)). CMS edit stays open
   (`tenants.status=active`). Refunds are money-only: tenant stays
   `active`; first payer stays owner; this step does not reopen.
2. **Do not commit to Clerk Billing yet.** Optimistic DB cache of
   subscription status; refresh when expected.
3. Monthly **usage credit** is visible on **Usage & billing** as **€**.
   Unused usage credit carries over. Our cost is **×5** to the owner:
   €50 shown ⇒ they can spend **€10** of our cost. Token / per-image
   invoices and **Voice** (xAI per-minute audio plus text-item fees)
   debit the same pool —
   [billing architecture](../../billing/architecture.md). Persist
   remaining usage credit on the AI use ledger; check it before billed
   work and before a billed realtime connection.

See [billing](../../billing/README.md).

## Invariants

- Same `tenant_id` as 01.
- Same `website_prefix` as 08 (or reserved here if they never shared).
- `/me` may return unactivated `TenantRead` after checkout attach; CMS
  keys off `status=active`.
- Clerk organization 1-1 with the tenant (not active-only); named as the
  business.
- v1 and v2 are never website-rollback targets.
