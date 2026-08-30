# Auth

Identity, sign-in, Clerk organizations, and tenant resolution — a
mostly-internal feature with a small owner-facing surface (`/me`, Clerk
organization provisioning). The schema lives in
[persistence.md](persistence.md).

Clerk owns contractor identity, sign-in, and Clerk organizations. Placis never
builds password auth.

> Clerk proves who the contractor is and which Clerk organization they belong
> to. Placis decides what tenants they can access and what actions they can
> perform.

## Tenant vs Clerk organization

An **unactivated** tenant exists from business lookup (`status=unactivated`, no
Clerk org). An **activated** tenant is that same row after website activation
(`status=active`). `/me` returns a tenant when a Clerk org is attached,
including `status=unactivated`. CMS still opens only when `status=active`
(the unpaid / CMS-closed signal is `status !== active`, not `tenant: null`).

- Clerk organization ↔ tenant is 1-1. `tenants.clerk_org_id` (unique, nullable)
  is the entry point for CMS/API calls that use a Clerk session. Unactivated
  tenants may have an org after `POST /v1/me/clerk-organization`. No org
  chooser, no selected-org cookie, no app-controlled tenant selector.
- The API verifies the Clerk session/JWT, builds
  `Principal{userID, orgID, platformRole}`, and resolves the tenant from `orgID`
  when that org is attached. Routes that require website activation still 403
  `tenant_unactivated` when `status` is not `active`. Unpublished GET on the
  app may also use the onboarding session token. Unpaid Assistant send/Voice and
  unpublished PATCH require Clerk + unactivated tenant on the app origin.
- `/me` returns `{owner, platform_role, tenant}` — a single `TenantRead` or
  `null`. Authenticated with no Clerk org → `tenant: null`. Authenticated with
  an unactivated tenant’s org → `TenantRead` `status=unactivated`. After
  activation, a canceled subscription still returns the tenant (`status=active`,
  `subscription_status=canceled`). That is not `tenant: null`. They can edit;
  they cannot Publish until they pay again.
- Website activation (09) attaches the Clerk organization to the **existing**
  unactivated tenant and sets `status=active`. `POST /v1/me/clerk-organization`
  creates that org if needed; it does not skip pay. The frontend then calls
  `clerk.setActive` so sign-in tokens carry the Clerk organization claim. The
  Clerk organization is named after the **person** (the account owner); the
  tenant name is the business — the two never share a name field. Do not create
  a second tenant at activation.
- Deleted surfaces (do not resurrect): `/me/orgs`, `/me/tenants`,
  `/me/selected-org`, `placis_selected_org` cookie, `POST /v1/tenants`,
  `PATCH /v1/tenants/{website_prefix}`, `.../memberships/*` CRUD.

## Clerk SDK

Use the official **Clerk Go SDK** (`github.com/clerk/clerk-sdk-go`, current
stable major) for everything Clerk-side; do not hand-roll JWT/JWKS verification
or Clerk data types.

- **Sign-in verification** — the Clerk SDK client
  `Sessions().Verify(ctx, token)` fetches/caches JWKS, checks clock skew +
  audience, and maps the sign-in's Clerk organization claim to
  `ActiveOrganizationID`. App code only maps that result into `Principal`; it
  does not decode or validate tokens itself.
- **Clerk organization provisioning** — the Clerk SDK client
  `Organizations().Create(...)` (with `CreatedBy`) for the Clerk organization
  provisioning POST; the creator becomes `org:admin` automatically.
- No other Clerk Backend API surface is used; tenant memberships and roles stay
  in Postgres.

## Tenant context resolution

Resolved once per request from one of:

1. authenticated Clerk organization (active tenant only),
2. contractor website hostname,
3. onboarding session token (unactivated or active tenant for that onboarding
   session).

Services take `tenantID` explicitly.

## HTTP

Routes: [api.md](api.md). Health: [HTTP conventions](../../../general-architecture/api.md). Clerk organization provisioning is
`POST /v1/me/clerk-organization` after sign-in on the preview website address
(`Organizations().Create`); the frontend then `clerk.setActive`. That POST does
not set `status=active` — website activation (09) does.

Do not resurrect: `POST /v1/tenants`, `PATCH /v1/tenants/{website_prefix}`,
`.../memberships/*` CRUD, `/me/orgs`, `/me/tenants`, `/me/selected-org`. CMS
website routes are [website HTTP](../../website/api.md), not nested under
`/v1/tenants/{website_prefix}`.

## Roles

`tenant_memberships.role`: `owner`. Platform admins work across tenants through
Clerk's **native impersonation** (sign in as a contractor from the Clerk
Dashboard or Backend API, which records an `actor` on the Clerk session for the
audit trail); Placis does not build its own impersonation mechanism.

- [testing.md](testing.md) — the auth/tenancy E2E tests
- [frontend-debloat.md](frontend-debloat.md) — `frontend-2` port: Clerk gate, one Clerk organization,
  `/me`
