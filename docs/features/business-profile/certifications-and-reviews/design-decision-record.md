# Certifications and reviews design decision record

Look for `/cms/certifications-and-reviews`. Product: [ADR.md](ADR.md). Screen:
[frontend.md](frontend.md). Website editor reviews Content look stays in
[website design decision 15](../../website/design-decision-record.md).

Status: decided (dates on each entry). Do not silently replace the old entry.
One number is one decision.

## Decisions

1. **Certifications and reviews layout is 1fr | 2fr** — Left: definition ticks
   (checkbox + badge
   + name). Right: review cards in three headings: **Top reviews**,
     **All reviews**, **Archive**.
   (2026-08-26)

2. **Create owner-written is a route for now** —
   `/cms/certifications-and-reviews/new`; look TBD. Product rules stay in
   [ADR.md](ADR.md) 1. (2026-08-26)

3. **Top reviews is the ads featured list** — Pinning it does not rewrite
   reviews website sections. Website editor reviews Content is
   **that website section’s** ordered list ([website design decision 15](../../website/design-decision-record.md)).
   (2026-08-26)

4. **Owner copy is All reviews** — Not pool. That heading excludes cards already
   in Top reviews. (2026-08-26)

5. **Top reviews and All reviews look the same** — Plain headings, not a dashed
   drop well. A drop-target around Top reviews is parked (see mock CSS comment).
   (2026-08-26)

6. **Archive is a collapsible heading** — Chevron down on the right, default
   collapsed — not a toolbar button. (2026-08-26)

7. **No hairline under the screen title** — (2026-08-26)

8. **The Undo toast sits above Archive with a gap** — Not flush. (2026-08-27)

9. **Narrow certifications are a heading, not a card** — Wide: certifications
   sit in a card next to reviews. Narrow (≤1100px): one column, no card around
   certifications — **Certifications** is a heading like **Top reviews**.
   (2026-08-27)

10. **Archive is on the card** — Red outline **Archive** after **In top
    reviews**. The heading is the archived list, not the control that archives.
    (2026-08-29) Same day, later: a red archive icon on the card, not a labelled
    button, and it does not add a row of height. (2026-08-29)

11. **Origin shows the platform mark** — Google Maps pin next to **Google Maps
    listing**, Facebook mark next to **Facebook**. **Owner** is words only.
    (2026-08-29)
