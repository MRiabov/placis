# Certifications and reviews design decisions

Look for `/cms/certifications-and-reviews`. Product: [ADR.md](ADR.md). Screen:
[frontend.md](frontend.md). Website editor reviews Content look stays in
[website design-decision 15](../../website/design-decisions.md).

Status: decided (dates on each entry). Moved from website design-decision 6.

## Decisions

   1. **Certifications and reviews layout is 1fr | 2fr** — Left: definition ticks (checkbox + badge
   + name). Right: review cards in three headings: **Top reviews**, **All reviews**, **Archive**.
   Create owner-written is a route for now (`/cms/certifications-and-reviews/new`;
   look TBD). Product rules stay in [ADR.md](ADR.md) 1. (2026-08-26; moved from website
   design-decision 6, 2026-08-27)
   The top reviews heading is the **ads** featured list. Pinning it does not rewrite reviews
   website sections. Website editor reviews Content is **that website section’s** ordered
   list ([website design-decision 15](../../website/design-decisions.md)). (2026-08-26)
   Owner copy is **All reviews** (not pool). That heading excludes cards already in Top
   reviews. Top reviews and All reviews are visually the same: plain headings, not a
   dashed drop well. A drop-target around Top reviews is parked (see mock CSS comment).
   Archive is a collapsible heading (chevron down on the right), default collapsed — not a
   toolbar button. No hairline under the screen title. (2026-08-26)
   The Undo toast sits above Archive with a gap, not flush. (2026-08-27)
   Wide: certifications sit in a card next to reviews. Narrow (≤1100px): one column, no
   card around certifications — **Certifications** is a heading like **Top reviews**.
   (2026-08-27)
