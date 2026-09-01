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

## Tables

### `billing.subscriptions`

- **Columns:** `id` uuid pk, `tenant_id` fk, `subscription_tier` text,
  `billing_interval` text, `status` text, `cancel_at_period_end` bool,
  `current_period_end` timestamptz, `canceled_at` timestamptz nullable,
  `stripe_subscription_id` text nullable, `created_at` timestamptz,
  `updated_at` timestamptz
- **Enums:** `subscription_tier` → `pro` / `pro-plus` / `pro-max`;
  `billing_interval` → `month` / `year`; `status` → `active` /
  `canceled`
- **Uniques:** `tenant_id`; nullable unique `stripe_subscription_id`
- **Written by:** `ActivateSubscription`; `CancelSubscription`;
  `KeepSubscription`; `CreateSubscriptionCheckout` when `status=active`;
  `SyncSubscriptionFromStripe` (`POST /v1/webhooks/stripe` **inserts**
  `billing_subscription_sync`)
- **Notes:** `canceled_at` is set when `status` becomes `canceled`
  (website 01 occupancy). Enterprise plan is not a self-serve
  `subscription_tier`. GET `subscription_status=none` means no row.
  `tenants.subscription_status` is the optimistic cache
  ([auth](../other/auth/persistence.md)).

### `ai_use_ledger_entries`

- **Columns:** `id` uuid pk, `tenant_id` fk, `entry_kind` text,
  `amount_usd_cents` int, `usage_category` text nullable,
  `period_started_at` timestamptz nullable, `stripe_checkout_session_id`
  text nullable, `created_at` timestamptz
- **Enums:** `entry_kind` → `included_usage_credit` /
  `extra_usage_credit` / `spend`; `usage_category` → `voice` / `image` /
  `text`
- **Uniques:** nullable unique `stripe_checkout_session_id` (extra usage
  credit paid)
- **Written by:** `ActivateSubscription` /
  `AddIncludedUsageCredit` (`included_usage_credit`);
  `ApplyExtraUsageCredit`; `RecordAIUseSpend`
- **Notes:** Append-only. `amount_usd_cents` `> 0` (their cost).
  `usage_category` required when `entry_kind=spend`, null otherwise.
  `period_started_at` is the included usage credit’s period.
  `stripe_checkout_session_id` is extra usage credit only. Catalogue
  included usage credit at insert time (Placis Pro plan $100 / Plus $400
  / Max $1,500); no included-amount column on `subscriptions`.

## Indexes

Lookup: `(tenant_id, created_at)` on `ai_use_ledger_entries`. Unique:
`subscriptions.tenant_id`. Unique nullable:
`subscriptions.stripe_subscription_id`;
`ai_use_ledger_entries.stripe_checkout_session_id`.
