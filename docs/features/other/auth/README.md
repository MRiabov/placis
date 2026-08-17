# Auth

Identity, sessions, organizations, and tenant resolution — a mostly-internal feature with a small
user-facing surface (`/me`, `/me/organization`). The schema lives in
[data-model.md](../../general-architecture/data-model.md).

Clerk owns user identity, sessions, and organizations. Placis never builds password auth.

> Clerk proves who the user is and which organization they belong to. Placis decides what tenants
> they can access and what actions they can perform.

## Tenant == Clerk org (1-1)

- `tenants.clerk_org_id` (unique) is the only tenant entry point. No org chooser, no selected-org
  cookie, no client-controlled tenant selector.
- The API verifies the Clerk session/JWT, builds `Principal{userID, orgID, platformRole}`, and
  resolves the tenant from `orgID`.
- `/me` returns `{user, platform_role, tenant}` — a single `TenantRead` or `null` (the
  "not onboarded/paid" signal).
- Signed-in with no Clerk org → provision one via `POST /api/v1/me/organization` (Clerk
  `createOrganization`); the frontend then calls `clerk.setActive({ organization })` so session
  tokens carry the org claim. The Clerk org is named after the **person** (the account owner), and
  this intentionally differs from the **tenant** name, which is the business — the two are distinct
  concepts and never share a name field.
- Deleted surfaces (do not resurrect): `/me/orgs`, `/me/tenants`, `/me/selected-org`,
  `placis_selected_org` cookie, `POST /api/v1/tenants`, `PATCH /api/v1/tenants/{slug}`,
  `.../memberships/*` CRUD.

## Clerk SDK

Use the official **`github.com/clerk/clerk-sdk-go/v2`** for everything Clerk-side; do not hand-roll
JWT/JWKS verification or Clerk data types.

- **Session verification** — `client.Sessions().Verify(ctx, token)` fetches/caches JWKS, checks
  clock skew + audience, and maps the session's org claim to `ActiveOrganizationID`. App code only
  maps that result into `Principal`; it does not decode or validate tokens itself.
- **Org provisioning** — `client.Organizations().Create(...)` (with `CreatedBy`) for
  `POST /api/v1/me/organization`; the creator becomes `org:admin` automatically.
- No other Clerk Backend API surface is used; tenant/membership/role state stays in Postgres.

## Tenant context resolution

Resolved once per request from one of:

1. authenticated Clerk org,
2. public site hostname,
3. signed preview token,
4. onboarding session token.

Services take `tenantID` explicitly.

## Roles

`tenant_memberships.role`: `owner`, `admin`, `office`, `crew`, `read_only`. Platform admins work
across tenants through Clerk's **native impersonation** (sign in as a user from the Clerk Dashboard
or Backend API, which records an `actor` on the session for the audit trail); Placis does not build
its own impersonation mechanism.

- [testing.md](testing.md) — the auth/tenancy E2E tests
