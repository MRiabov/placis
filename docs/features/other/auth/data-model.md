# Auth — data model

Identity and tenancy tables. Conventions: [data-model conventions](../../../general-architecture/data-model.md).

- `tenants` — `id` uuid pk, `clerk_org_id` unique, `slug` unique, `name`, `status`
  (`draft`/`active`/`suspended`), `created_at`, `updated_at`
- `tenant_memberships` — `id`, `tenant_id` fk, `clerk_user_id`, `role`, `created_at`;
  unique `(tenant_id, clerk_user_id)`
- `tenant_domains` — `id`, `tenant_id` fk, `hostname` unique, `type` (`subdomain`/`custom`),
  `status` (`reserved`/`pending`/`active`/`failed`), `dns_verified_at`, `activated_at`, `created_at`

## Indexes

Unique: `tenants.clerk_org_id`, `tenants.slug`.
