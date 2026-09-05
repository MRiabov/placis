# Owner CMS and onboarding — greenfield (`frontend-3`)

Status: the `frontend-2` port is **withdrawn**. Decision:
[general-architecture ADR](../general-architecture/ADR.md) 3.

`frontend-2` is deleted before the first owner-UI implementation. Do not open
it. Do not copy from it. Do not keep-versus-delete against it. Per-feature
`frontend-debloat.md` files are withdrawn stubs; they are not implementation
instructions.

## Start from

- Screens and fields: each feature’s `frontend.md`, plus
  [cross-cutting UI](../general-architecture/frontend.md)
- Look: [`apps/demo/`](../../apps/demo/README.md) (mocks only; not product
  code)
- Stack: [frontend-stack.md](../general-architecture/frontend-stack.md)
- Types: Go `/openapi.json` only. Predecessor OpenAPI is not a typegen
  source.

## First owner-UI implementation PR

1. Delete the `frontend-2/` tree.
2. Add `frontend-3/` empty (Vite + React + TanStack Router / Query + Clerk +
   `openapi-fetch`).
3. Retarget CI, Don’t-say `--frontend`, and Playwright to `frontend-3/`.
4. Implement screens from `frontend.md`, not from leftover `frontend-2`
   modules.

## Do not

- Read `frontend-2/` (git is enough if something must be recovered)
- Port dumped predecessor CSS, the right-hand editing panel, Save controls,
  voice-first client interview, or predecessor OpenAPI types
- Promote `apps/demo` to the product app (no auth, no API, fake canvas)
- Rebuild website component visuals; the website component catalog stays in
  `packages/website-components` ([contractor website cuts](../features/website/contractor-website-debloat.md))

## Withdrawn cut lists

These files no longer instruct a port. Implement from that feature’s
`frontend.md`:

| File | Feature screens |
| --- | --- |
| [onboarding](../features/onboarding/frontend-debloat.md) | [onboarding frontend](../features/onboarding/frontend.md) |
| [website](../features/website/frontend-debloat.md) | [website frontend](../features/website/frontend.md) |
| [CMS](../general-architecture/frontend-debloat.md) | [CMS frontend](../general-architecture/cms/frontend.md) |
| [details](../features/business-profile/details/frontend-debloat.md) | [details frontend](../features/business-profile/details/frontend.md) |
| [projects](../features/business-profile/projects/frontend-debloat.md) | [projects frontend](../features/business-profile/projects/frontend.md) |
| [certifications and reviews](../features/business-profile/certifications-and-reviews/frontend-debloat.md) | [certifications and reviews frontend](../features/business-profile/certifications-and-reviews/frontend.md) |
| [ads](../features/ads/ad-generation/frontend-debloat.md) | [ads frontend](../features/ads/ad-generation/frontend.md) |
| [leads](../features/other/leads/frontend-debloat.md) | [leads frontend](../features/other/leads/frontend.md) |
| [media library](../features/other/media/frontend-debloat.md) | [media library](../features/other/media/README.md) |
| [auth](../features/other/auth/frontend-debloat.md) | [auth](../features/other/auth/README.md) |
| [contractor website port](../features/website/port-contractor-website.md) | Worker API cutover (not the owner SPA) |
| [contractor website cuts](../features/website/contractor-website-debloat.md) | Keep the website component catalog; write a thin Worker |
