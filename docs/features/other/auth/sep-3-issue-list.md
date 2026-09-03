# Sep 3 issue list — Auth

Punch list from the 2026-09-03 unused-spec audit. Not canonical. Line
numbers are as of that audit. Fix the cited spec, then delete the item.
Delete this file when empty.

Deprecated org APIs are **not** to-implement. They only appear in “do
not create” lists. Do not resurrect them.

## High

1. **`MeRead.platform_role` is unconsumed and self-contradictory**
   Issue: DTO. Action: drop until an admin surface exists.
   Where:

   - [api.md](api.md) lines 18, 22 (`none` / `platform_admin`)
   - [api.md](api.md) Must-not: dump Clerk claims besides `clerk_org_id`
   - [frontend-debloat.md](frontend-debloat.md) line 41
   - No persistence column; [README.md](README.md) (platform admins use
     Clerk impersonation)

2. **Onboarding ADR 22 still names `POST /v1/me/clerk-organization`**
   Issue: contradiction (owned in onboarding ADR). Action: in-place
   correction line on ADR 22, matching ADR 25.
   Where: [../../onboarding/ADR.md](../../onboarding/ADR.md) (decision 22
   vs 25); this feature’s [api.md](api.md) already lists the route
   under Do not create.

## Medium

3. **`tenants.status=suspended` has no writer**
   Issue: persistence. Action: drop from the enum until
   `SuspendTenant` exists, or keep as a defensive `RequireActiveTenant`
   value and say so once.
   Where: [persistence.md](persistence.md) (`suspended`; “Do **not**
   invent `SuspendTenant`”); [api.md](api.md) (`TenantRead.status`);
   [architecture.md](architecture.md) (`RequireActiveTenant`).

4. **`tenant_memberships` 1-many for TBD office members**
   Issue: persistence. Action: keep if extra members are near-term;
   otherwise note the `GetMe` cost (must not assume unique
   `clerk_user_id`).
   Where: [README.md](README.md); [persistence.md](persistence.md);
   [architecture.md](architecture.md).

5. **Impersonation audit event has no writer**
   Issue: audit. Action: stop claiming it in
   [../../../general-architecture/audit.md](../../../general-architecture/audit.md)
   (with refunds and data export/deletion).
   Where: [README.md](README.md) (Placis builds no impersonation;
   Clerk records the actor). [architecture.md](architecture.md)
   (`Principal.actor` “Not on HTTP”) has no consumer if audit does not
   write it.

## Keep

- `GET /v1/me` as the only public auth route (`owner`, `tenant`,
  `clerk_org_id`).
- Do-not-create: `/me/orgs`, `/me/tenants`, selected-org cookie,
  `POST /v1/tenants`, `PATCH /v1/tenants/{website_prefix}`, memberships
  CRUD, `POST /v1/me/clerk-organization`.
- Four tenant locators, each with a named caller.
- `AttachClerkOrganization` / `InsertOwnerMembership` /
  `ResolveUnpaidTenantFromClerkUser` with 1–2 callers each.
- `clerk_org_id` on both `/me` and checkout (checkout body can be
  dropped).
