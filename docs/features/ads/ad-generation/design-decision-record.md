# Ads design decision record

Look and interaction for Ads. Architecture: [ADR.md](ADR.md). Screens: [frontend.md](frontend.md).
Tokens: [CMS design.md](../../../general-architecture/cms/design.md). Look: [`apps/demo/`](../../../../apps/demo/README.md) `/cms/ads`.

Status: decided (dates on each entry). Do not silently replace the old entry.
One number is one decision. **Why** is owner-written; omit it rather than
inventing it.

## Decisions

1. **Archive is on the card** — A red archive icon on the list card, not a
   labelled button, and it does not add a row. Toast with **Undo** after
   archive. Collapsed **Archive** heading under the cards (chevron down on the
   right; default collapsed). Unarchive is a labelled outline button on that
   list. Same look as Certifications and reviews Archive. (2026-08-29) Same
   day, later: ads Archive is the project pattern, not the reviews icon. The
   whole list card is the hit; no controls on the card. **Archive** is a red
   outline button on `/cms/ads/{id}` after the two-column body, not in the
   Publish / Download / Edit row. List toast Undo and collapsed Archive /
   Unarchive stay. (2026-08-29)

2. **Last ad lead has no divider** — Dividers sit between ad leads only. The
   last row has no bottom line: on a narrow screen it sits on the canvas, and
   a trailing line looks like a table edge. (2026-08-29) (2026-09-04) The
   per-ad list left this screen ([ads ADR 41](ADR.md)). Dividers apply on
   **Leads** if a stacked ad-lead list is shown there; ads detail is a
   count + link.

3. **Wide ad detail keeps status left of the actions** — **Creative ready**
   sits left of Publish / Download / Edit on a wide screen. Narrow still
   puts the badge last, after the buttons. (2026-08-29)

4. **Ad leads is the Inbox panel** — Same dashed empty mark as Leads.
   The whole panel opens `/cms/leads` with `source=ad` and that `ad_id`.
   On a narrow screen Performance and Ad leads follow Images, before
   Budget. (2026-09-04)
