# Auth HTTP

Conventions: [HTTP conventions](../../../general-architecture/api.md). Identity,
Clerk organization, tenant on `/v1/me`. Health is
[cross-cutting](../../../general-architecture/api.md).

## OpenAPI opacity

None of these fields are `jsonb`. `TenantRead` is a closed struct (id, website address, name,
status). Clerk ids are not on these responses; the Clerk SDK verifies the sign-in.

## Complete

### GET /v1/me

- **Auth:** Clerk JWT. Tenant is resolved only when `status=active`.
- **Callers:** `frontend-2` CMS gate (`AuthGate`, `/cms` redirect).
- **Response:** `{ owner, platform_role, tenant }`. `tenant` is `TenantRead` only when
  `status=active`. After sign-in but not website-activated → `tenant: null` even if an
  unactivated tenant exists for an onboarding session.
- **Must not:** return unactivated tenants; return an org chooser list.

### POST /v1/me/clerk-organization

- **Auth:** Clerk JWT (the person after sign-in). Not an org chooser.
- **Callers:** `frontend-2` `OrgProvisionStep` at website activation / first login as specified
  in [README.md](README.md). Then `clerk.setActive`.
- **Idempotency-Key:** yes.
- **Behavior:** create the **one** Clerk organization (`Organizations().Create`), attach it to
  the existing unactivated tenant, set `status=active`. Named after the person; tenant name is
  the business. Do not insert a second tenant.
- **Must not:** accept a Clerk organization id from `frontend-2` as a chooser.

## Do not create

- `/me/orgs`, `/me/tenants`, `/me/selected-org`
- Don't say organization: `/me/organization` (predecessor name)
- `POST /v1/tenants`, `PATCH /v1/tenants/{website_address}`
- memberships CRUD
- custom impersonation (Clerk native impersonation only)
- `placis_selected_org` cookie
