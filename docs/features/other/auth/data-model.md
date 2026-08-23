# Auth — data model

Identity and tenancy tables. Conventions: [data-model conventions](../../../general-architecture/data-model.md).

A tenant row exists only after website activation. Before that, `/me` has no tenant; the
onboarding session status is anything except `activated`.

- `tenants` — `id` uuid pk, `clerk_org_id` unique, `website_address` unique (reserved subdomain
  label, **fixed at website activation**, used as the R2 prefix), `name`, `status`
  (`active`/`suspended`), `created_at`, `updated_at`
- `tenant_memberships` — `id`, `tenant_id` fk, `clerk_user_id`, `role`, `created_at`;
  unique `(tenant_id, clerk_user_id)`
- `website_addresses` — `id`, `tenant_id` fk, `hostname` unique, `type` (`subdomain`/`custom`),
  `status` (`reserved`/`pending`/`active`/`failed`), `is_primary` bool,
  `cloudflare_custom_hostname_id` (nullable, `type=custom`), `dcv_txt_name`, `dcv_txt_value`,
  `cloudflare_hostname_status`, `cloudflare_ssl_status`, `dns_verified_at`, `activated_at`,
  `created_at`

`type=subdomain` is the website address host (FQDN in
[cloudflare.md](../../website/cloudflare.md); R2 prefix is `tenants.website_address`). Show it as
the default live host after website publication. `type=custom` is the custom website address
(the hostname they supply). `is_primary` marks sitemap and canonical: the subdomain host until a
`type=custom` row is `active`, then that custom website address.

Custom Hostnames columns are written by **Connect website address** (CMS modal), not website
publication. See [cloudflare.md](../../website/cloudflare.md).

## Indexes

Unique: `tenants.clerk_org_id`, `tenants.website_address`, `website_addresses.hostname`.
At most one `is_primary=true` per `tenant_id`.
