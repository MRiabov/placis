# Auth — data model

Identity and tenancy tables. Conventions: [data-model conventions](../../../general-architecture/data-model.md).

A tenant row exists only after website activation. Before that, `/me` has no tenant; the
onboarding session status is anything except `activated`.

- `tenants` — `id` uuid pk, `clerk_org_id` unique, `website_address` unique (reserved subdomain
  label), `name`, `status` (`active`/`suspended`), `created_at`, `updated_at`
- `tenant_memberships` — `id`, `tenant_id` fk, `clerk_user_id`, `role`, `created_at`;
  unique `(tenant_id, clerk_user_id)`
- `website_addresses` — `id`, `tenant_id` fk, `hostname` unique, `type` (`subdomain`/`custom`),
  `status` (`reserved`/`pending`/`active`/`failed`), `dns_verified_at`, `activated_at`, `created_at`

`type=subdomain` is the default website address (our subdomain). `type=custom` is the custom
website address (the hostname they supply).

## Indexes

Unique: `tenants.clerk_org_id`, `tenants.website_address`, `website_addresses.hostname`.
