# Auth — persistence

Clerk identity and tenant membership. Conventions: [persistence conventions](../../../general-architecture/persistence.md)
(Postgres schema `auth`).

Hostnames for the live contractor website are [website persistence](../../website/persistence.md)
(`website_addresses`), not this file.

A tenant row is created at business lookup (`status=unactivated`). 07 reserves
`website_prefix`. Website activation **upgrades** that row (`status=active`); it
does not insert a second tenant. `/me` returns a tenant only when
`status=active`. Unactivated work is reached via the onboarding session token.

- `tenants` — `id` uuid pk, `clerk_org_id` unique nullable (null while
  `unactivated`; set at website activation), `website_prefix` unique nullable
  (reserved label, **fixed at 07** from `display_name`, R2 prefix; FQDN is a
  `website_addresses` row; null until 07), `name` (business display/legal name
  when known, else empty until business research fills it), `status`
  (`unactivated`/`active`/`suspended`), `subscription_status`
  (`active`/`lapsed`/`none`, optimistic cache — not Clerk Billing yet),
  `created_at`, `updated_at`. Do **not** store `usage_credit_usd_cents` here —
  billing owns the ledger ([billing](../../billing/persistence.md)).
- `tenant_memberships` — `id`, `tenant_id` fk, `clerk_user_id`, `role`,
  `created_at`; unique `(tenant_id, clerk_user_id)`

## Indexes

Unique: `tenants.clerk_org_id`, `tenants.website_prefix` (nullable; many
unactivated rows may have null — Postgres unique allows that).
