# Website — Architecture

How a website is built, edited, given website publication, and rendered. Logic first; the structs and DTOs fall
out of this.

## The content model

A website is a list of **website pages**; a website page is an ordered list of **website
sections**; a website section is one **website component** given props and editable website slots.

- **website page** — website page path, title, type (`home`/`service`/`landing`/`legal`), SEO, and
  an ordered list of website sections.
- **website section** — an instance of a website component (`component_id`), with its props and
  design, at a position on the website page.
- **website slot** — a named editable value inside a website section: text, rich text, image, link,
  list, or json.
- **media asset** — a photo, logo, or document in the media library.

## The website component model

A website component is a named building block (`public.hero.image`, `public.services.grid`, …).
Each has a **contract**: the props it accepts, the website slots it exposes, and its **design
controls** — small enum/bool knobs (e.g. `density`: `compact`/`comfortable`/`spacious`) with
allowed values. The contract is one typed struct dumped to JSON under `catalog/` — the website
editor and the renderer read the same structs. Only registered website components render.

## Apply the website template

A **website template** lists the website pages and website sections a typical site of that trade
needs. Applying the website template writes those onto the business profile:

1. take the details from the business profile (services, service areas, certifications, projects, contact);
2. pick the website template and website styles (one bounded LLM call, heuristic fallback);
3. create unpublished `website_pages` / `website_sections` / `website_slots` rows — website
   placeholders (`{{business_name}}`, `{{phone}}`, …) stay in the unpublished website, resolving
   at website publication;
4. pick or generate media assets (prefer real project photos; generate only when approved);
5. validate against website component contracts, the company registry, marketing claims, links,
   website forms, SEO.

The result is an unpublished website, never a live website. Website copy generation is a later
step.

**Where website templates come from**: mostly by taking inspiration from existing websites —
decomposing them into patterns (website page structure + website section composition), then
**switching the content** (profile details fill the website placeholders) and **remixing the
colors** (a website style catalog preset) for a new business. They are not hand-authored from
scratch. Trade does not pick the website template 1:1.

## Editing (the website editor)

The website editor is one workspace with three surfaces:

- **Canvas** — renders the selected website page live from its website sections.
- **Workspace** — Website pages / Media library / Website styles / Header and footer: what is on
  the site.
- **Inspector** — edits the selected website section: its props, its website slots, its design.

Every edit writes a new website page version; nothing is edited in place. Website assistant edits
arrive as proposals (a diff), never a direct write. The **Details** view (business profile) and
**Media library** (image editing) are their own standalone parts, not website page content. The
full edit → backend → re-render loop is in [editing.md](editing.md).

## Website assistant

The LLM edits the unpublished website through the **website assistant** — hard-typed, validated,
parallel tool calls (`update_slot`, `generate_image`, website section/theme/SEO/website form/website page
actions), in plan mode (default) or continuous mode. See [assistant.md](assistant.md).

## Website publication

Website publication walks the unpublished website, validates every website section against its
website component contract, resolves the `{{var}}` website placeholders from the business profile
(see [variables.md](variables.md)), and writes one `website_publications` row holding the
published website copy as `website_manifest` (a `website.v1` website manifest: website pages →
website sections → props). The website manifest is the read model — the renderer only ever reads
the active website publication. Website rollback reactivates an earlier website publication.

## Contractor website (separate Astro app)

Live websites and website previews are served by a **separate Astro + React app**
(`apps/public-site`), not the website editor. It calls `/api/v1/public/site/resolve` with
the incoming host + website page path, reads the active `website_manifest`, and renders each
website section by its `component_id` through the shared `public-site-components` package — Astro
owns routing, page shell, static/prerender, and metadata; React owns interactive islands.

One application serves every contractor website — no per-tenant build — and imports only the
website component package (a bundle-boundary check blocks imports from `frontend-2`).

Website previews use the same application: the onboarding website preview renders the unpublished
website behind a preview token, so the contractor sees the real website
components before website activation.

## Voice (later)

The website assistant can be driven by voice (see
[voice-agent.md](../../general-architecture/voice-agent.md)): the agent clarifies what to change
— which website page/website section, new website page vs. copy edit, generate vs. select an
image — then emits one structured instruction resolved through the same governed website assistant
tools (`update_slot`, website styles changes, website section reorder, SEO/website form updates,
website page creation, website-publication-readiness). Two modes — plan (approve a concrete plan
first) and continuous (bounded direct edits) — share the same tool surface. Voice grants no extra
authority.

## Where things stand

- website page: `unpublished → approved → published`
- website publication: `published → rolled_back / archived`
