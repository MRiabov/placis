# Billing HTTP

Conventions: [HTTP conventions](../../general-architecture/api.md).
Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).

**Auth default:** Clerk JWT, active tenant. Mutating Routes send
`Idempotency-Key`. Assistant billed work still uses **402**
`usage_credit_exhausted`. Website publication when the subscription is
not active uses **402** `subscription_canceled` on
[website publication](../website/api.md)
([errors](../../general-architecture/api.md)).

Website activation checkout and webhooks stay on
[onboarding HTTP](../onboarding/api.md). Extra usage credit and
subscription Stripe events on `POST /v1/webhooks/stripe` **insert**
billing River job kinds; they are not billing Routes. Do not create auth
routes for usage credit. Usage credit is Postgres
([persistence.md](persistence.md)); Stripe is payment and the
subscription-price clock.

## DTOs

| DTO | Fields | Description |
| --- | --- | --- |
| `BillingUsageRead` | `subscription_status`, `subscription_tier`, `subscription_price_usd_cents`, `billing_interval`, `current_period_end`, `cancel_at_period_end`, `remaining_usage_credit_usd_cents`, `pool_usage_credit_usd_cents`, `spent_this_period_usd_cents`, `spent_voice_usd_cents`, `spent_image_usd_cents`, `spent_text_usd_cents` | Usage & billing; their cost |
| `BillingExtraUsageCreditCreate` | `amount_usd_cents` | Extra usage credit Checkout |
| `BillingSubscriptionCheckoutCreate` | `subscription_tier`, `billing_interval` | Change plan / pay-again |
| `BillingCheckoutRead` | `checkout_url` | Stripe Checkout Session URL |

`subscription_status` is `active` / `canceled` / `none` (`none` = no
`subscriptions` row). `subscription_tier` is `pro` / `pro-plus` /
`pro-max`. `billing_interval` is `month` / `year`. Money fields are
their cost, `>= 0`. Extra usage credit `amount_usd_cents` is `> 0`.
Frontend computes 20% / empty from remaining vs pool; no extra route.

## Routes

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/billing/usage` | Usage & billing; 20% / empty | | `BillingUsageRead` | `subscriptions`, `ai_use_ledger_entries` | | Remaining is the AI use ledger sum | | Our cost |
| `POST /v1/billing/extra-usage-credit/checkout` | extra usage credit | `BillingExtraUsageCreditCreate` | `BillingCheckoutRead` | | | Stripe Checkout; webhook **inserts** `billing_extra_usage_credit` | | Activation checkout; persist `ai_use_ledger_entries` on this POST |
| `POST /v1/billing/subscription/checkout` | Change plan; pay-again | `BillingSubscriptionCheckoutCreate` | `BillingCheckoutRead` | `subscriptions` | `subscriptions` when `status=active` | See overflow | | Website activation; extra usage credit; Enterprise plan |
| `POST /v1/billing/subscription/cancel` | Cancel subscription | | `BillingUsageRead` | `subscriptions` | `subscriptions.cancel_at_period_end` | Stripe + local `cancel_at_period_end`; still `active` | `409` if `canceled` | Set `status=canceled`; unpublish; `UnpublishWebsite` |
| `POST /v1/billing/subscription/keep` | Keep subscription | | `BillingUsageRead` | `subscriptions` | `subscriptions.cancel_at_period_end` | Stripe + clear `cancel_at_period_end` | `409` if `canceled` | |

### POST /v1/billing/subscription/checkout

When `status=active`, Stripe subscription **update** and **persists
into** `subscriptions` (`subscription_tier`, `billing_interval`). No
second `included_usage_credit` mid-period. When not `active` (including
pay-again after `canceled`), Stripe Checkout Session only; paid webhook
**inserts** `billing_subscription_sync`. Frontend follows
`checkout_url`. Enterprise plan is not this route.

## Do not create

- website-activation checkout / status live on
  [onboarding HTTP](../onboarding/api.md)
  (`/v1/onboarding/activation/…`); Stripe webhooks stay
  `POST /v1/webhooks/stripe`
- Clerk Billing routes
- public checkout on the Placis website
- predecessor `/v1/me/organization`
- Stripe meters / usage records / Stripe balance as the usage credit
  pool
