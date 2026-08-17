# Website — Architecture

How a website is generated, edited, published, and rendered. Logic first; the structs and DTOs fall
out of this.

## The content model

A site is a list of **pages**; a page is an ordered list of **sections**; a section is one
**component** given props and editable slots.

- **page** — path, title, type (`home`/`service`/`landing`/`legal`), SEO, and an ordered list of
  sections.
- **section** — an instance of a component (`component_id`), with its props and design, at a
  position on the page.
- **slot** — a named editable value inside a section: text, rich text, image, link, list, or json.
- **asset** — a photo, logo, or document in the media library.

## The component model

A component is a named building block (`public.hero.image`, `public.services.grid`, …). Each has a
**contract**: the props it accepts, the slots it exposes, and its **design controls** — small
enum/bool knobs (e.g. `density`: `compact`/`comfortable`/`spacious`) with allowed values. The
contract is one typed struct dumped to JSON under `catalog/` — the editor and the renderer read the
same structs. Only registered components render.

## Generation

A **blueprint** (a full-site template for a trade) lists the pages and sections a typical site of
that trade needs. Generation applies the blueprint to the business profile — **population**:

1. assemble the stable facts (services, areas, proof assets, contact, details);
2. pick the trade blueprint and propose page structure, section composition, copy, CTA hierarchy,
   style tokens, image-slot intent, SEO;
3. create draft `website_pages` / `website_sections` / `content_slots` rows — placeholders
   (`{{business_name}}`, `{{phone}}`, …) stay in the draft, resolving at publish;
4. pick or generate image assets (prefer real proof media; generate only when approved);
5. validate against component contracts, the registry, claims, links, forms, SEO.

The result is a draft, never published.

**Where blueprints come from**: mostly by taking inspiration from existing websites — decomposing
them into patterns (page structure + section composition), then **switching the content** (profile
facts fill the placeholders) and **remixing the colors** (a style preset) for a new business. They
are not hand-authored from scratch.

## Editing (the editor)

The editor is one workspace with three surfaces:

- **Canvas** — renders the selected page live from its sections.
- **Workspace** — Pages / Media / Styles / Menu: what is on the site.
- **Inspector** — edits the selected section: its props, its slots, its design.

Every edit writes a new page version; nothing is edited in place. AI edits arrive as proposals (a
diff), never a direct write. The **Details** view (business profile) and **Media** (image editing)
are their own standalone parts, not page content. The full edit → backend → re-render loop is in
[editing.md](editing.md).

## Refinement (the assistant)

The LLM edits the draft through the **CMS assistant** — hard-typed, validated, parallel tool calls
(`update_slot`, `generate_image`, section/theme/SEO/form/page actions), in plan mode (default) or
continuous mode. See [assistant.md](assistant.md).

## Publish

Publish walks the draft, validates every section against its component contract, resolves the
`{{var}}` placeholders from the business profile (see [variables.md](variables.md)), and writes one
`website_publications` row holding the frozen `site_manifest` (a `site.v1` manifest: pages →
sections → props). The manifest is the read model — the renderer only ever reads the active
publication. Rollback reactivates an earlier publication.

## Public runtime (separate Astro app)

Published sites and previews are served by a **separate Astro + React app** (`apps/public-site`),
not the private editor. It calls `/api/v1/public/site/resolve` with the incoming host + path, reads
the active `site_manifest`, and renders each section by its `component_id` through the shared
`public-site-components` package — Astro owns routing, page shell, static/prerender, and metadata;
React owns interactive islands.

One shared runtime serves every tenant — no per-tenant build — and imports only the public component
package (a bundle-boundary check blocks private-app imports).

Previews use the same runtime: the onboarding preview renders the draft `site_manifest` behind a
signed preview token, so the contractor sees the real components before publish.

## Voice (later)

The CMS assistant can be driven by voice (see [voice-agent.md](../../general-architecture/voice-agent.md)):
the agent clarifies what to change — which page/section, new page vs. copy edit, generate vs. select
an image — then emits one structured instruction resolved through the same governed CMS tools
(`update_slot`, theme/style changes, section reorder, SEO/form updates, page creation,
publish-readiness). Two modes — plan (approve a concrete plan first) and continuous (bounded direct
edits) — share the same tool surface. Voice grants no extra authority.

## State

- page: `draft → approved → published`
- publication: `published → rolled_back / archived`
