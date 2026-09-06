# Details design decision record

Look for Business details. Product: [ADR.md](ADR.md). Screen: [frontend.md](frontend.md). CMS theme:
[CMS design decision record](../../../general-architecture/cms/design-decision-record.md).

Status: decided (dates on each entry). Do not silently replace the old entry.
One number is one decision.

## Decisions

1. **Opening hours picker is Google Calendar-style** — Details **Opening
   hours**: one row per weekday, Opens to Closes as a time range, Closed as the
   unavailable control, copy to following days. CMS palette (white, higher
   contrast). Hours they pick up the marketing phone; no Appointment note.
   Persistence is still one Opens / Closes / Closed per day ([ADR.md](ADR.md)
   6). Extra time blocks were the look; drop them from the mock. (2026-08-26)
   - 2026-08-27: extra blocks out.

2. **Opening hours is not the first Details panel** — Identity (name, story,
   logo) is first; hours sit after contact, services, and legal. (2026-08-26)

3. **Narrow opening hours stack the times** — On a narrow screen the day name
   and Closed / add / copy sit on the first line; Opens and Closes are
   full-width time chips on the line below so the times stay readable (Google
   Calendar on a small screen). Extra time blocks still stack under the day.
   (2026-08-27)
   - 2026-08-28: One line at every width (short day · Opens – Closes · Closed /
     copy), like Calendar desktop. Do not stack the times under the day.
   - 2026-08-29: On a narrow screen the day is Mo / Tu / We / Th / Fr / Sa / Su
     and the row uses a tight gap so Opens – Closes stay on one line.

4. **Onboarding client interview uses these same field controls** — Featured
   services, Maps territory cards, and the hours picker are shared with
   `/onboarding/interview`. Details keeps the Details panel; onboarding keeps
   the white card canvas. (2026-08-28)
   - 2026-08-28: Onboarding Details == Business details: same fields and
     controls; a Details field change applies to both surfaces.

5. **Linked Facebook / Maps cards stay one row** — Photo, name, and Change sit
   on one row at iPhone SE width. The name ellipsizes; Change does not wrap
   under the copy while the row has unused width. (2026-08-28)
   - 2026-08-29: Rating is Google-style: score, stars, then the review count in
     parentheses. If that line is too long, the count nests under the stars. It
     does not wrap word-by-word beside them.

6. **Service areas are an addable Google Maps list** — Each row is a territory
   plus radius. **Add service area** opens the Google Maps dropdown; it does not
   sit as a second copy of the selected name. Search existing places; no
   free-text create. (2026-08-28)
