# Auth HTTP

Conventions: [HTTP conventions](../../../general-architecture/api.md). Identity,
Clerk organization, tenant on `/v1/me`. Health is
[cross-cutting](../../../general-architecture/api.md).

## Serve only types on HTTP

None of these fields are `jsonb`. `TenantRead` fields: id, website prefix, name,
status, `subscription_status` (`active` / `canceled` / `none`). Clerk ids are
not on these responses; the Clerk SDK verifies the sign-in. The website editor
uses `subscription_status` to block Publish without a billing GET.

## Routes

### GET /v1/me

- **Auth:** Clerk JWT. Tenant is resolved from the attached Clerk org
  (`status` may be `unactivated` or `active`).
- **Callers:** `frontend-2` CMS gate (`AuthGate`, `/cms` redirect) and unpaid
  website preview (CMS-closed when `status !== active`).
- **Response:** `{ owner, platform_role, tenant }`. `tenant` is `TenantRead`
  when a Clerk org is attached. After sign-in but no org → `tenant: null`.
  After `POST /v1/me/clerk-organization` on an unactivated tenant →
  `TenantRead` with `status=unactivated`. After 09 → `status=active`.
- **Must not:** return an org chooser list; treat `/me.tenant` non-null as CMS
  open.

### POST /v1/me/clerk-organization

- **Auth:** Clerk JWT (the person after sign-in). Not an org chooser.
- **Callers:** `frontend-2` `OrgProvisionStep` after sign-in on the
  website-activation strip (so checkout can attach a Clerk subject) and after 09
  so `clerk.setActive` has an org. [README.md](README.md).
- **Idempotency-Key:** yes.
- **Behavior:** create the **one** Clerk organization (`Organizations().Create`)
  and attach `tenants.clerk_org_id`. Named after the person; tenant name is the
  business. Do not insert a second tenant.
- **Must not:** set `tenants.status=active` (website activation / Stripe webhook
  owns that); accept a Clerk organization id from `frontend-2` as a chooser.

## Do not create

- `/me/orgs`, `/me/tenants`, `/me/selected-org`
- Don't say organization: `/me/organization` (predecessor name)
- `POST /v1/tenants`, `PATCH /v1/tenants/{website_prefix}`
- memberships CRUD
- custom impersonation (Clerk native impersonation only)
- `placis_selected_org` cookie
