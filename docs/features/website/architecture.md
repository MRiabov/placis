# Website — Architecture

How a website is built, edited, given website publication, and rendered.
Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).

## Named identifiers

Pipeline **Do** functions (same spelling in spec, Go, and tests):

- `SelectWebsiteTemplate` — `internal/website/templates`
  ([01](pipeline/01-select-website-template.md))
- `CopyWebsiteTemplatePages` — `internal/website/templates`
  ([02](pipeline/02-copy-website-template-pages.md))
- `GenerateWebsiteCopy` — River job kind `website_copy_generation`
  ([03](pipeline/03-website-copy-generation.md))
- `PublishWebsite` — **calls** `WebsitePublicationBlockers`, then
  `websitePublication`
  ([04](pipeline/04-website-publication.md))
- `UnpublishWebsite` — holding page on R2 `latest/` for **every** website
  on that tenant; clears `website_publications.active` on each. Billing
  **calls** this when the subscription is `canceled`.

`WebsitePublicationBlockers` is not a pipeline step. Required website
slot cannot resolve; live-path media library item not approved on
**this** website; subscription not `active`. Page-scoped or
website-scoped; `subscription_canceled` is tenant-wide. Editor
routes return `blockers[]`. `PublishWebsite` **calls** it as the
hard gate.

CMS HTTP: one function per Routes verb+noun (`GetWebsitePage`,
`UpdateWebsitePage`, `CreateWebsitePublication`, …). Tables:
[persistence.md](persistence.md). DTOs and Routes: [api.md](api.md).

## The content model

A website is a list of **website pages**; a website page is an ordered list of
**website sections**; a website section is one **website component** given props
and editable website slots. Optional-omit lists live on that website
component contract
([variables.md](variables.md#optional-omit)).

- **website page** — website page path, title, type
  (`home`/`about`/`service`/`contact`/`legal`), SEO, and an ordered list of
  website sections. Status is `unpublished` or `archived`. The live set is the
  active website publication, not a page-level published flag.
- **website section** — an instance of a website component (`component_id`),
  with its props and design, at a position on the website page. Two site-wide
  look sections (`page_id` null) paint the top menu and footer (logo, density);
  link trees live on `website.menus`.
- **website slot** — a named editable value inside a website section: text, rich
  text, image, link, list, or json. Reviews website sections resolve
  `{{reviews.1}}` … from the **ranked pool** (not a per-section list at copy
  template pages). Owner Content / `update_reviews` may later set
  `website_slot_reviews` on that section. Ads use **top reviews**. A project
  gallery is tokens (`{{projects.*}}`) until website publication resolves them.
- **menus** — one `website.menus` row per website: `top_menu` and `footer` JSON
  trees (page / text / URL nodes, depth 2) plus `show_phone` / `show_email` /
  `show_contact`.
- **media asset** — a photo, logo, or document in the media library.

Parent row: `websites` ([ADR](ADR.md) 26). A contractor may have more than
one website. Each owns unpublished pages, look sections, menus, styles,
publications, prefix, and website addresses. Business profile and media
library stay tenant-scoped. Occupancy counts every website’s template.
Owner create of another website is deferred
([new-website-creation-flow.md](new-website-creation-flow.md); **TBD**).

## The website component model

A website component is a named building block (`public.hero.image`,
`public.services.grid`, …). Each has a **contract**: props, the website
slots it exposes, and its **design controls** — small enum/bool fields
(e.g. `density`: `compact`/`comfortable`/`spacious`) with allowed values. The
contract is one typed struct dumped to JSON under `catalog/` — the website
editor and the renderer read the same structs. Only registered website
components render. A reviews website component’s contract includes the max
number of reviews that layout paints (examples 3 / 6 / 8 — not a closed product
list).

The website template catalog object and 02 mapping are
[catalog.md](catalog.md). Website component renderers live in
`packages/website-components`. Go `go:embed`s a dump of the same typed JSON
under `catalog/` (like `prompts.yaml`). It must not hand-duplicate slot keys
as Go fields and must not load `src/blueprints/` as the catalog. Extra keys
rejected. Website templates and website component contracts are static
catalog data, kept as catalog revisions — not database rows.

## Select and copy the website template

A **website template** is one catalog id. 01 writes it; 02 copies it.
From-scratch writes: [pipeline/](pipeline/README.md).
Object and mapping: [catalog.md](catalog.md).

1. take the details from the business profile (services, service areas,
   certifications, projects, contact);
2. **select website template** — occupancy within 250 km among
   production-ready website templates, then `website_id % len`
   tie-break. Website styles = that website template’s associated
   website style catalog preset. No LLM. Do not write unpublished pages
   ([01](pipeline/01-select-website-template.md));
3. **copy the website template’s pages onto the unpublished website** —
   unpublished `website_pages` / `website_sections` / `website_slots` —
   website placeholders stay, including image website slots
   (`{{images.*}}` / `{{logo_url}}`). Named services on the confirmed
   profile become service pages (one layout copied N times, N ≥ 1). Page
   set is then static. Copy site-wide catalog `top_menu` / `footer` when
   the website template includes them (`url` nodes → `website_urls`).
   Otherwise derive `website.menus` from the
   [menu constant](catalog.md#menu-constant). Do not insert
   `website_slot_reviews`. Do not bake ranked-top-4 project ids. Do not
   attach `media_asset_id`
   ([02](pipeline/02-copy-website-template-pages.md));
4. **automatic website copy generation** — prose, SEO, and **photo
   selection**: attach first when **media caption** fits that image
   website slot. Logo slots are `photo_kind=logo` only (else leave the
   token; no `generate_image`). Portrait slots attach a photo whose
   **media caption** is a person portrait, or stay empty (no
   `generate_image` of a face). Other image slots: `generate_image`
   when nothing fits.
   ([03](pipeline/03-website-copy-generation.md));
5. reviews website sections keep `{{reviews.1}}` … from the ranked pool.
   Website does not rank. River job kind `reviews_ranking_for_display`
   ([build-profile](../onboarding/pipeline/build-profile.md),
   [jobs](../../general-architecture/jobs.md)). Owner Content /
   `update_reviews` can override a section later;
6. validate against website component contracts, the company registry,
   marketing statements, links, website forms, SEO.

The result is an unpublished website, never a live website. Website copy
generation is [03](pipeline/03-website-copy-generation.md) — async, same
tools, not this editor. Do not say apply the website template for this write.

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

Edits mutate the in-memory website editor projection first
(**one per `{website_prefix}`**), then PATCH copies them to unpublished rows.
There is no Save action; do not re-render from the PATCH response. Text copies
out on click-off, not while typing; the frontend safety timer paces sends
(500ms, coalesce of dirty keys, typically under 10 KB) so `429` stays a
backstop. PATCH is not the whole unpublished website; reject over 64 KB. Leaving
while a copy-out is in flight confirms discard. Changing prefix is leaving.
Opening the website editor hydrates undo/redo from website edit history; Ctrl+Z
is in-memory, then PATCH. See [editing.md](editing.md). Assistant edits follow
[assistant.md](assistant.md): Ask first waits for Apply / Reject (website editor PATCH, then
record metadata); instant apply is the website editor PATCHing as tools succeed.
Website publication writes a website version. **Details**, **Projects**,
**Certifications and reviews**, and the **media library** are website page
content (placeholders, project galleries, reviews, photos) edited on
[business profile](../business-profile/README.md) and [media library](../other/media/README.md) screens. They are separate entities.
Certifications and reviews is the picker for **all reviews** and for pinning
**top reviews** (ads). First-pass reviews website sections resolve
`{{reviews.1}}` … from the ranked pool (River job kind
`reviews_ranking_for_display`; website does not rank). The website editor
reviews Content may later set **that website section’s** ordered
`website_slot_reviews` (add from all reviews, remove, reorder; cap from the
website component). They are not generic website slots. The edit loop is in
[editing.md](editing.md). Screens:
[frontend.md](frontend.md).

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
section against its website component contract, and writes one
`website_publications` row holding a **tokenized** `website.v1` dump
([manifest.md](manifest.md)). Go sends that dump plus
`WebsiteBusinessProfileRead` to **`websitePublication`**. The Worker
**resolves website placeholders** and writes HTML
([04](pipeline/04-website-publication.md), [variables.md](variables.md)).
Go does not resolve `{{…}}` and does not emit HTML. That row is a website
version. Live HTML in R2 is the snapshot the renderer serves. Website
rollback reactivates an earlier **owner** website version (copies it onto
`latest/`). Onboarding-written rows are never website-rollback targets.
That control is on earlier owner website versions (Website versions
workspace item and the publication dropdown), not on the live website
version.
**Preview** opens the live website. Checkout of an owner website version
(`GET` with `publication_id`, then PATCH) is a Website versions control
([design decision record](design-decision-record.md) 9). That is not
website rollback.

Website publication and live website rollback require
`tenants.subscription_status=active`. That status stays `active` during
the three-calendar-month non-payment window. After owner cancel at
period end, or after `billing_nonpayment_unpublish`,
`UnpublishWebsite` already replaced R2 `latest/` with the holding HTML
and cleared `website_publications.active`; POST is **402**
`subscription_canceled`. Website editor PATCH still works. Usage &
billing is how they pay again
([billing architecture](../billing/architecture.md)).

Edits to Details, Projects, certifications and reviews, website styles, or the
unpublished website do not change the live website until the next website
publication. Website publication sends tokenized `{{projects.*}}` on
`WebsiteBusinessProfileRead` (active rows only; skip `draft`); omit draft
ids from published galleries — no 409. Later
business research does not rewrite `latest/`.

Website publication is not a Cloudflare deploy. One shared contractor-website
application serves every tenant. The **Publish** dropdown lists hosts
(`{website_prefix}.preview.placis.com`, a connected website address, or New URL)
— the POST has no destination ([api.md](api.md)). Specs call the act website
publication. Host routing **reads** `website_addresses` reserved at
onboarding 08. Serve path, R2 keys, cache purge, website address, and
local Worker:
[cloudflare.md](cloudflare.md).
`apps/contractor-website` is in this repo; remaining cuts:
[contractor-website-debloat.md](contractor-website-debloat.md). API cutover:
[port-contractor-website.md](port-contractor-website.md). Next is R2 `latest/` +
website publication HTML.

## Contractor website (separate Astro app)

Live websites and website previews are served by a
**separate Astro + React app** (`apps/contractor-website`), not the website
editor. Website components live in `packages/website-components`.

At **website publication**, Go `POST`s `websitePublication`. The Worker
resolves website placeholders and writes HTML to R2 `latest/`. A live GET
is Cache then R2. It never calls Go. Onboarding 08/09 call this same write
(strip on, then strip off). Website copy generation (03) `POST`s
`websiteRender` (**without** writing R2) and gets a website image render.
Both requests include `media_asset_urls` (public delivery URLs; Worker
GETs them; no image files in the JSON). There is
no per-request unpublished render for website visitors and no
`/preview/{token}/`.

Astro owns routing, the Astro document, prerender-at-publication, and metadata;
React owns interactive islands. One application serves every contractor website
— no per-tenant build — and imports only the website component package (a
bundle-boundary check blocks imports from `frontend-2`).

The onboarding wait teaser (`/onboarding/preview`) reuses website components in
`frontend-2` for **one complete website section** at a time when current
profile data can resolve its placeholders. It is not this app and not the
host. Not the Worker.

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
