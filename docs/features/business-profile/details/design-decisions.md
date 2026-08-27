# Details design decisions

Look for Business details. Product: [ADR.md](ADR.md). Screen: [frontend.md](frontend.md).
CMS theme: [CMS design-decisions](../../../general-architecture/cms/design-decisions.md).

Status: decided (dates on each entry). Moved from website design-decision 4.

## Decisions

1. **Opening hours picker is Google Calendar-style** — Details **Opening hours**: one row per
   weekday, Opens to Closes as a time range, Closed as the unavailable control, copy to
   following days, add a time block. CMS palette (white, higher contrast). Hours they pick up
   the marketing phone; no Appointment note. Persistence is still one Opens / Closes / Closed
   per day ([ADR.md](ADR.md) 6). (2026-08-26; moved from website design-decision 4, 2026-08-27)
   Opening hours is not the first Details panel. Identity (name, story, logo) is first; hours
   sit after contact, services, and legal. (2026-08-26)
   On a narrow screen the day name and Closed / add / copy sit on the first line; Opens and
   Closes are full-width time chips on the line below so the times stay readable (Google
   Calendar on a small screen). Extra time blocks still stack under the day. (2026-08-27)
