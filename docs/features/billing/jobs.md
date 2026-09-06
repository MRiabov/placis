# Billing jobs

Conventions and index: [jobs](../../infrastructure/jobs.md). Named
identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers). Closed
`## Jobs`. Overflow is `###` with a backticked River job kind under Jobs.

Website activation Checkout is onboarding
[09](../onboarding/pipeline/09-website-activation.md)
([onboarding jobs](../onboarding/jobs.md)), not these River job kinds.

## Jobs

| River job kind | Args | Unique key | Do |
| --- | --- | --- | --- |
| `billing_extra_usage_credit` | Stripe checkout session id | checkout session id while pending/running | `ApplyExtraUsageCredit` |
| `billing_subscription_sync` | Stripe subscription id | Stripe subscription id while pending/running | `SyncSubscriptionFromStripe`; `invoice.paid` **calls** `AddIncludedUsageCredit`; `invoice.payment_failed` sets `nonpayment_started_at`; owner cancel at period end **calls** `UnpublishWebsite` |
| `billing_catalog_sync` | `event_id` or full-list | `event_id` when set; one global full-list while pending/running | `SyncCatalogFromStripe` (payload upsert, or one `Prices.List` on full-list) |
| `billing_nonpayment_unpublish` | none | one global row while pending/running | retrieve Stripe; unpaid after 3 calendar months → `canceled` + **calls** `UnpublishWebsite` |

### `billing_extra_usage_credit`

Paid extra usage credit Checkout. `POST /v1/webhooks/stripe` **inserts**
this River job kind after `stripe_events`. Worker:
`internal/billing/jobs.go`. Worker **calls** `ApplyExtraUsageCredit`
(**persists into** `ai_use_ledger_entries`
`entry_kind=extra_usage_credit`). Replay of the same checkout session id
is a unique conflict; do not insert a second row. Not website
activation. Routes: [billing HTTP](api.md).

### `billing_subscription_sync`

Stripe subscription updated / deleted, `invoice.paid`, and
`invoice.payment_failed` (billing). Webhook **inserts** this River job
kind. Unique on Stripe subscription id while pending/running
(serialize). Worker: `internal/billing/jobs.go`. Worker **calls**
`SyncSubscriptionFromStripe`.

New paid period: **calls** `AddIncludedUsageCredit` (unique
`stripe_invoice_id`; do not insert a second `included_usage_credit`
from `checkout.session.completed` or from subscription-updated alone).
`invoice.paid` also clears `nonpayment_started_at`.
`invoice.payment_failed` sets `nonpayment_started_at` if null; does
**not** unpublish.

Owner-scheduled cancel at period end (`cancel_at_period_end`
completed): `status=canceled`, set `canceled_at`, **calls**
`UnpublishWebsite` (every website on that tenant). Unpaid dunning is
**not** this immediate unpublish — that is
`billing_nonpayment_unpublish`.

Pay-again Checkout paid: new `stripe_subscription_id`,
`status=active`, `canceled_at` cleared, `stripe_customer_id` kept.
Routes: [billing HTTP](api.md).

### `billing_catalog_sync`

`product.*` / `price.*` on `POST /v1/webhooks/stripe` **inserts** this
River job kind with that `event_id`. Worker **reads**
`stripe_events.payload` and upserts/deactivates **that** Price /
Product. Not `Prices.List` per webhook. Empty `billing.prices` / boot
**inserts** one full-list job (one `Prices.List`; upsert all; deactivate
missing). Not on Checkout, catalogue GET, or `invoice.paid`. Worker:
`internal/billing/jobs.go`. Worker **calls** `SyncCatalogFromStripe`.

### `billing_nonpayment_unpublish`

Daily. Unique one global row while pending/running. For each
`billing.subscriptions` row whose `nonpayment_started_at` plus three
calendar months has elapsed: **retrieve** the Stripe Subscription and
latest invoice. If Stripe shows paid (missed webhook): clear
`nonpayment_started_at`, **calls** `AddIncludedUsageCredit` if that
invoice was not yet applied, do **not** unpublish. If still unpaid: set
`canceled` / `canceled_at` and **calls** `UnpublishWebsite` (every
website on that tenant). This Stripe GET is only here, not on Publish.
`billing_subscription_sync` also evaluates the clock when a webhook
lands. Worker: `internal/billing/jobs.go`. Website 01 occupancy (6
months after `canceled_at`) is unchanged.
