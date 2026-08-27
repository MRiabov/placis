# Certifications and reviews Frontend Specification

This screen is the **picker** for **all reviews** and for pinning **top reviews** (ads).
Layout (function, not pixels): **1fr certifications | 2fr reviews**. On a wide screen
certifications sit in a card. On a narrow screen (≤1100px) the layout is one column and
**Certifications** is a flat heading (same level as **Top reviews**), not a card.

Left nav: [The CMS (sidebar + main area)](../../../general-architecture/cms/frontend.md). Look:
[design-decisions.md](design-decisions.md). Product: [ADR.md](ADR.md). HTTP:
[details HTTP](../details/api.md). Tables: [details persistence](../details/persistence.md).
Port: [frontend-debloat.md](frontend-debloat.md). Headings have no decorative icon. On narrow,
Open destinations stays inline with the heading.

Editing this screen updates the unpublished website / website editor immediately; the live
website changes only on the next website publication.

**Left — certifications:** definition rows for this trade/country. Each row: badge (already on
the definition; it is what the website paints) + name + checkbox. The contractor mostly ticks.
No upload-your-badge. Unchecking is `removed`. HTTP: `GET`/`PUT /v1/business-profile/certifications`
with `available[]`.

**Right — reviews:** Google-style cards in a 3–4 column grid (stars, author, review citation, origin).
Three headings, same look: **Top reviews**, **All reviews**, **Archive**. Top reviews and All
reviews are ordinary sections (not a dashed drop well). **Top reviews** sit first,
featured-first (the first cards in that heading are what **ads** start with). Cap **30**.
Checking an extra card when 30 are already top is refused (visible error). A newly pinned
card **appends** (least featured). **All reviews** is `in_pool` and not top (the heading
excludes cards already under Top reviews). Pinning or reordering Top reviews does **not**
rewrite reviews website sections.

**Reorder / pin by drag-and-drop.** Six-dot grip (2×3) on hover on **every** review card (Top
reviews and All reviews). Drop onto Top reviews to pin; drop onto All reviews to unpin. Reorder
inside Top reviews is featured-first. Keep drag-and-drop on narrow screens (grip always
visible; no hover-only). The six dots stay compact; the hit is 44px. Do not fall back to up/down-only.

Unpin / reorder of **top reviews** updates `is_top` / `top_position` only. Live website waits
for the next website publication. Website editor reviews Content edits **that website section’s**
ordered list (add from all reviews, remove, reorder; cap from the website component).
If a reviews website section has zero reviews: keep it **empty** (no fake copy; do not hide
the website component).

**Archive** any review (any origin): it leaves all reviews and top reviews, and is dropped from
every reviews website section array (then compact). Toast with **Undo**
(unarchives), then a gap, then **Archive**. **Archive** is a collapsible heading (chevron down on the right; not a toolbar
button). Default collapsed. Unarchive from there. Not a hard
delete. Re-import must **not** recreate an archived imported row (keep the row, skip that
external id until unarchived).

Toolbar: import from the Google Maps listing on Business details; **Link your Facebook**
(paste URL this pass; type-to-search TBD) only when unlinked, otherwise import from that
Facebook URL; **+** → create review. No Archive toolbar control. No Facebook Login. Not Ads
Connect Meta.

**Create review** is a **route for now** at `/cms/certifications-and-reviews/new` (TBD: a full
route is heavy; a modal is also so-so — do not treat the route as locked). Fields: author name,
rating 1–5, body (`maxLength` 500), optional date. Origin = owner. Lands in all reviews; the
owner can mark it top on the list. **Owner-written reviews are editable after create** (same
fields). Imported Google/Facebook reviews are not edited (archive if they should not stay).
Cards / website / ads paint the **review citation** (`maxLength` 500, about two or three sentences);
imported `body` is stored in full.
