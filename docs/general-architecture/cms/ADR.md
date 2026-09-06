# CMS Decision Record

Status: decided (dates on each entry). Update an entry (keeping the old
decision + date) instead of silently replacing the old entry.

## Decisions

1. **Profile groups Details, Projects, Certifications and reviews, and the media
   library** — The left nav does not give Projects its own top-level item.
   Details is also opened infrequently, so they sit under **Profile**:
   **Business details** (`/cms/details`) and **Projects** (`/cms/projects`).
   Profile is a disclosure, not a destination of its own; there is no
   `/cms/profile`. The Details screen stays.
   - 2026-08-27: moved from details ADR 2.
   - 2026-08-20: Projects is a working Projects screen, still under Profile.
     **Certifications and reviews** (`/cms/certifications-and-reviews`) is a
     third Profile child. No `/cms/proof`. Top menu and footer stay in the
     website editor, not Details.
   - 2026-08-26: **Media library** (`/cms/media`) is a fourth Profile child. It
     is not a top-level peer of Sites. Crop / focal / cleanup stay on that
     screen; attach/pick from Content is unchanged.
   - 2026-08-28: The nested Profile object is the same on the narrow overlay.
     Look-export HTML wraps Profile around its children; overlay CSS must not
     flatten those children into Sites/Ads peers.

2. **New chat is `/cms`** — Connect links Google Ads and Meta ad accounts (hide
   when both are connected). Voice is desktop-only and opens a full-screen orb
   for the client interview, not the website editor canvas orb. Placeholders
   cycle. Look: [design decision record](design-decision-record.md) 5 (moved
   from website design decision 17).
   - 2026-08-27: **`/cms` is a two-card chooser**, not a prompt Send and not a
     sidebar destination. Cards: **Do my website…** (`/cms/website`) and **Run
     my ads** (`/cms/ads`). After they pick, the rail is Sites / Profile / Ads.
     Hide New chat nav, Paperclip, Start client interview, leftover Usage &
     billing mock, Settings, Log out; keep those nodes in the look app. Connect
     stays. No first-turn assistant POST. Name under the photo is the Clerk
     human name. Look: [assistant design decision
     3](../../features/assistant/design-decision-record.md).
   - 2026-08-28: Connect does not stay on `/cms`. Cards have destination logos
     and the prompt-box shade. Google Ads / Meta connect lives on Ads. Voice on
     `/cms` is gone; overlay is the CMS assistant.
   - 2026-09-04: After they pick, the rail is Sites / Profile / Ads / **Leads**.
     Overlay includes Leads. Not a third chooser card.

3. **Usage & billing is on the account menu** — Not a left-nav peer of Sites /
   Ads / Leads. Hide the leftover Usage rail item. Settings / Log out stay
   hidden. Overlay destinations unchanged except Leads (2026-09-04).
