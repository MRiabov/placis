# Details design decision record

Look for Business details. Product: [ADR.md](ADR.md). Screen: [frontend.md](frontend.md). CMS theme:
[CMS design decision record](../../../general-architecture/cms/design-decision-record.md).

Status: decided (dates on each entry). Do not silently replace the old entry.
One number is one decision.

## Decisions

1. **Opening hours picker is Google Calendar-style** — Details
   **Opening hours**: one row per weekday, Opens to Closes as a time range,
   Closed as the unavailable control, copy to following days. CMS palette
   (white, higher contrast). Hours they pick up the marketing phone; no
   Appointment note. Persistence is still one Opens / Closes / Closed per day
   ([ADR.md](ADR.md) 6). Extra time blocks were the look; drop them from the mock.
   (2026-08-26; extra blocks out 2026-08-27)

2. **Opening hours is not the first Details panel** — Identity (name, story,
   logo) is first; hours sit after contact, services, and legal. (2026-08-26)

3. **Narrow opening hours stack the times** — On a narrow screen the day name
   and Closed / add / copy sit on the first line; Opens and Closes are
   full-width time chips on the line below so the times stay readable (Google
   Calendar on a small screen). Extra time blocks still stack under the day.
   (2026-08-27) Extra time blocks dropped from the mock; one range per weekday.
   (2026-08-27)
