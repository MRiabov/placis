# Auth `frontend-2` port — what to reduce

Status: planning (port instructions, not shipped UI).

## Target

[README.md](README.md), [architecture.md](architecture.md),
[persistence.md](persistence.md), [api.md](api.md),
[testing.md](testing.md). Shared rules:
[planning index](../../../../planning/frontend-debloat.md).

Website activation Clerk + Stripe is owned by
[onboarding](../../onboarding/frontend-debloat.md).

## Code today

- `frontend-2/src/shared/auth/` — `AuthGate.tsx`, `AuthProvider.tsx`,
  `LoginPage.tsx`, `OrgProvisionStep.tsx`, `authRoutes.ts`.
- Don't say organization: `frontend-2/src/shared/api/org.ts` —
  `POST /api/v1/me/organization`.
- Don't say client: `openapi-fetch` helper in
  `frontend-2/src/shared/api/client.ts` + Clerk Bearer +
  `credentials: "include"`.
- `getCurrentCmsSession` → `GET /v1/me` in `cms.ts`.
- `CmsRoute` redirects to `/onboarding` unless `/me` tenant status is
  `active`.
- `CmsAccountMenu` opens the Clerk **business** org profile (settings,
  not a switcher).
- Login path: `/login/$` (`app/router/index.tsx`).
- Don't say setup: e2e `e2e/auth/clerk-auth.spec.ts`,
  `clerk-auth.setup.ts`, `cms-auth.setup.ts`.

## Keep

- Clerk around the CMS and website activation. No password auth.
- `AuthGate` when a publishable key is set (`isClerkConfigured`).
  Parity / look renders may pin `VITE_CLERK_PUBLISHABLE_KEY: ""`
  (no-auth). That is not the auth E2E.
- `/login` and the 09 modal island: **Sign in with Google** (OAuth).
  No name / workspace / magic-link fields.
- `/me` as `{owner, platform_role, tenant, pending_clerk_org_id}`.
  CMS-open is `status === "active"`, not tenant non-null.
- `/cms` with no active tenant → onboarding.
- `setActive` from checkout `clerk_org_id` or
  `MeRead.pending_clerk_org_id`.
- `CmsAccountMenu` = Clerk **business** org profile, not a switcher.

## Delete

- `OrgProvisionStep` and its tests.
- Don't say organization: comments or copy that treat Clerk’s
  choose-organization task as a product chooser. Don't say
  organization: `/login/create/tasks/choose-organization` is Clerk
  plumbing, not a Placis org switcher.
- Any selected-org cookie helper.

## Do not port

- Org chooser, `placis_selected_org` cookie, `/me/orgs`, `/me/tenants`,
  `/me/selected-org`.
- `POST /v1/tenants`, `PATCH /v1/tenants/{website_prefix}`,
  memberships CRUD, invites.
- Custom impersonation (platform admins use Clerk native
  impersonation).
- `POST /v1/me/clerk-organization` / `/v1/me/organization`.

## Retarget

| Today | Constrained API |
| --- | --- |
| `GET /v1/me` | `MeRead`; CMS-open is `status === "active"` |
| Don't say organization: `POST /api/v1/me/organization` | **Delete.** Checkout / 09 **call** `AttachClerkOrganization`; frontend `setActive` from `clerk_org_id` / `pending_clerk_org_id` |

## Don't say / rename

- Don't say organization (bare): **Clerk organization**.
- Don't say user: contractor / owner / website visitor as appropriate.
- Don't say session (bare): sign-in, Clerk session, or onboarding
  session.

## Tests

- Keep `AuthGate.test.tsx`. Delete `OrgProvisionStep.test.tsx`.
- `e2e/auth/clerk-auth.spec.ts` — OAuth modal (Sign in with Google, no
  name fields); assert the chooser does **not** appear. PR job mints
  **one** Testing Token and reuses it
  ([testing.md](testing.md)).
- Local e2e uses a **fresh port**.

## Done when

- No chooser, no selected-org cookie, no tenant CRUD, no
  OrgProvisionStep.
- `/me` + OAuth match [README.md](README.md).
- Auth e2e does not lock predecessor route names.
