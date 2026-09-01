# Billing HTTP

Conventions: [HTTP conventions](../../general-architecture/api.md). Auth: Clerk
JWT, active tenant. Assistant billed work still uses **402**
`usage_credit_exhausted`. Website publication when the subscription is not
active uses **402** `subscription_canceled` on
[website publication](../website/api.md)
([errors](../../general-architecture/api.md)).

Website activation checkout and webhooks stay on
[onboarding HTTP](../onboarding/api.md). Do not create auth routes for usage
credit.

## Routes

### GET /v1/billing/usage

- **Auth:** Clerk JWT, active tenant.
- **Callers:** Usage & billing; 20% / empty notification.
- **Response:** `subscription_status` (`active` / `canceled` / `none`),
  `subscription_tier` (`pro` / `pro-plus` / `pro-max`),
  `subscription_price_usd_cents`, `billing_interval` (`month` / `year`),
  `current_period_end`, `cancel_at_period_end` (bool),
  `remaining_usage_credit_usd_cents` (`>= 0`),
  `pool_usage_credit_usd_cents` (remaining + spent this period, including
  carry-over), `spent_this_period_usd_cents`, `spent_voice_usd_cents`,
  `spent_image_usd_cents`, `spent_text_usd_cents`. All money fields are their
  cost, not ours.

### POST /v1/billing/extra-usage-credit/checkout

- **Auth:** Clerk JWT, active tenant.
- **Callers:** Usage & billing **extra usage credit**.
- **Idempotency-Key:** yes.
- **Request:** `amount_usd_cents` (`> 0`) — usage credit to add (their cost).
- **Behavior:** create a Stripe Checkout Session; on paid webhook, insert an
  `extra_usage_credit` AI use ledger row. Activation checkout is not this
  route.
- **Response:** `checkout_url` (`string` + `maxLength`).

### POST /v1/billing/subscription/checkout

- **Auth:** Clerk JWT, active tenant.
- **Callers:** Usage & billing **Change plan** (including pay-again when not
  `active`).
- **Idempotency-Key:** yes.
- **Request:** `subscription_tier` (`pro` / `pro-plus` / `pro-max`),
  `billing_interval` (`month` / `year`).
- **Behavior:** Stripe subscription update when `status=active`; Checkout
  Session when not. Not website activation. Not extra usage credit. Enterprise
  plan is not this route.
- **Response:** `checkout_url` (`string` + `maxLength`). Frontend follows it.

### POST /v1/billing/subscription/cancel

- **Auth:** Clerk JWT, active tenant.
- **Callers:** Usage & billing **Cancel subscription**.
- **Idempotency-Key:** yes.
- **Behavior:** set `cancel_at_period_end`. Do not set `status=canceled` until
  `current_period_end`. Unpublish happens then, not on this POST.
- **Response:** usage `*Read` (same as GET).

### POST /v1/billing/subscription/keep

- **Auth:** Clerk JWT, active tenant.
- **Callers:** Usage & billing **Keep subscription** (undo scheduled cancel).
- **Idempotency-Key:** yes.
- **Behavior:** clear `cancel_at_period_end` while still `active`. **409** if
  already `canceled`.
- **Response:** usage `*Read`.

## Do not create

- website-activation checkout / status live on
  [onboarding HTTP](../onboarding/api.md)
  (`/v1/onboarding/activation/…`); Stripe webhooks stay
  `POST /v1/webhooks/stripe`
- Clerk Billing routes
- public checkout on the Placis website
- predecessor `/v1/me/organization`
