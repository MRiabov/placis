# Auth `frontend-2` port — what to reduce

Status: planning (port instructions, not shipped UI).

## Target

[README.md](README.md), [persistence.md](persistence.md), [api.md](api.md),
[testing.md](testing.md). Shared rules:
[planning index](../../../../planning/frontend-debloat.md).

Website activation Clerk + Stripe is owned by
[onboarding](../../onboarding/frontend-debloat.md).

## Code today

- `frontend-2/src/shared/auth/` — `AuthGate.tsx`, `AuthProvider.tsx`,
  `LoginPage.tsx`, `OrgProvisionStep.tsx`, `authRoutes.ts`.
- Don't say organization: `frontend-2/src/shared/api/org.ts` — `POST /api/v1/me/organization`.
- Don't say client: `openapi-fetch` helper in `frontend-2/src/shared/api/client.ts` + Clerk Bearer +
  `credentials: "include"`.
- `getCurrentCmsSession` → `GET /v1/me` in `cms.ts`.
- `CmsRoute` redirects to `/onboarding` unless `/me` tenant status is `active`.
- `CmsAccountMenu` opens the Clerk organization profile (settings, not a switcher).
- Login path: `/login/$` (`app/router/index.tsx`).
- Don't say setup: e2e `e2e/auth/clerk-auth.spec.ts`, `clerk-auth.setup.ts`, `cms-auth.setup.ts`.

## Keep

- Clerk around the CMS and website activation. No password auth.
- `AuthGate` when a publishable key is set (`isClerkConfigured`). Parity / CI
  may pin `VITE_CLERK_PUBLISHABLE_KEY: ""` (no-auth renders).
- `OrgProvisionStep` — create the **one** Clerk organization, then
  `clerk.setActive`. Not a chooser.
- `/me` as the CMS-open signal: `{owner, platform_role, tenant}`; tenant only
  when `status=active`. Authenticated but not activated → `tenant: null`.
- `/cms` with no active tenant → onboarding.

## Delete

- Don't say organization: comments or copy that treat Clerk’s choose-organization task as a product
  chooser. Don't say organization: `/login/create/tasks/choose-organization` is Clerk plumbing, not a
  Placis org switcher.
- Any selected-org cookie helper.

## Do not port

- Org chooser, `placis_selected_org` cookie, `/me/orgs`, `/me/tenants`,
  `/me/selected-org`.
- `POST /v1/tenants`, `PATCH /v1/tenants/{website_prefix}`,
  memberships CRUD.
- Custom impersonation (platform admins use Clerk native impersonation).
- Clerk testing-token flows in CI unless explicitly asked.

## Retarget

| Today | Constrained API |
| --- | --- |
| `GET /v1/me` | same shape; tenant only if active |
| Don't say organization: `POST /api/v1/me/organization` | `POST /v1/me/clerk-organization` |

## Don't say / rename

- Don't say organization (bare): **Clerk organization**.
- Don't say user: contractor / owner / website visitor as appropriate.
- Don't say session (bare): sign-in, Clerk session, or onboarding session.

## Tests

- Keep `AuthGate.test.tsx`, `OrgProvisionStep.test.tsx`.
- `e2e/auth/clerk-auth.spec.ts` — assert the chooser does **not** appear; retarget
  stubs off predecessor `website/editor/business-profile` if the path changes.
- Local e2e uses a **fresh port**.

## Done when

- No chooser, no selected-org cookie, no tenant CRUD from this app.
- `/me` + provision match [README.md](README.md).
- Auth e2e does not lock predecessor route names.
