# Billing HTTP

Conventions: [HTTP conventions](../../general-architecture/api.md).
Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).

**Auth default:** Clerk JWT, active tenant. Mutating Routes send
`Idempotency-Key`. Assistant billed work still uses **402**
`usage_credit_exhausted`. Website publication when the subscription is
not active uses **402** `subscription_canceled` on
[website publication](../website/api.md)
([errors](../../general-architecture/api.md)). That **402** starts when
`subscription_status=canceled` (after owner cancel at period end, or
after the three-month non-payment deadline). During the non-payment
window the subscription stays `active`; Publish still works.

Website activation checkout stays on
[onboarding HTTP](../onboarding/api.md). Extra usage credit,
subscription, catalogue, invoice, and refund Stripe events on
`POST /v1/webhooks/stripe` **insert** billing River job kinds; they are
not billing Routes. Do not create auth routes for usage credit. Usage
credit is Postgres ([persistence.md](persistence.md)). Stripe is
payment, the Price catalogue, and the subscription-price clock.

**Auth none:** `GET /v1/billing/catalog` (CI bake / public Pricing).
Same mode as Find search ([auth modes](../../general-architecture/api.md)).

## DTOs

| DTO | Fields | Description |
| --- | --- | --- |
| `BillingCatalogRead` | `prices: []BillingCatalogPriceRead` | Choosable Prices for Pricing bake |
| `BillingCatalogPriceRead` | `subscription_tier`, `billing_interval`, `amount_eur`, `included_usage_credit_eur` | Public catalogue row; their cost |
| `BillingUsageRead` | `subscription_status`, `subscription_tier`, `subscription_price_eur`, `billing_interval`, `current_period_end`, `cancel_at_period_end`, `remaining_usage_credit_eur`, `pool_usage_credit_eur`, `spent_this_period_eur`, `spent_voice_eur`, `spent_image_eur`, `spent_text_eur` | Usage & billing; their cost |
| `BillingExtraUsageCreditCreate` | `amount_eur` | Extra usage credit Checkout |
| `BillingSubscriptionCheckoutCreate` | | Pay-again (Pro month). Empty body |
| `BillingCheckoutRead` | `checkout_url` | Hosted Checkout URL |

`subscription_status` is `active` / `canceled` / `none` (`none` = no
`subscriptions` row). `subscription_tier` is `pro` / `pro-plus` /
`pro-max`. `billing_interval` is `month`. Money fields are their cost,
`>= 0`, EUR numeric. Extra usage credit `amount_eur` is `> 0`. Frontend
computes 20% / empty from remaining vs pool; no extra route. Catalogue
GET has no `stripe_customer_id`, no Stripe Price ids, no activation Price.

## Routes

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/billing/catalog` | CI `astro build`; not the website-visitor browser | | `BillingCatalogRead` | `billing.prices` | | Choosable rows (Pro month). Auth none | | `stripe_customer_id`; activation Price; `Prices.List`; Clerk JWT |
| `GET /v1/billing/usage` | Usage & billing; 20% / empty | | `BillingUsageRead` | `subscriptions`, `ai_use_ledger_entries`, `billing.prices` | | Remaining is the AI use ledger sum. Price from cache | | Our cost |
| `POST /v1/billing/extra-usage-credit/checkout` | extra usage credit | `BillingExtraUsageCreditCreate` | `BillingCheckoutRead` | `subscriptions` | | Stripe Checkout `mode=payment`; same `stripe_customer_id`; webhook **inserts** `billing_extra_usage_credit` | | Activation checkout; persist `ai_use_ledger_entries` on this POST |
| `POST /v1/billing/subscription/checkout` | pay-again | `BillingSubscriptionCheckoutCreate` | `BillingCheckoutRead` | `subscriptions`, `billing.prices` | | See overflow | `409` if `active`; missing Pro month Price | Website activation; extra usage credit; Enterprise plan; activation Price; Change plan while `active` |
| `POST /v1/billing/subscription/cancel` | Cancel subscription | | `BillingUsageRead` | `subscriptions` | `subscriptions.cancel_at_period_end` | Stripe + local `cancel_at_period_end`; still `active` | `409` if `canceled` | Set `status=canceled`; unpublish; `UnpublishWebsite` |
| `POST /v1/billing/subscription/keep` | Keep subscription | | `BillingUsageRead` | `subscriptions` | `subscriptions.cancel_at_period_end` | Stripe + clear `cancel_at_period_end` | `409` if `canceled` | |

### GET /v1/billing/catalog

**Reads** `billing.prices` where `choosable` and `active`. Amounts from
the cache (Stripe Price euros). Missing cache is empty `prices` (CI
bake fails closed; do not invent amounts). Not a Stripe call.

### POST /v1/billing/subscription/checkout

Pay-again after `canceled` only. **Reads** the active choosable Pro
month Price; fail the POST if missing (no ad-hoc `price_data`). Stripe
Checkout `mode=subscription` on that Price only (no activation Price).
Paid webhook **inserts** `billing_subscription_sync`. Frontend follows
`checkout_url` to hosted Checkout. Enterprise plan is not this route.
Change plan while `active` is deferred (`409`).

## Do not create

- website-activation checkout / status live on
  [onboarding HTTP](../onboarding/api.md)
  (`/v1/onboarding/activation/…`); Stripe webhooks stay
  `POST /v1/webhooks/stripe`
- public checkout on the Placis website
- predecessor `/v1/me/organization`
- Stripe meters / usage records / Stripe balance as the usage credit
  pool
- hosted billing portal, coupons, trials, Stripe Tax / VAT routes
