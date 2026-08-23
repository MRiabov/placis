# Auth — data model

Clerk identity and tenant membership. Conventions: [data-model conventions](../../../general-architecture/data-model.md)
(Postgres schema `auth`).

Hostnames for the live contractor website are [website data-model](../../website/data-model.md)
(`website_addresses`), not this file.

A tenant row exists only after website activation. Before that, `/me` has no tenant; the
onboarding session status is anything except `activated`.

- `tenants` — `id` uuid pk, `clerk_org_id` unique, `website_address` unique (reserved label,
  **fixed at website activation**, R2 prefix; FQDN is a `website_addresses` row), `name`,
  `status` (`active`/`suspended`), `created_at`, `updated_at`
- `tenant_memberships` — `id`, `tenant_id` fk, `clerk_user_id`, `role`, `created_at`;
  unique `(tenant_id, clerk_user_id)`

## Indexes

Unique: `tenants.clerk_org_id`, `tenants.website_address`.
