# Website — Architecture

How a website is built, edited, given website publication, and rendered. Logic
first; the structs and DTOs fall out of this.

## The content model

A website is a list of **website pages**; a website page is an ordered list of
**website sections**; a website section is one **website component** given props
and editable website slots.

- **website page** — website page path, title, type
  (`home`/`service`/`contact`/`legal`), SEO, and an ordered list of website
  sections. Status is `unpublished` or `archived`. The live set is the active
  website publication, not a page-level published flag.
- **website section** — an instance of a website component (`component_id`),
  with its props and design, at a position on the website page. Two site-wide
  look sections (`page_id` null) paint the top menu and footer (logo, density);
  link trees live on `website.menus`.
- **website slot** — a named editable value inside a website section: text, rich
  text, image, link, list, or json. Each **reviews website section** has its own
  ordered `website_slot_reviews` from the pool (capped by that website
  component; not `slot_type`). Ads use **top reviews**. A project gallery is a
  list/json of project ids.
- **menus** — one `website.menus` row per tenant: `top_menu` and `footer` JSON
  trees (page / text / URL nodes, depth 2) plus `show_phone` / `show_email` /
  `show_contact`.
- **media asset** — a photo, logo, or document in the media library.

## The website component model

A website component is a named building block (`public.hero.image`,
`public.services.grid`, …). Each has a **contract**: the props it accepts, the
website slots it exposes, and its **design controls** — small enum/bool fields
(e.g. `density`: `compact`/`comfortable`/`spacious`) with allowed values. The
contract is one typed struct dumped to JSON under `catalog/` — the website
editor and the renderer read the same structs. Only registered website
components render. A reviews website component’s contract includes the max
number of reviews that layout paints (examples 3 / 6 / 8 — not a closed product
list).

The first-pass website template catalog and website component catalog live in
`packages/website-components` (from the predecessor), not a short list written
here. Go loads those JSON sidecars for save and website publication validation;
it must not hand-duplicate the struct shapes. A later dump of the same typed
structs lives under `catalog/`. Website templates and website component
contracts are static website template catalog data, kept as website template
catalog revisions — not database rows.

## Apply the website template

A **website template** lists the website pages and website sections a typical
site of that trade needs. Applying the website template writes those onto the
business profile:

1. take the details from the business profile (services, service areas,
   certifications, projects, contact);
2. pick the website template and website styles (one bounded LLM call, heuristic
   fallback);
3. create unpublished `website_pages` / `website_sections` / `website_slots`
   rows — website placeholders (`{{business_name}}`, `{{marketing_phone}}`, …)
   stay in the unpublished website, resolving at website publication;
4. pick or generate media assets (prefer real project photos; generate only when
   approved);
5. create reviews website sections with empty `website_slot_reviews` (keep the
   website section, no fake copy). After the unpublished website exists and the
   pool is ready, one bounded LLM call picks an ordered list
   **per reviews website section** from the pool (page path, `page_type`,
   service if service page, `component_id`, max from that website component
   contract). Overlap across sections is allowed. Length ≤ that max. Do **not**
   copy **top reviews** onto every section;
6. validate against website component contracts, the company registry, marketing
   statements, links, website forms, SEO.

The result is an unpublished website, never a live website. Website copy
generation is onboarding [06](../onboarding/pipeline/06-website-copy-generation.md) — async, same tools, not this editor.

**Where website templates come from**: mostly by taking inspiration from
existing websites — decomposing them into patterns (website page structure +
website section composition), then **switching the content** (profile details
fill the website placeholders) and **remixing the colors** (a website style
catalog preset) for a new business. They are not hand-authored from scratch.
Trade does not pick the website template 1:1.

## Editing (the website editor)

The website editor is one workspace with two surfaces plus global nav
([design decision record](design-decision-record.md) 16):

- **Canvas** — renders the selected website page live from its website sections.
  On a wide screen this is the wide column; on a small screen the canvas is the
  screen until they open destinations.
- **Workspace** — on a **narrow** screen the rail is a **bottom bar** (Sites
  only); the list opens above it. On a **wide** screen it is a left rail.
  Selectable **workspace items** (website pages, SEO, website styles, website
  versions). The list opens when a rail item is selected; default is rail-only.
  **Website versions** is pinned to the bottom of the rail. **SEO** is its own
  rail panel and always shows the current website page. There is no media
  library rail item; attach from Content when an image is selected
  ([media library](../other/media/README.md)). Top menu and footer are not workspace items.
- **Content** — not a rail item. Opens from a canvas website section or image
  and **replaces** the workspace list. **Closed union** keyed by website
  component (website slots by default; special layouts for reviews / top menu /
  footer / website forms / projects). No right-hand editing panel. No Edit
  handle. No Design tab (look is Website styles). No Website versions tab. No
  Website forms tab.

Edits mutate the in-memory website editor projection first, then PATCH copies
them to unpublished rows. There is no Save action; do not re-render from the
PATCH response. Text copies out on click-off, not while typing; the frontend
safety timer paces sends (500ms, coalesce of dirty keys, typically under 10 KB)
so `429` stays a backstop. PATCH is not the whole unpublished website; reject
over 64 KB. Leaving while a copy-out is in flight confirms discard. Opening the
website editor hydrates undo/redo from website edit history; Ctrl+Z is
in-memory, then PATCH. See [editing.md](editing.md). Assistant edits follow [assistant.md](assistant.md):
Ask first waits for Apply / Reject (website editor PATCH, then record metadata);
instant apply is the website editor PATCHing as tools succeed. Website
publication writes a website version. **Details**, **Projects**,
**Certifications and reviews**, and the **media library** are website page
content (placeholders, project galleries, reviews, photos) edited on
[business profile](../business-profile/README.md) and [media library](../other/media/README.md) screens. They are separate entities.
Certifications and reviews is the picker for **all reviews** and for pinning
**top reviews** (ads). The website editor reviews Content edits
**that website section’s** ordered `website_slot_reviews` (add from all reviews,
remove, reorder; cap from the website component). They are not generic website
slots. The edit loop is in [editing.md](editing.md). Screens: [frontend.md](frontend.md).

## Website editor tools (assistant)

The LLM edits the unpublished website through the **assistant** — hard-typed,
validated, parallel tool calls (`update_slot`, `update_reviews`,
`cleanup_image`, `generate_image`, `update_menus`, `update_details`, website
section/website styles/SEO/website form/website page actions). Same attach /
crop / focal / cleanup as the owner UI. `update_details` is the shared Details
tool (one implementation; Ads generator calls it too). The shared notification
Revert undoes that increment. Assistant look and HTTP: [assistant](../assistant/README.md). Tool
registry and plan / Ask first: [assistant.md](assistant.md).

## Website publication

Website publication walks the unpublished website, validates every website
section against its website component contract, resolves the `{{var}}` website
placeholders from the business profile (see [variables.md](variables.md)), copies tenant
website styles from `website_settings`, and writes one `website_publications`
row holding the published website copy as `website_manifest` (a `website.v1`
website manifest — [manifest.md](manifest.md)). That row is a website version. The website
manifest is the read model — the renderer only ever reads the active website
version. Website rollback reactivates an earlier **owner** website version
(copies it onto `latest/`). Onboarding-written rows are never website-rollback
targets. That control is on earlier owner website versions (Website versions
workspace item and the publication dropdown), not on the live website version.
**Preview** opens the live website. Loading an owner website version into the
unpublished canvas (`GET` with `publication_id`, then PATCH) is not a Website
versions control in this UI ([api.md](api.md)). That is not website rollback.

Website publication and live website rollback require
`tenants.subscription_status=active`. If they stopped paying, the live website
is already unpublished; POST is **402** `subscription_canceled`. Website
editor PATCH still works. Usage & billing is how they pay again
([billing architecture](../billing/architecture.md)).

Edits to Details, Projects, certifications and reviews, website styles, or the
unpublished website do not change the live website until the next website
publication. Website publication bakes only **active** projects into
`website_manifest.projects[]` and `{{projects.*}}` (skip `draft`; omit draft
ids from published galleries — no 409).

Website publication is not a Cloudflare deploy. One shared contractor-website
application serves every tenant. The **Publish** dropdown lists hosts
(`{website_prefix}.preview.placis.com`, a connected website address, or New URL)
— the POST has no destination ([api.md](api.md)). Specs call the act website
publication. Host routing uses `website_addresses` reserved at onboarding
07. Serve path, R2 keys, cache purge, website address, and local Worker:
[cloudflare.md](cloudflare.md).
`apps/contractor-website` is in this repo; remaining cuts:
[contractor-website-debloat.md](contractor-website-debloat.md). API cutover:
[port-contractor-website.md](port-contractor-website.md). Next is R2 `latest/` +
website publication HTML.

## Contractor website (separate Astro app)

Live websites and website previews are served by a
**separate Astro + React app** (`apps/contractor-website`), not the website
editor. Website components live in `packages/website-components`.

At **website publication**, that app renders each live website page from the
active `website_manifest` (`website.v1`) and writes HTML to R2 `latest/`. A live
GET is Cache then R2. It never calls Go. Onboarding 07/08 call this same write
(strip on, then strip off). There is no per-request unpublished render and no
`/preview/{token}/`.

Astro owns routing, the Astro document, prerender-at-publication, and metadata;
React owns interactive islands. One application serves every contractor website
— no per-tenant build — and imports only the website component package (a
bundle-boundary check blocks imports from `frontend-2`).

The onboarding wait teaser (`/onboarding/preview`) reuses website components in
`frontend-2` for **one complete website section** at a time. It is not this app
and not the host.

## Voice

The assistant can be driven by the **voice agent** (see [voice-agent.md](../../general-architecture/voice-agent.md)). Audio
never hits Go; the browser relays `function_call` as typed HTTP; Go dispatches
the same governed website editor tools (including `update_details`). Voice
grants no extra authority. On `/cms/website`, empty composer turns the voice
agent on (DustOrb, composer hidden). Look: [design decision record](design-decision-record.md) 18.
Dispatcher: [assistant](../assistant/README.md). The agent cannot website-publish.

The product assistant also **explains the current screen** from a small
in-memory markdown knowledge base. Onboarding **client interview** voice is out;
onboarding **guide** assistant (talk them through the current onboarding screen)
is in.

## Where things stand

- website page: `unpublished` / `archived`
- website publication: `published → rolled_back / archived`
