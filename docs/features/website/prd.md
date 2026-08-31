# Website PRD

Status: proposed product scope for the website.

Related: [ADR](ADR.md), [technical-implementation.md](technical-implementation.md), [persistence](persistence.md), [frontend.md](frontend.md).

## Problem

A contractor's marketing starts with a website. The site must be built from
their business profile and a website template, then stay editable by the owner
(or done-for-you) through the website editor — website pages, copy, photos,
website forms, top menu, and footer — then website publication.

## Goals

1. Build an unpublished website from a **website template** + their business
   profile (their details fill in the blanks).
2. Let the owner (or done-for-you) **edit** the site: website pages, copy,
   photos, website forms, top menu, footer, and their projects. Text persists on
   click-off; there is no Save and no Saving / Saved indicator. If the copy has
   not succeeded after 10 seconds, show a visible error; leaving stays blocked
   while it is uncopied.
3. **Improve** it with the assistant — it suggests copy and images, but the
   owner decides.
4. **Publish** — put it on the internet (dropdown: preview website address, a
   connected website address, or New URL), with website rollback if a
   publication is wrong. Owner copy is the verb **Publish**; the act is website
   publication.
5. Keep the unpublished website the source of truth; website publication writes
   a published website copy of it.

## Non-goals

- No per-contractor code or deploy — every site runs on one shared renderer.
- No blog posts, careers, or `landing` website pages in the first pass.
- No CRM/operations content.

## The site is made of

The website editor is one workspace. By default the canvas is the wide column:
the CMS left nav collapsed to icons, workspace rail-only until a workspace item
or a canvas selection opens the list. The owner can open Website pages, SEO,
Website styles, or Website versions from the rail, and Content from a website
section or image on the canvas. There is no right-hand editing panel.

- **Website pages** — home, about, service, contact, and legal website pages,
  reorderable.
- **SEO** — a standalone workspace rail panel that always shows the current
  website page.
- **Website styles** — the look (colors and fonts) via design controls. One
  **website style** is the applied look; **website styles** is the rail list,
  same singular/plural as website page / website pages.
- **Website versions** — website publications and website-assistant activity,
  pinned to the end of the workspace rail (bottom on desktop; trailing on the
  mobile bottom bar).

**Content** is a closed union keyed by **website component**: website slots by
default; special layouts for reviews (that website section’s ordered list from
all reviews, add / remove / reorder, cap from the website component), top menu /
footer (depth-2 tree + show/hide marketing phone, marketing email, and contact),
website forms, and projects. It is the left list after a canvas click, not a
rail item. No Design tab (look is Website styles). No Website versions tab. No
Website forms tab. Top menu and footer are not workspace-rail items. Attach from
the **media library** in Content when an image is selected; the full-screen
library is `/cms/media`.

Each **website page** is built from **website sections** (hero, services,
reviews, …), and each website section is edited through its **website slots** —
text, rich text, images, lists, and links.

A **Details** view edits the Business details subset of the business profile
shown on the site ([details](../business-profile/details/README.md)). **Projects** are edited at `/cms/projects`
([projects](../business-profile/projects/README.md)). **Certifications and reviews** are edited at
`/cms/certifications-and-reviews` ([certifications and reviews](../business-profile/certifications-and-reviews/README.md)). Reviews
website sections first resolve `{{reviews.1}}` … from the ranked pool. Owner
Content / `update_reviews` may later set that website section’s ordered
`website_slot_reviews`. Ads use **top reviews**. A project gallery resolves
`{{projects.*}}` at website publication.

Website publication makes a **published website copy** of the site each time.
Those screens update the website editor immediately; the live website changes
only on the next website publication. **Link your Facebook** is a Details link
(paste URL this pass), not Ads Connect Meta.

## User stories

1. **As a contractor**, I want a website built from my profile and trade, so I
   get a branded unpublished website without doing it myself.
2. **As a contractor**, I want to edit text and swap photos in the website
   editor, so I can keep it correct without code. Text persists when I click off
   the field; I do not click Save. If I leave while edits are still being
   copied, I am asked first.
3. **As a contractor**, I want the assistant to improve the copy and suggest
   images, so I get better content faster.
4. **As a contractor**, I want website publication and website rollback, so I'm
   never stuck with a broken live website. I choose the preview website address
   or my website address, or I connect a new URL.

## Acceptance criteria

1. Content is checked against what each website section allows before the
   unpublished website is written and before website publication. The website
   editor has no Save action.
2. Website publication writes a published website copy; that copy is never
   overwritten.
3. Website visitors see the live website; the owner edits the unpublished
   website in the website editor.
4. The unpublished website is validated before it becomes the live website.
   Website publication also requires an active subscription (pay gate in
   [billing](../billing/prd.md)).
5. One end-to-end test covers edit → assistant → website publication → live HTML
   (fake R2 + fake purge) → website rollback → website form, with outside
   services faked in tests but the core logic real. Select and copy the website
   template is the onboarding E2E.
