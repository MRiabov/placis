# Website PRD

Status: proposed product scope for the website.

Related: [ADR](ADR.md), [technical-implementation.md](technical-implementation.md),
[data model](data-model.md).

## Problem

A contractor's marketing starts with a website. The site must be built from their business profile
and a website template, then stay editable by the owner (or done-for-you) through the website
editor — website pages, copy, photos, website forms, top menu, and footer — then website
publication.

## Goals

1. Build an unpublished website from a **website template** + their business profile (their
   details fill in the blanks).
2. Let the owner (or done-for-you) **edit** the site: website pages, copy, photos, website forms,
   top menu, footer, and their projects.
3. **Improve** it with the website assistant — it suggests copy and images, but the owner decides.
4. **Website publication** — put it on the internet, with website rollback if a publication is
   wrong.
5. Keep the unpublished website the source of truth; website publication writes a published
   website copy of it.

## Non-goals

- No per-contractor code or deploy — every site runs on one shared renderer.
- No blog posts or careers website pages in the first pass.
- No CRM/operations content.

## The site is made of

The website editor is one workspace with a left sidebar and a canvas:

- **Website pages** — home, services, contact, and utility website pages, reorderable.
- **Media library** — the photo library: their work, logos, and documents, each with a media
  caption.
- **Website styles** — the look (colors and fonts) via design controls.
- **Top menu and footer** — named separately; never say header, navigation, or bare “menu”.

A **Details** view edits the business details shown on the site: business name, legal name, trade,
established year, description, marketing phone, marketing email, existing site URL, location, service areas,
featured services, company/VAT number, registered office, and opening hours.

Each **website page** is built from **website sections** (hero, services, reviews, …), and each
website section is edited through its **website slots** — text, rich text, images, lists, links,
reviews, or a project gallery.

Their **projects** and **certifications** are edited separately. Website publication makes a
**published website copy** of the site each time.

## User stories

1. **As a contractor**, I want a website built from my profile and trade, so I get a branded
   unpublished website without doing it myself.
2. **As a contractor**, I want to edit text and swap photos in the website editor, so I can keep it
   correct without code.
3. **As a contractor**, I want the website assistant to improve the copy and suggest images, so I
   get better content faster.
4. **As a contractor**, I want website publication and website rollback, so I'm never stuck with a
   broken live website.

## Acceptance criteria

1. Content is checked against what each website section allows before saving and before website
   publication.
2. Website publication writes a published website copy; that copy is never overwritten.
3. Website visitors see the live website; the owner edits the unpublished website in the website
   editor.
4. The unpublished website is validated before it becomes the live website.
5. One end-to-end test covers build → edit → improve → website publication → view the live website,
   with outside services mocked but the core logic real.
