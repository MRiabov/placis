# CMS Decision Record

Status: decided (dates on each entry). Update an entry (keeping the old decision + date)
instead of silently replacing the old entry.

## Decisions

1. **Profile groups Details, Projects, Certifications and reviews, and the media library** —
   The left nav does not give Projects its own top-level item. Details is also opened
   infrequently, so they sit under **Profile**: **Business details** (`/cms/details`) and
   **Projects** (`/cms/projects`). Profile is a disclosure, not a destination of its own;
   there is no `/cms/profile`. The Details screen stays. (2026-08-19; moved from details
   ADR 2, 2026-08-27)

   (2026-08-20): Projects is a working Projects screen, still under Profile.
   **Certifications and reviews** (`/cms/certifications-and-reviews`) is a third Profile
   child. No `/cms/proof`. Top menu and footer stay in the website editor, not Details.

   (2026-08-26): **Media library** (`/cms/media`) is a fourth Profile child. It is not a
   top-level peer of Sites. Crop / focal / cleanup stay on that screen; attach/pick from
   Content is unchanged.

2. **New chat is `/cms`** — Connect links Google Ads and Meta ad accounts (hide when both
   are connected). Voice is desktop-only and opens a full-screen orb for the
   client interview, not the website-editor canvas orb. Placeholders cycle. Look:
   [design decisions](design-decisions.md) 5 (moved from website design decision 17).
   (2026-08-27)
