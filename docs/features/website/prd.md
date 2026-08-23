# Website PRD

Status: proposed product scope for the website.

Related: [ADR](ADR.md), [technical-implementation.md](technical-implementation.md),
[data model](data-model.md), [frontend.md](frontend.md).

## Problem

A contractor's marketing starts with a website. The site must be built from their business profile
and a website template, then stay editable by the owner (or done-for-you) through the website editor
— website pages, copy, photos, website forms, top menu, and footer — then website
publication.

## Goals

1. Build an unpublished website from a **website template** + their business profile (their
   details fill in the blanks).
2. Let the owner (or done-for-you) **edit** the site: website pages, copy, photos, website forms,
   top menu, footer, and their projects. Text persists on click-off; there is no Save.
3. **Improve** it with the website assistant — it suggests copy and images, but the owner decides.
4. **Website publication** — put it on the internet, with website rollback if a publication is
   wrong.
5. Keep the unpublished website the source of truth; website publication writes a published
   website copy of it.

## Non-goals

- No per-contractor code or deploy — every site runs on one shared renderer.
- No blog posts, careers, or `landing` website pages in the first pass.
- No CRM/operations content.

## The site is made of

The website editor is one workspace with a left sidebar, a canvas, and an editing panel:

- **Website pages** — home, service, contact, and legal website pages, reorderable.
- **Media library** — left-side panel: their work, logos, and documents, each with a media caption.
  Drop files onto that panel to upload. Drag a photo onto an image on the canvas to attach it.
- **Website styles** — the look (colors and fonts) via design controls.
- **Top menu and footer** — named separately; never say header, navigation, or bare “menu”.

A **Details** view edits the business details shown on the site: business name, legal name, trade,
established year, description, marketing phone, marketing email, existing site URL, location, service areas,
featured services, company/VAT number, registered office, and opening hours.

Each **website page** is built from **website sections** (hero, services, reviews, …), and each
website section is edited through its **website slots** — text, rich text, images, lists, and
links. Reviews on a website section are selected profile reviews. A project gallery lists their
projects.

**Projects** are edited at `/cms/projects`. **Certifications and reviews** are edited at
`/cms/certifications-and-reviews`. Website publication makes a **published website copy** of the
site each time. Those screens update the website editor immediately; the live website changes only on
the next website publication.

## User stories

1. **As a contractor**, I want a website built from my profile and trade, so I get a branded
   unpublished website without doing it myself.
2. **As a contractor**, I want to edit text and swap photos in the website editor, so I can keep it
   correct without code. Text persists when I click off the field; I do not click Save.
3. **As a contractor**, I want the website assistant to improve the copy and suggest images, so I
   get better content faster.
4. **As a contractor**, I want website publication and website rollback, so I'm never stuck with a
   broken live website.

## Acceptance criteria

1. Content is checked against what each website section allows before the unpublished website is
   written and before website publication. The website editor has no Save action.
2. Website publication writes a published website copy; that copy is never overwritten.
3. Website visitors see the live website; the owner edits the unpublished website in the website editor.
4. The unpublished website is validated before it becomes the live website.
5. One end-to-end test covers edit → website assistant → website publication → live HTML (fake
   R2 + fake purge) → website rollback → website form, with outside services faked in tests but
   the core logic real. Apply the website template is the onboarding E2E.
