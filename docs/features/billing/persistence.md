# Billing — persistence

Conventions:
[persistence conventions](../../general-architecture/persistence.md)
(Postgres schema `billing`). Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers). Go
package `internal/billing/` (implementation slice later). Auth stays
Clerk / tenant membership — **not** this schema.

Do not put remaining usage credit on
[auth](../other/auth/persistence.md). Assistant thread tables do not
store usage credit. Website activation checkout and `stripe_events` stay
on [onboarding persistence](../onboarding/persistence.md).

Usage credit is this AI use ledger only. Remaining is the sum of
`included_usage_credit` and `extra_usage_credit` minus `spend`. Carry-over
is that sum across periods: a new `included_usage_credit` row is
inserted; remaining rows are not deleted or zeroed. Stripe does not
store remaining.

Owner-facing money is **EUR** `numeric` (scale enough for ×5 of sub-cent
vendor invoices). Not integer cents. Not `numeric(12,2)` only. Stripe
`unit_amount` (cents) converts **only** at the Stripe adapter.
`billing.prices.amount_eur` is those catalogue euros. Stripe Price
`currency` must be `eur`.

## Tables

### `billing.prices`

- **Columns:** `id` uuid pk, `stripe_price_id` text, `stripe_product_id`
  text, `lookup_key` text nullable, `price_kind` text, `subscription_tier`
  text nullable, `billing_interval` text nullable, `amount_eur`
  numeric, `currency` text, `included_usage_credit_eur` numeric
  nullable, `choosable` bool, `active` bool, `created_at` timestamptz,
  `updated_at` timestamptz
- **Enums:** `price_kind` → `activation` / `subscription`;
  `subscription_tier` → `pro` / `pro-plus` / `pro-max` (null on
  activation Price); `billing_interval` → `month` (null on activation
  Price); `currency` → `eur`
- **Uniques:** `stripe_price_id`
- **Written by:** `SyncCatalogFromStripe` (`POST /v1/webhooks/stripe`
  `product.*` / `price.*` **inserts** `billing_catalog_sync`; empty
  cache / boot **inserts** one full-list `billing_catalog_sync`)
- **Notes:** Checkout and `GetBillingCatalog` **read** this table. Not
  `Prices.List` on those paths. Activation Price is never `choosable`;
  09 always attaches the active activation Price. Self-serve choosable
  is Placis Pro plan / month only. Plus / Max rows may exist with
  `choosable=false`. Yearly is out of this spec (no choosable yearly
  Price). `included_usage_credit_eur` is subscription Prices only
  (Product metadata / cache column; not a Stripe Price and not meters).
  Deactivate a row when Stripe archives that Price.

### `billing.subscriptions`

- **Columns:** `id` uuid pk, `tenant_id` fk, `subscription_tier` text,
  `billing_interval` text, `status` text, `cancel_at_period_end` bool,
  `current_period_end` timestamptz, `canceled_at` timestamptz nullable,
  `nonpayment_started_at` timestamptz nullable, `stripe_customer_id`
  text, `stripe_subscription_id` text nullable, `created_at`
  timestamptz, `updated_at` timestamptz
- **Enums:** `subscription_tier` → `pro` / `pro-plus` / `pro-max`;
  `billing_interval` → `month`; `status` → `active` / `canceled`
- **Uniques:** `tenant_id`; unique `stripe_customer_id`; nullable unique
  `stripe_subscription_id`
- **Written by:** `ActivateSubscription`; `CancelSubscription`;
  `KeepSubscription`; `CreateSubscriptionCheckout` (pay-again Checkout
  is paid via webhook); `SyncSubscriptionFromStripe` (`POST
  /v1/webhooks/stripe` **inserts** `billing_subscription_sync`);
  `billing_nonpayment_unpublish`
- **Notes:** Product row (tenant ↔ `stripe_customer_id` / Subscription, 3-month
  clock, occupancy) — not a Stripe JSON cache. `stripe_customer_id` is
  kept on pay-again; only `stripe_subscription_id` is replaced. Tenant
  1-1 `stripe_customer_id`. `nonpayment_started_at` is set on first
  `invoice.payment_failed` after a paid period; cleared on
  `invoice.paid` or when the deadline job sees Stripe paid. At three
  calendar months the deadline job **retrieves** Stripe, then either
  syncs or sets `canceled` / `canceled_at` and **calls**
  `UnpublishWebsite`. `canceled_at` is set when `status` becomes
  `canceled` (website 01 occupancy). Enterprise plan is not a
  self-serve `subscription_tier`. GET `subscription_status=none` means
  no row. `tenants.subscription_status` is the optional denormalized
  copy ([auth](../other/auth/persistence.md)); it stays `active` during
  the three-month window.

### `ai_use_ledger_entries`

- **Columns:** `id` uuid pk, `tenant_id` fk, `entry_kind` text,
  `amount_eur` numeric, `usage_category` text nullable,
  `period_started_at` timestamptz nullable, `stripe_checkout_session_id`
  text nullable, `stripe_invoice_id` text nullable, `created_at`
  timestamptz
- **Enums:** `entry_kind` → `included_usage_credit` /
  `extra_usage_credit` / `spend`; `usage_category` → `voice` / `image` /
  `text`
- **Uniques:** nullable unique `stripe_checkout_session_id` (extra usage
  credit paid); nullable unique `stripe_invoice_id`
  (`included_usage_credit`)
- **Written by:** `AddIncludedUsageCredit` (`included_usage_credit`);
  `ApplyExtraUsageCredit`; `RecordAIUseSpend`
- **Notes:** Append-only. `amount_eur` `> 0` (their cost; scale for ×5
  of sub-cent vendor invoices). `usage_category` required when
  `entry_kind=spend`, null otherwise. `period_started_at` is the
  included usage credit’s period. `stripe_checkout_session_id` is extra
  usage credit only. `stripe_invoice_id` is included usage credit only
  (do not grant twice from `checkout.session.completed` and
  `invoice.paid`). Catalogue grants and extra usage purchases are euro
  amounts from the cached Price / owner-chosen `amount_eur`; `spend`
  rows are high-precision their-cost after dated FX. Refund of extra
  usage credit does not delete the row. `ActivateSubscription` does not
  write this table.

## Indexes

Lookup: `(tenant_id, created_at)` on `ai_use_ledger_entries`. Unique:
`subscriptions.tenant_id`; `subscriptions.stripe_customer_id`;
`prices.stripe_price_id`. Unique nullable:
`subscriptions.stripe_subscription_id`;
`ai_use_ledger_entries.stripe_checkout_session_id`;
`ai_use_ledger_entries.stripe_invoice_id`.
