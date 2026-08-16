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
**contract**: the props it accepts and the slots it exposes. The contract is one typed struct dumped
to JSON under `catalog/` — the editor and the renderer read the same structs. Only registered
components render.

## Generation

A **blueprint** (a full-site template for a trade) lists the pages and sections a typical site of
that trade needs. Generation applies the blueprint to the business profile:

1. pick the trade blueprint;
2. for each page and section in it, create draft `website_pages` / `website_sections` /
   `content_slots` rows;
3. placeholders (`{{business_name}}`, `{{phone}}`, …) stay in the draft — they resolve at publish;
4. the result is a draft, never published.

## Editing (the editor)

The editor is one workspace with three surfaces:

- **Canvas** — renders the selected page live from its sections.
- **Workspace** — Pages / Media / Styles / Menu: what is on the site.
- **Inspector** — edits the selected section: its props, its slots, its design.

Every edit writes a new page version; nothing is edited in place. AI edits arrive as proposals (a
diff), never a direct write. The **Details** view (business profile) and **Media** (image editing)
are their own standalone parts, not page content.

## Refinement (AI)

AI proposes edits through governed tool calls — `update_slot` for copy, `generate_image` only when
no approved source fits. Each proposal is validated against the component contract and lands as a
reviewable change the owner accepts or rejects.

## Publish

Publish walks the draft, validates every section against its component contract, resolves
placeholders from the business profile, and writes one `website_publications` row holding the frozen
`site_manifest` (a `site.v1` manifest: pages → sections → props). The manifest is the read model —
the renderer only ever reads the active publication. Rollback reactivates an earlier publication.

## Render

The public site resolves the active publication by host + path, reads the `site_manifest`, and
renders each section by its `component_id` (Astro shell, React islands). One shared runtime serves
every tenant — no per-tenant build.

## State

- page: `draft → approved → published`
- publication: `published → rolled_back / archived`
