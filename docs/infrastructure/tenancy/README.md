# Auth

Identity, sign-in, Clerk organizations, and tenant resolution — a
mostly-internal feature with a small owner-facing surface (`GET /v1/me`).
The schema lives in [persistence.md](persistence.md). Named functions:
[architecture.md](architecture.md). HTTP: [api.md](api.md). Files:
[infrastructure file trees](../file-trees.md).

Clerk owns identity. Placis never builds password auth.

> Clerk proves who the owner is and which Clerk organization they belong
> to. Placis decides what tenants they can access and what actions they
> can perform.

## Mapping

- **Data tenant** = `auth.tenants`. `tenant_id` on every tenant-owned
  row.
- **Clerk organization** = that tenant, **1-1** (`tenants.clerk_org_id`
  unique). Name and logo are the **business**, not the owner’s personal
  name.
- **Clerk users** to a tenant (and its Clerk org) are **1-many**
  (`tenant_memberships`). Unique `clerk_user_id`: one Google account,
  one tenant. Currently we insert one owner; extra office members are
  **TBD**.
- **Clerk user** = **owner** (the person). Not “contractor”. First write
  of the name is `founder_name`. After that the owner can change it in
  the Clerk UI in the app. They sign in with **OAuth** (Sign in with
  Google).

An **unactivated** tenant exists from business lookup. An **activated**
tenant is that same row after website activation (`status=active`).
`/me` may return unactivated `TenantRead` after org attach. CMS opens
only when `status=active`.

No org chooser, no selected-org cookie, no tenant CRUD.

## Tenant locators

Resolved once per request from one of:

1. Clerk org claim → `tenants.clerk_org_id` (unactivated **or** active,
   after checkout / `setActive`)
2. Contractor `Host` → `website_addresses` or
   `{website_prefix}.preview.placis.com` → `websites` → `tenant_id`
3. Onboarding session token (GET unpublished; must not PATCH)
4. Unpaid Clerk JWT → `onboarding_sessions.clerk_user_id` (PATCH / Voice
   on the app origin **before** org attach)

Not a sixth HTTP auth mode: still Clerk JWT. Services take `tenantID`
explicitly.

## Clerk SDK

Use the official **Clerk Go SDK** (`github.com/clerk/clerk-sdk-go`,
current stable major). App code maps `Sessions().Verify` into
`Principal`; it does not decode or validate tokens itself.

- `Sessions().Verify` — sign-in verification
- `Users().Create` (and update on first bind) — `CreateClerkUser`;
  name from `founder_name` on that first write only; later overridable
  in the Clerk UI in the app; email is the OAuth account email
- `Organizations().Create` — `CreateClerkOrganization`; name from the
  business; image from the **business logo** when present; `CreatedBy`
  that Clerk user

Checkout and 09 **call** `AttachClerkOrganization` (persist
`tenants.clerk_org_id`). There is no `POST /v1/me/clerk-organization`.
Checkout and `GET /v1/me` return `clerk_org_id` when attached. The
frontend `clerk.setActive` if the Clerk session has no org yet so later JWTs
carry the org claim. Clerk **Membership optional** (not required):
unpaid OAuth exists before org attach. Membership required would force
a Clerk organization at sign-in (banned).

## HTTP

Routes: [api.md](api.md). One public Route: `GET /v1/me`. Health:
[HTTP conventions](../../general-architecture/api.md).

Signed-out `/cms` uses `AuthGate` → `/login` (OAuth, no name fields).
The 09 **modal island** is the same Sign in with Google on the preview
website address / pay strip. `LoginPage` stays; `OrgProvisionStep` does not.

Do not resurrect: `POST /v1/tenants`,
`PATCH /v1/tenants/{website_prefix}`, `.../memberships/*` CRUD,
`/me/orgs`, `/me/tenants`, `/me/selected-org`,
`POST /v1/me/clerk-organization`. CMS website routes are
[website HTTP](../../features/website/api.md).

## Roles

`tenant_memberships.role`: `owner`. Currently one owner insert per
tenant; the table is 1-many members per tenant. Unique `clerk_user_id`
(one Google account, one tenant). Extra office / admin members with
**equal** permissions are **TBD** (whether we build them). Do not add
a second role or invite HTTP.

Platform admins work across tenants through Clerk's **native
impersonation** in prod (sign in as a contractor from the Clerk
Dashboard or Backend API, which records an `actor` on the Clerk
session). Deferred as a Placis product; Placis does not build its own
mechanism or write `audit_events` for it.

- [architecture.md](architecture.md) — named functions, locators, `GetMe`
- [testing.md](testing.md) — humatest tenancy, two-tenant, Vitest, Playwright
- [frontend-debloat.md](frontend-debloat.md) — `frontend-3` port: Clerk
  gate, OAuth, `/me`
