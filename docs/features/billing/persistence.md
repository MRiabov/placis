# Billing — persistence

Conventions: [persistence conventions](../../general-architecture/persistence.md) (Postgres schema `billing`). Go package
`internal/billing/` (implementation slice later). Auth stays Clerk / tenant
membership — **not** this schema.

Do not put remaining usage credit on
[auth](../other/auth/persistence.md). Assistant thread tables do not store
usage credit. Website activation checkout and `stripe_events` stay on
[onboarding persistence](../onboarding/persistence.md).

The AI use ledger is append-only rows. Remaining usage credit is the sum of
included grants and extra usage credit minus spends. Carry-over is that sum
across periods: a new included grant is inserted; remaining rows are not
deleted or zeroed.

## Tables

- `subscriptions` — `id` uuid pk, `tenant_id` fk unique, `subscription_tier`
  (`pro` / `pro-plus` / `pro-max`), `billing_interval` (`month` / `year`),
  `status` (`active` / `canceled`), `cancel_at_period_end` bool,
  `current_period_end` timestamptz, `canceled_at` timestamptz nullable (set
  when `status` becomes `canceled`; occupancy in website 01 uses this clock),
  `stripe_subscription_id` text nullable,
  `created_at`, `updated_at`.
  Enterprise plan is not a self-serve `subscription_tier` value.
- `ai_use_ledger_entries` — `id` uuid pk, `tenant_id` fk, `entry_kind`
  (`included_grant` / `extra_usage_credit` / `spend`), `amount_usd_cents` int
  (`> 0`), `usage_category` nullable (`voice` / `image` / `text`; required when
  `entry_kind=spend`, null otherwise), `period_started_at` timestamptz nullable
  (included grant’s period), `stripe_checkout_session_id` text nullable (extra
  usage credit), `created_at`.

## Indexes

Lookup: `(tenant_id, created_at)` on `ai_use_ledger_entries`. Unique:
`subscriptions.tenant_id`. Unique nullable:
`subscriptions.stripe_subscription_id`.
