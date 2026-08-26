# `frontend-2` cross-cutting port — what to reduce

Status: planning (port instructions, not shipped UI).

## Target

[frontend.md](frontend.md) (loading placeholders), [frontend-stack.md](frontend-stack.md),
[glossary Don't say](../glossary.md). Shared rules:
[planning index](../planning/frontend-debloat.md).

Feature screens stay in that feature’s instruction file. This file is only what
no single feature owns.

## Code today

- `frontend-2/src/generated/api-types.ts` (~18 064 lines) — predecessor OpenAPI,
  including unconstrained JSON blobs and CRM sandbox types the app never
  calls.
- Don't say shell: `frontend-2/src/app/shell/index.tsx` (`AppShell` = `<Outlet />`).
- Don't say client: typed `openapi-fetch` helper in `frontend-2/src/shared/api/client.ts` (keep).
- `frontend-2/src/styles/cms/` — copied predecessor CSS (`components-01.css` …
  `05`, `dashboard.css`, `details.css`; `components-04.css` is 1134 lines).
- `frontend-2/e2e/parity/` — onboarding / CMS / details parity vs old `frontend/`
  on 5173.
- `playwright.config.ts` — `reuseExistingServer: !CI`; starts frontend-2 (5174). Starts
  `../frontend` (5173) for parity only when that tree exists. Clerk testing-token specs
  use `playwright.auth.config.ts` with `workers: 1`.

## Keep

- Vite + React + TanStack Router/Query + `openapi-fetch`.
- Per-field / per-row / per-website-slot **loading placeholders** (never a
  whole-panel swap). Do not say skeleton.
- File-size guard on `frontend-2` (&lt; 800 warn, &gt; 1200 hard error).
- `src/shared/ui/` button + dialog as they exist; do not expand shared UI in this port.

## Delete

- Unused paths in generated types once Go `/openapi.json` is the source:
  tenant-scoped website CRUD, CRM sandbox quotes/invoices/crew/workflows,
  unconstrained JSON aliases.
- Don't say shell: `src/app/shell/` — the root layout does not need that name
  (`AppOutlet` / `RootLayout` is enough).
- Parity e2e (`e2e/parity/*`) when old `frontend/` is removed — they lock
  predecessor routes.
- Careers and unused modal CSS (coordinate with details + media library files).
- Don't say setup: `src/test/fixtures/setupProfile.ts` name (onboarding fixture).

## Do not port

- CRM / operations UI (quotes, invoices, jobs, workflows, calendar, crew).
- Org chooser (auth file).
- Blog, careers, leftover website-template-apply CMS API wrappers (website file).
- Voice-first onboarding (onboarding file).
- Rebuilding the design system or adding shadcn sprawl.

## Cutover

Lockstep. First frontend-from-Go PR **switches** `frontend-2` typegen to Go
`/openapi.json` only. Predecessor OpenAPI is not a typegen source and is not
checked in as a second schema.

Unported `api/*.ts` and MSW stubs are deleted or retargeted in the same slice
that adds the Go routes. Screens with no Go route yet stay unwired, not typed
against old paths. No shims, no `as any`, no mapping layer
(predecessor types → `onboarding-sessions`), no leftover `predecessor-api-types.ts`.

Do not wait until Go has “enough” routes. The generated file must not
reintroduce predecessor-only paths (CRM sandbox, tenant-scoped website CRUD,
unconstrained blobs). Contractor website typegen is a different consumer:
[port-contractor-website.md](../features/website/port-contractor-website.md).

## Retarget

- Typegen: `openapi-typescript` from Go `/openapi.json` served by huma. CI
  generated-code freshness as in [ci-cd.md](ci-cd.md).
- Enable `go run ./cmd/ci/check-dont-say --frontend` and drop the `frontend-2/`
  pre-commit exclude on the first frontend-from-Go PR.
- Playwright product e2e: fresh port; empty publishable key only for no-auth
  parity-style renders, not as a silent attach to 5173/5174.

## Don't say / rename

- Don't say shell: `AppShell`, `CmsDashboardShell`, `OnboardingShell`, CSS
  `cms-dashboard-shell`. Don't say shell in e2e comments that call the CMS a shell.
- Don't say inspector: leftover editing-panel names (website file).
- Don't say setup: leftover folder, API, fixture, and copy (onboarding file).
- Don't say private app / private Vite app: the CMS, onboarding, or website preview (`frontend-2`).
- Don't say skeleton: loading placeholder or unpublished website, depending on
  meaning.
- Don't say runtime: do not name `frontend-2` or the contractor website a runtime.

## Tests

- Drop `e2e/parity/onboarding-parity.spec.ts`, `cms-parity.spec.ts`,
  `details-parity.spec.ts` at port cutover.
- Keep product e2e: website editor, media-library upload, website-preview visual, clerk-auth — retargeted
  per feature files.
- Vitest MSW in `src/test/msw/server.ts` must not keep predecessor onboarding
  routes after the onboarding port.

## Done when

- Generated types match the constrained Go contract (no CRM sandbox, no
  unconstrained JSON in UI-facing schemas).
- Don't say `--frontend` is on and `frontend-2/` is not excluded.
- Parity suite is gone; product e2e does not attach to the owner’s dev ports.
- Leftover layout type names are gone from `frontend-2`.
