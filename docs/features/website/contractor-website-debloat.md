# Contractor website port — what to reduce

Status: remaining cuts (first delete pass is on `main`).

API/typegen process: [port-contractor-website.md](port-contractor-website.md). This file is
the **cut list** (keep / delete / Don’t-say).

This is **not** the `frontend-2` call. Split the tree:

- **Website component package — keep and cut.** React website components, themes, and CSS.
  Do not rebuild the visuals.
- **Astro Worker — write thin.** Live GET is Cache then R2; an R2 miss is 404. Website
  preview token path is gone; 07 writes the same static `latest/` as later CMS website
  publication.

Do not rewrite the registry JSX/CSS from scratch. Glue (`JsonObject` props, `asRecord` /
`text()` helpers) retargets onto `catalog/` structs; that is plumbing, not a visual rewrite.

## Target

[architecture.md](architecture.md), [cloudflare.md](cloudflare.md),
[manifest.md](manifest.md), [frontend.md](frontend.md), [styles.md](styles.md).
Shared rules: [planning index](../../../planning/frontend-debloat.md).
CMS/editor cuts stay in [frontend-debloat.md](frontend-debloat.md).

## Code today

**Astro Worker (`apps/contractor-website/src/`, ~800 lines):**

- Live: `pages/[...path].astro` — 404 when R2 misses. Does not call Go.
- Website preview: leftover `pages/preview/[previewToken]/[...path].astro` — drop.
- R2 + Cache: `middleware.ts` (skips `/preview/`).
- One island module: Don't say public site: `PublicSiteClientBehaviors.astro`.
- `lib/publicSiteApi.ts` — still calls predecessor `GET /v1/preview/{token}/module/website`
  and leftover predecessor types. Leftover env names remain. Retarget in
  [port-contractor-website.md](port-contractor-website.md).

**Website component package (`packages/website-components`):**

- Renderer: `PublicSiteRenderer.tsx`, `registry.ts` (in-scope families).
- `types.ts` — still `JsonObject` for `props`, `seo`, `collections`.
- Don't say proof: `registry/proof/*` — product language is certifications / reviews /
  projects.
-   Don't say blueprint: `src/blueprints/**` — website templates (JSON). No DESIGN.md
  or per-folder markdown sidecars.
- `src/styles.css` concatenates every website style catalog preset plus shared dumps
  (`green-gold-sections.css`, `timbermill-content.css`, …). Live HTML and `frontend-2`
  both import that one sheet.

## Keep

**Package (do not rewrite):**

- Registry families in first pass: top menu, hero, services, gallery, content,
  contact, website forms (`form.lead` and similar), footer, FAQ, process, CTA,
  privacy, service area. Projects and certifications paint from the slim
  `website.v1` lists ([manifest.md](manifest.md)).
- Website component contracts as typed structs in `catalog/` (Go + TS consume
  the same JSON). Do not keep a second freeform `props` bag as the contract.
- Typed preset tokens in `src/themes/<preset>/index.ts`. Visual rules:
  [styles.md](styles.md).

**Worker:**

- One Worker for every tenant. Astro document + React islands. No per-tenant
  build. Bundle-boundary: this app must not import `frontend-2`.
- Live serve: Cache then R2 `latest/`. Go never emits HTML. R2 miss is 404.
- Website-activation strip island on unactivated hosts (Clerk + Stripe POST
  `activation/checkout`). 08 HTML has no strip.
- Drop leftover `/preview/{token}/` and `GET /v1/public/site/resolve`.
- Website form POST to `POST /v1/website-forms/{form_id}/submissions` (and uploads).
- Islands for top menu / carousel **once**.

## Delete / still cut

- Unconstrained `JsonObject` / `[key: string]: unknown` on resolve/preview DTOs.
  `website.v1` is a closed Go struct ([manifest.md](manifest.md)).
- Don't say shell: leftover `app_shell` types if any remain. Don't say runtime:
  Don't say runtime: `placis:runtime` meta (bundle/shared-across-tenants flags can stay as data).

## Do not port

- CRM / quotes / invoices / jobs / workflows / crew on website preview.
- Blog, careers, leftover website-template-apply CMS API wrappers (those are also in
  the `frontend-2` website file). DESIGN.md and per-folder markdown sidecars (dropped).
- A second HTML engine or per-contractor Cloudflare deploy
  ([cloudflare.md](cloudflare.md)).
- Predecessor OpenAPI, a full-CMS typegen, leftover predecessor types,
  casts, or `/v1/preview/{token}/module/website`.
- Don't say public site as the app name. Don't say private app for `frontend-2`.

## Retarget

| Today | Constrained contract |
| --- | --- |
| One concatenated `styles.css` (every preset) | CSS owned under `src/themes/<preset>/`; shared `src/styles/` only for CSS not gated on a preset class. Live publication links or inlines **that** preset only. CMS may load the selected preset (or all, if style switching must be instant). |
| `GET /v1/preview/{token}/module/website` | drop leftover resolve. No predecessor casts. |
| `formSubmitBasePath` → `/api/v1/public/forms` | `POST /v1/website-forms/{form_id}/submissions` |
| Don't say blueprint: `packages/.../blueprints/` | `catalog/` website templates + website component contracts |
| `JsonObject` props | per-`component_id` catalog struct |
| `tenant_slug` | `website_prefix` / tenant id as the Go DTO names it |

## Don't say / rename

- Don't say public site / public-site: contractor website (`apps/contractor-website`).
- Don't say shell: `PublicSiteRenderer`, `public-site-shell`,
  Don't say public site: `PublicSiteClientBehaviors`.
- Don't say blueprint: `src/blueprints/` → website template catalog.
- Don't say proof: `public.proof.*` family → certifications / reviews / projects
  website components as the catalog names them.
- Don't say runtime: meta / env names that call this app a runtime.
- Don't say setup: `setupPublicNavigation` / `setupPublicCarousels` in the
  Don't say setup: island script (rename to ordinary `bind*` helpers).
- Don't say private app: leftover `PUBLIC_SITE_*` env names → CMS / website preview
  origin (`frontend-2`). Default must not be old `frontend/` on 5173.

## Tests

- Bundle-boundary check (`contractor-website:bundle-boundary`) stays.
- One E2E is the website feature test: website publication → live R2 keys + fake
  purge → website rollback → website form ([testing.md](testing.md)).
- Website preview E2E stays with onboarding (host + strip, no token).
- Do not add Clerk testing-token CI on this Worker.

## Done when

- Live GET never calls Go (done).
- No blog / careers in the registry or website templates (done).
- One island-enhancement module (done).
- No DESIGN.md or per-folder markdown sidecars (done).
- Each website style catalog preset owns its CSS; live HTML loads one preset.
- Manifest and website-slot props are catalog-typed, not `JsonObject`.
- Don't say public site, shell, blueprint, proof, claim, or runtime in this app
  Don't say public site: and the package.
