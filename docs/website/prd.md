# Website CMS PRD

Status: proposed product scope for the website part of the CMS.

Related: [ADR](ADR.md), [technical-implementation.md](technical-implementation.md),
[tenancy/auth/data model](../tenancy-auth-and-data-model.md).

## Problem

A contractor's marketing starts with a website. The site must be built from their business profile
and a trade template, then stay editable by the owner (or by the team) through a normal editor —
pages, text, images, forms, the menu — and go live.

## Goals

1. Build a website draft from a **trade template** + their business profile (their details fill in
   the blanks).
2. Let the owner (or the team) **edit** the site: pages, text, images, forms, the menu, and their
   portfolio.
3. **Improve** it with AI — AI suggests copy and images, but the owner decides.
4. **Publish** it — go live, with the ability to undo a bad publish.
5. Keep the edited site the source of truth; the published site is a frozen copy of it.

## Non-goals

- No per-customer code or deploy — every site runs on one shared renderer.
- No blog posts or careers pages in the first pass.
- No CRM/operations content.

## The site is made of

- **pages** — home, services, contact, and more
- **sections** — the building blocks on each page (hero, services, reviews, …)
- **text and images** inside those sections
- **a photo library** — their work, logos, and documents
- **forms** — how a visitor gets in touch
- **the menu** — navigation
- **their portfolio** and **certifications**
- **publications** — a frozen copy of the site each time it goes live

## User stories

1. **As a contractor**, I want a website built from my profile and trade, so I get a branded draft
   without doing it myself.
2. **As a contractor**, I want to edit text and swap photos in a normal editor, so I can keep it
   correct without code.
3. **As a contractor**, I want AI to improve the copy and suggest images, so I get better content
   faster.
4. **As a contractor**, I want to publish and undo a bad publish, so I'm never stuck with a broken
   site.

## Acceptance criteria

1. Content is checked against what each section allows before saving and before going live.
2. Publishing makes a frozen copy; the history is never overwritten.
3. Visitors see the published site; the owner sees drafts in a preview.
4. The draft is validated before it becomes the live site.
5. One end-to-end test covers build → edit → improve → publish → view the live site, with outside
   services mocked but the core logic real.
