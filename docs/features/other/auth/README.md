# Auth

Identity, sign-in, Clerk organizations, and tenant resolution — a mostly-internal feature with a small
owner-facing surface (`/me`, `/me/organization`). The schema lives in
[data-model.md](data-model.md).

Clerk owns contractor identity, sign-in, and Clerk organizations. Placis never builds password auth.

> Clerk proves who the contractor is and which Clerk organization they belong to. Placis decides what tenants
> they can access and what actions they can perform.

## Tenant == Clerk organization (1-1)

- `tenants.clerk_org_id` (unique) is the only tenant entry point. No org chooser, no selected-org
  cookie, no client-controlled tenant selector.
- The API verifies the Clerk session/JWT, builds `Principal{userID, orgID, platformRole}`, and
  resolves the tenant from `orgID`.
- `/me` returns `{user, platform_role, tenant}` — a single `TenantRead` or `null` (the
  "not onboarded/paid" signal).
- Signed-in with no Clerk organization → provision one via `POST /api/v1/me/organization` (Clerk
  `createOrganization`); the frontend then calls `clerk.setActive({ organization })` so sign-in
  tokens carry the Clerk organization claim. The Clerk organization is named after the **person** (the account owner), and
  this intentionally differs from the **tenant** name, which is the business — the two are distinct
  concepts and never share a name field.
- Deleted surfaces (do not resurrect): `/me/orgs`, `/me/tenants`, `/me/selected-org`,
  `placis_selected_org` cookie, `POST /api/v1/tenants`, `PATCH /api/v1/tenants/{slug}`,
  `.../memberships/*` CRUD.

## Clerk SDK

Use the official **`github.com/clerk/clerk-sdk-go/v2`** for everything Clerk-side; do not hand-roll
JWT/JWKS verification or Clerk data types.

- **Sign-in verification** — `client.Sessions().Verify(ctx, token)` fetches/caches JWKS, checks
  clock skew + audience, and maps the sign-in's Clerk organization claim to `ActiveOrganizationID`. App code only
  maps that result into `Principal`; it does not decode or validate tokens itself.
- **Clerk organization provisioning** — `client.Organizations().Create(...)` (with `CreatedBy`) for
  `POST /api/v1/me/organization`; the creator becomes `org:admin` automatically.
- No other Clerk Backend API surface is used; tenant/membership/role state stays in Postgres.

## Tenant context resolution

Resolved once per request from one of:

1. authenticated Clerk organization,
2. public site hostname,
3. website preview token,
4. onboarding session token.

Services take `tenantID` explicitly.

## Roles

`tenant_memberships.role`: `owner`. Platform admins work across tenants through Clerk's **native
impersonation** (sign in as a contractor from the Clerk Dashboard or Backend API, which records an
`actor` on the Clerk session for the audit trail); Placis does not build its own impersonation
mechanism.

- [testing.md](testing.md) — the auth/tenancy E2E tests
