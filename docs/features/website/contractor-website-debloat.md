# Contractor website port — what to reduce

Status: planning (port instructions, not shipped UI).

The Astro Worker is **small**. The predecessor quality problem is mostly leftover names,
unconstrained JSON, a duplicated island script, and the **website component package**
(blog, careers, `JsonObject` props). Import it, then cut — do not rewrite.

## Target

[architecture.md](architecture.md), [cloudflare.md](cloudflare.md),
[manifest.md](manifest.md), [frontend.md](frontend.md).
Shared rules: [planning index](../../../planning/frontend-debloat.md).
CMS/editor cuts stay in [frontend-debloat.md](frontend-debloat.md).

Code today lives in the import slice (`apps/contractor-website`,
`packages/website-components`), not yet on `main`. Paths below are that import's
names.

## Code today

**Astro Worker (`apps/contractor-website/src/`, ~18 files):**

- Live: `pages/[...path].astro` — still `GET /api/v1/public/site/resolve` when R2
  misses. Spec: live GET is Cache then R2; it never calls Go.
- Website preview: `pages/preview/[previewToken]/[...path].astro`.
- R2 + Cache: `middleware.ts`.
- Don't say public site: `lib/publicSiteApi.ts` (~189 lines) — unconstrained
  `cache`, Don't say shell: `app_shell`, `entry_link: Record<string, unknown>`.
- Don't say claim: `pages/preview-actions/.../action.ts` actions
  Don't say claim: `activate` / `claim` / `request-changes`.
- Duplicate browser JS: `scripts/publicEnhancements.ts` (~943 lines) **and**
  Don't say public site: `components/PublicSiteClientBehaviors.astro` (~337 lines) — same top-menu / carousel
  wiring twice.
- Don't say blueprint: `lib/devBlueprints.ts` + `pages/dev-blueprints/` local
  catalog browser.
- `lib/rootFiles.ts` uses `JsonRecord = Record<string, unknown>`.
- `robots.txt.ts`, `favicon.ico.ts`.

**Website component package (`packages/website-components`):**

- Renderer: `PublicSiteRenderer.tsx`, `registry.ts` (~50 website components).
- `types.ts` — `JsonObject` for `props`, `seo`, `collections`.
- Blog: `registry/posts/list`, `registry/posts/detail`.
- Careers website templates: Don't say blueprint: `blueprints/careers/green-gold/`.
- Don't say proof: `registry/proof/*` (bar, logo_strip, testimonials,
  accreditations, …) — product language is certifications / reviews / projects.
- Don't say blueprint: `src/blueprints/**` (website templates in the predecessor
  catalog).

## Keep

- One Worker for every tenant. Astro document + React islands. No per-tenant
  build. Bundle-boundary: this app must not import `frontend-2`.
- Live serve: Cache then R2 `latest/` (`middleware.ts` path). Go never emits HTML.
- Website preview: `/preview/{token}/` renders unpublished rows via
  `GET /api/v1/public/site/resolve` or the preview module route — **this** is the
  per-request render.
- Registry families in first pass: top menu, hero, services, gallery, content,
  contact, website forms (`form.lead` and similar), footer, FAQ, process, CTA,
  privacy, service area. Projects and certifications paint from the slim
  `website.v1` lists ([manifest.md](manifest.md)).
- Website form POST to `/api/v1/public/forms/{id}/submit` (and uploads).
- Islands for top menu / carousel **once** (delete the duplicate).
- Website component contracts as typed structs in `catalog/` (Go + TS consume
  the same JSON). Do not keep a second freeform `props` bag as the contract.

## Delete

- `registry/posts/**` and any blog `page_type`.
- Don't say blueprint: `blueprints/careers/**` (no `website_career_*` in this rewrite).
- One of the duplicated enhancement scripts (`publicEnhancements.ts` vs
  `PublicSiteClientBehaviors.astro` — keep a single module).
- Don't say claim: `claim` preview action. Website activation lives on
  `frontend-2` `/preview/{token}` (Clerk then Stripe). This Worker may redirect
  to that route; it must not invent a second activation API.
- `request-changes` unless a later spec adds it (not in the current onboarding /
  website frontend).
- Unconstrained `JsonObject` / `JsonRecord` / `[key: string]: unknown` on
  resolve/preview DTOs. `website.v1` is a closed Go struct
  ([manifest.md](manifest.md)).
- Don't say shell: `app_shell` on resolve. Don't say runtime: `placis:runtime`
  Don't say runtime: meta (bundle/shared-across-tenants flags can stay as data, not a "runtime"
  product name).
- Live `[...path].astro` calling Go `resolve` after a published miss — R2 miss
  is 404.

## Do not port

- CRM / quotes / invoices / jobs / workflows / crew on website preview
  (predecessor preview-sandbox types).
- Blog, careers, leftover website-template-apply CMS API wrappers (those are also in
  the `frontend-2` website file).
- A second HTML engine or per-contractor Cloudflare deploy
  ([cloudflare.md](cloudflare.md)).
- Don't say public site as the app name. Don't say private app for `frontend-2`.

## Retarget

| Today | Constrained contract |
| --- | --- |
| `GET /api/v1/public/site/resolve` on every live miss | live: R2 only; resolve is website preview / tests |
| `GET /api/v1/preview/{token}/module/website` | keep for website preview; typed `website.v1` |
| Don't say claim: redirect `?claim=1` to `frontend-2` | website activation on `/preview/{token}` |
| `formSubmitBasePath` → `/api/v1/public/forms` | same group; website lead capture |
| Don't say blueprint: `packages/.../blueprints/` | `catalog/` website templates + website component contracts |
| `JsonObject` props | per-`component_id` catalog struct |
| `tenant_slug` | website address / tenant id as the Go DTO names it |

## Don't say / rename

- Don't say public site / public-site: contractor website (`apps/contractor-website`).
- Don't say shell: `PublicSiteRenderer`, `public-site-shell`, `app_shell`,
  Don't say public site: `PublicSiteClientBehaviors`.
- Don't say blueprint: `dev-blueprints`, `src/blueprints/` → website template
  catalog (local preview route may remain **dev-only**, renamed).
- Don't say proof: `public.proof.*` family → certifications / reviews / projects
  website components as the catalog names them.
- Don't say claim: preview-action and `privateAppPreviewUrl` query.
- Don't say runtime: meta / env names that call this app a runtime.
- Don't say setup: `setupPublicNavigation` / `setupPublicCarousels` in the
  Don't say setup: island script (rename to ordinary `bind*` helpers).
- Don't say private app: `PUBLIC_SITE_PRIVATE_APP_BASE_URL` / `privateAppBaseUrl`
  → CMS / website preview origin (`frontend-2`). Default must not be old
  `frontend/` on 5173.

## Tests

- Bundle-boundary check (`contractor-website:bundle-boundary`) stays.
- One E2E is the website feature test: website publication → live R2 keys + fake
  purge → website rollback → website form ([testing.md](testing.md)).
- Website preview E2E stays with onboarding (token page, no TTL).
- Do not add Clerk testing-token CI on this Worker.

## Done when

- Live GET never calls Go.
- No blog / careers in the registry or website templates.
- One island-enhancement module.
- Manifest and website-slot props are catalog-typed, not `JsonObject`.
- Don't say public site, shell, blueprint, proof, claim, or runtime in this app
  Don't say public site: and the package.
- Import PR can land thin; remaining cuts can follow in the same feature's later
  PRs, driven by this file.
