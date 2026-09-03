# Auth — persistence

Clerk identity and tenant membership. Conventions:
[persistence conventions](../../../general-architecture/persistence.md)
(Postgres schema `auth`). Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers). Go
packages `internal/auth/` (Clerk SDK → `Principal`) and
`internal/tenancy/` (SQL).

Hostnames for the live contractor website are
[website persistence](../../website/persistence.md)
(`website_addresses`), not this file.

A tenant row is created at business lookup (`status=unactivated`). 08
reserves `website_prefix` (`SharePreviewWebsiteAddress`) or 09 does if
they never shared. Website activation **upgrades** that row
(`status=active`); it does not insert a second tenant. `/me` may
return unactivated `TenantRead` after Clerk org attach. CMS still
opens only when `status=active`.

The only tenant↔org **1-1** is data tenant ↔ Clerk organization
(`tenants.clerk_org_id` unique). Clerk users on a tenant (and its
Clerk org) are **1-many** (`tenant_memberships`). A Clerk user is on
**at most one** tenant (`clerk_user_id` unique).

## Tables

### `auth.tenants`

- **Columns:** `id` uuid pk, `clerk_org_id` text unique nullable,
  `website_prefix` text unique nullable, `name` text, `status` text,
  `subscription_status` text, `country` text, `created_at`
  timestamptz, `updated_at` timestamptz
- **Enums:** `status` → `unactivated` / `active`;
  `subscription_status` → `active` / `canceled` / `none`; `country` →
  `ie` / `gb` / `us`
- **Uniques:** nullable unique `clerk_org_id`; nullable unique
  `website_prefix`
- **Written by:** `LookupBusiness` (insert, `country`);
  `AttachClerkOrganization` (`clerk_org_id`);
  `SharePreviewWebsiteAddress` / River job kind `website_activation`
  (`website_prefix`, `status=active`); billing
  (`subscription_status`)
- **Notes:** `clerk_org_id` is 1-1 with the Clerk organization (the
  business). May be set while `unactivated` (checkout). Null until
  checkout/09. `name` is the business display/legal name when known,
  else empty until business research fills it. `website_prefix` is the
  DNS label + R2 key; FQDN is a `website_addresses` row. `country` is
  Find country at business lookup (Voice region fallback). Do **not**
  store remaining usage credit here — billing owns the AI use ledger
  ([billing](../../billing/persistence.md)). Do **not** invent
  `SuspendTenant` or a `suspended` status. Cancelled billing is
  `subscription_status`, not `status`.

### `auth.tenant_memberships`

- **Columns:** `id` uuid pk, `tenant_id` fk, `clerk_user_id` text,
  `role` text, `created_at` timestamptz
- **Enums:** `role` → `owner`
- **Uniques:** `clerk_user_id`
- **Written by:** `InsertOwnerMembership` (09)
- **Notes:** 1-many members per tenant (do not unique `tenant_id`).
  Unique `clerk_user_id`: one Google account, one tenant. Currently
  one owner row; extra office / admin members (equal permissions) are
  **TBD**. Do not add a second role or invite HTTP.

## Indexes

Unique: `tenants.clerk_org_id`, `tenants.website_prefix` (nullable;
many unactivated rows may have null — Postgres unique allows that).
Unique: `tenant_memberships.clerk_user_id`.
