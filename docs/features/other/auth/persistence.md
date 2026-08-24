# Auth — persistence

Clerk identity and tenant membership. Conventions: [persistence conventions](../../../general-architecture/persistence.md)
(Postgres schema `auth`).

Hostnames for the live contractor website are [website persistence](../../website/persistence.md)
(`website_addresses`), not this file.

A tenant row is created at onboarding confirm (`status=unactivated`). Website activation
**upgrades** that row (`status=active`); it does not insert a second tenant. `/me` returns a
tenant only when `status=active`. Unactivated work is reached via the onboarding session token.

- `tenants` — `id` uuid pk, `clerk_org_id` unique nullable (null while `unactivated`; set at
  website activation), `website_address` unique nullable (reserved label, **fixed at website
  activation**, R2 prefix; FQDN is a `website_addresses` row; null while `unactivated`), `name`
  (business display/legal name when known, else empty until research fills it),
  `status` (`unactivated`/`active`/`suspended`), `created_at`, `updated_at`
- `tenant_memberships` — `id`, `tenant_id` fk, `clerk_user_id`, `role`, `created_at`;
  unique `(tenant_id, clerk_user_id)`

## Indexes

Unique: `tenants.clerk_org_id`, `tenants.website_address` (nullable; many unactivated rows may
have null — Postgres unique allows that).
