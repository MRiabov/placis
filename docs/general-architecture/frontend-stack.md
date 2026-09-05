# Frontend stack

`frontend-3` is the owner CMS and onboarding app. Types come from the served
`/openapi.json` (`openapi-typescript` + `openapi-fetch`). Predecessor OpenAPI
is not a typegen source.

Greenfield. Delete `frontend-2/` before the first owner-UI implementation.
Do not open `frontend-2`, copy from it, or use it as a reference.
[ADR](ADR.md) 3. Withdrawn port lists:
[planning/frontend-debloat.md](../planning/frontend-debloat.md). UI rules:
[frontend.md](frontend.md). Look: [`apps/demo/`](../../apps/demo/README.md).

| Layer | Choice |
| --- | --- |
| App | Vite + React |
| Routing / data | TanStack Router / Query |
| Auth | Clerk |
| API types | `openapi-typescript` from `/openapi.json`; `openapi-fetch` + Clerk token in `src/shared/api/` |
| Folders | `src/generated/` (types); `src/features/onboarding/`; `src/features/cms/` |

Website preview (the unpaid website editor) is
`/onboarding/preview-and-edit/` in `frontend-3`. The preview website address
is `apps/contractor-website`
([website Cloudflare](../features/website/cloudflare.md)): static HTML in R2,
same app as live. `/onboarding/preview` is the wait carousel in this app, then
the browser navigates to `/onboarding/preview-and-edit/`.

The file-size guard applies to `frontend-3` too
([CI and delivery](ci-cd.md)).

## Dependencies

Same policy as the [backend stack](backend-stack.md): latest stable of Vite,
React, TanStack, Clerk, typegen, and the rest of this app’s packages.
Greenfield — do not freeze an older major in these docs. Do not add
Dependabot, Renovate, or other automated dependency PRs. Bump `frontend-3`
(and shared JS: `packages/website-components`, contractor website, Placis
website) about every two weeks as a deliberate pass.
