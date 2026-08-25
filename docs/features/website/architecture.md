# Website — Architecture

How a website is built, edited, given website publication, and rendered. Logic first; the structs and DTOs fall
out of this.

## The content model

A website is a list of **website pages**; a website page is an ordered list of **website
sections**; a website section is one **website component** given props and editable website slots.

- **website page** — website page path, title, type (`home`/`service`/`contact`/`legal`), SEO, and
  an ordered list of website sections. Status is `unpublished` or `archived`. The live set is the
  active website publication, not a page-level published flag.
- **website section** — an instance of a website component (`component_id`), with its props and
  design, at a position on the website page. Two site-wide look sections (`page_id` null) paint
  the top menu and footer (logo, density); link trees live on `website.menus`.
- **website slot** — a named editable value inside a website section: text, rich text, image, link,
  list, or json. Reviews on a website section are selected profile reviews
  (`website_slot_reviews`), not a `slot_type`. A project gallery is a list/json of project ids.
- **menus** — one `website.menus` row per tenant: `top_menu` and `footer` JSON trees (page / text /
  URL nodes, depth 2) plus `show_phone` / `show_email`.
- **media asset** — a photo, logo, or document in the media library.

## The website component model

A website component is a named building block (`public.hero.image`, `public.services.grid`, …).
Each has a **contract**: the props it accepts, the website slots it exposes, and its **design
controls** — small enum/bool fields (e.g. `density`: `compact`/`comfortable`/`spacious`) with
allowed values. The contract is one typed struct dumped to JSON under `catalog/` — the website
editor and the renderer read the same structs. Only registered website components render.

The first-pass website template catalog and website component catalog live in
`packages/website-components` (from the predecessor), not a short list written here. Go loads those
JSON sidecars for save and website publication validation; it must not hand-duplicate the struct
shapes. A later dump of the same typed structs lives under `catalog/`.
Website templates and website component contracts are static website template catalog data,
kept as website template catalog revisions — not database rows.

## Apply the website template

A **website template** lists the website pages and website sections a typical site of that trade
needs. Applying the website template writes those onto the business profile:

1. take the details from the business profile (services, service areas, certifications, projects, contact);
2. pick the website template and website styles (one bounded LLM call, heuristic fallback);
3. create unpublished `website_pages` / `website_sections` / `website_slots` rows — website
   placeholders (`{{business_name}}`, `{{marketing_phone}}`, …) stay in the unpublished website, resolving
   at website publication;
4. pick or generate media assets (prefer real project photos; generate only when approved);
5. validate against website component contracts, the company registry, marketing statements, links,
   website forms, SEO.

The result is an unpublished website, never a live website. Website copy generation is onboarding
[06](../onboarding/pipeline/06-website-copy-generation.md) — async, same tools, not this editor.

**Where website templates come from**: mostly by taking inspiration from existing websites —
decomposing them into patterns (website page structure + website section composition), then
**switching the content** (profile details fill the website placeholders) and **remixing the
colors** (a website style catalog preset) for a new business. They are not hand-authored from
scratch. Trade does not pick the website template 1:1.

## Editing (the website editor)

The website editor is one workspace with three surfaces:

- **Canvas** — renders the selected website page live from its website sections.
- **Workspace** — left column. Selectable **workspace items** (website pages, media library,
  website styles, top menu, footer). Drop files onto the media library item to upload
  ([media library](../other/media/README.md)).
- **Editing panel** — edits the selected website section (website slots, design) and website-page
  SEO, website forms, and website versions.

Edits mutate the in-memory website editor projection first, then PATCH copies them to unpublished
rows. There is no Save action; do not re-render from the PATCH response. Text copies out on
click-off, not while typing; the frontend safety timer paces sends (500ms, coalesce of dirty
keys, typically under 10 KB) so `429` stays a backstop. PATCH is not the whole unpublished
website; reject over 64 KB. Leaving while a copy-out is in flight confirms discard. Opening
the website editor hydrates undo/redo from website edit history; Ctrl+Z is in-memory, then
PATCH. See [editing.md](editing.md). Website assistant edits follow [assistant.md](assistant.md):
Ask first waits for Apply / Reject (website editor PATCH, then record metadata); instant apply
is the website editor PATCHing as tools succeed. Website publication writes a
website version. **Details** (the business profile), **Projects**, **Certifications and
reviews**, and the **media library** are website page content (placeholders, project galleries,
reviews, photos). They are separate entities, edited on their own screens — not as website slots
in the website editor. The edit loop is in [editing.md](editing.md). Screens: [frontend.md](frontend.md).

## Website assistant

The LLM edits the unpublished website through the **website assistant** — hard-typed, validated,
parallel tool calls (`update_slot`, `cleanup_image`, `generate_image`, `update_menus`, website
section/website styles/SEO/website form/website page actions). Same attach / crop / focal /
cleanup as the owner UI. Two configs: plan vs continuous, instant apply vs Ask first. See
[assistant.md](assistant.md).

## Website publication

Website publication walks the unpublished website, validates every website section against its
website component contract, resolves the `{{var}}` website placeholders from the business profile
(see [variables.md](variables.md)), copies tenant website styles from `website_settings`, and
writes one `website_publications` row holding the published website copy as `website_manifest`
(a `website.v1` website manifest — [manifest.md](manifest.md)). That row is a website version.
The website manifest is the read model — the renderer only ever reads the active website version.
Website rollback reactivates an earlier **owner** website version. Onboarding-written rows are
never website-rollback targets.

Edits to Details, Projects, certifications and reviews, website styles, or the unpublished
website do not change the live website until the next website publication.

Website publication is not a Cloudflare deploy. One shared contractor-website application serves
every tenant. The website publication control is a destination dropdown
(`{website_address}.preview.placis.com`, a connected custom website address, or New URL). Host
routing uses `website_addresses` reserved at onboarding 07. Serve path, R2 keys, cache
purge, custom website address, and local Worker: [cloudflare.md](cloudflare.md).
`apps/contractor-website` is in this repo; remaining cuts:
[contractor-website-debloat.md](contractor-website-debloat.md). API cutover:
[port-contractor-website.md](port-contractor-website.md). Next is R2 `latest/` +
website publication HTML.

## Contractor website (separate Astro app)

Live websites and website previews are served by a **separate Astro + React app**
(`apps/contractor-website`), not the website editor. Website components live in
`packages/website-components`.

At **website publication**, that app renders each live website page from the active
`website_manifest` (`website.v1`) and writes HTML to R2 `latest/`. A live GET is Cache then R2.
It never calls Go. Onboarding 07/08 call this same write (strip on, then strip off). There is no
per-request unpublished render and no `/preview/{token}/`.

Astro owns routing, the Astro document, prerender-at-publication, and metadata; React owns
interactive islands. One application serves every contractor website — no per-tenant build —
and imports only the website component package (a bundle-boundary check blocks imports from
`frontend-2`).

The onboarding wait teaser (`/onboarding/preview`) reuses website components in `frontend-2` for
**one complete website section** at a time. It is not this app and not the host.

## Voice (later)

The website assistant can be driven by voice (see
[voice-agent.md](../../general-architecture/voice-agent.md)): the agent clarifies what to change
— which website page/website section, new website page vs. copy edit, attach vs. generate an
image — then emits one structured instruction resolved through the same governed website assistant
tools (`update_slot`, `cleanup_image`, `generate_image`, website styles changes, website section
reorder, SEO/website form updates, website page creation, website-publication-readiness). Two
modes — plan (approve a concrete plan first) and continuous (bounded direct edits) — share the
same tool surface. Voice grants no extra authority.

## Where things stand

- website page: `unpublished` / `archived`
- website publication: `published → rolled_back / archived`
