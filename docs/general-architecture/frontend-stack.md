# Frontend stack

`frontend-2` is the owner CMS and onboarding app. Types come from the served `/openapi.json`
(`openapi-typescript` + `openapi-fetch`). Predecessor OpenAPI is not a typegen source.

Reuse and debloat; do not rebuild. Port index:
[planning/frontend-debloat.md](../planning/frontend-debloat.md). Cross-cutting cuts:
[frontend-debloat.md](frontend-debloat.md). UI rules:
[frontend.md](frontend.md).

| Layer | Choice |
| --- | --- |
| App | Vite + React |
| Routing / data | TanStack Router / Query |
| Auth | Clerk |
| API types | `openapi-typescript` from `/openapi.json`; `openapi-fetch` + Clerk token in `src/shared/api/` |
| Folders | `src/generated/` (types); `src/features/onboarding/`; `src/features/cms/` |

Website preview is **not** a `frontend-2` folder. It is `apps/contractor-website` in preview mode
at `{website_address}.preview.placis.com` ([website Cloudflare](../features/website/cloudflare.md)).
Same app as live; preview mode is the per-request unpublished render (`/preview/{token}/`).
Leftover `frontend-2/src/features/preview/` is predecessor CMS code to drop.

The file-size guard applies to `frontend-2` too ([CI and delivery](ci-cd.md)).

## Dependencies

Same policy as the [backend stack](backend-stack.md): latest stable of Vite, React, TanStack,
Clerk, typegen, and the rest of this app’s packages. Greenfield — do not freeze an older major
in these docs. Do not add Dependabot, Renovate, or other automated upgrade PRs. Bump
`frontend-2` (and shared JS: `packages/website-components`, contractor website, Placis website)
about every two weeks as a deliberate pass.
