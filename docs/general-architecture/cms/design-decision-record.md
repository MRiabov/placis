# CMS design decision record

Look and interaction for The CMS (sidebar + main area): left nav, New chat, viewport lock,
theme. Website editor look stays in [website design decision record](../../features/website/design-decision-record.md).
Tokens: [design.md](design.md). Mock: [cms.html](../../design/cms.html). Screens:
[frontend.md](frontend.md).

Status: decided (dates on each entry). Do not silently replace the old entry.
Each live entry is **what** plus **why**.

## Decisions

1. **Left nav and Profile** — Why: expanding the rail on every destination is noisy, and a
   collapsed Profile has no children to show, so the icon goes to **Business details**. A house
   icon would read as Home. There is no **AI tools** item because cleanup is `/cms/media` and the
   website assistant is the overlay. Collapsed nav icons **navigate**. Only the sidebar panel control expands or collapses the
   labels. The Profile icon goes to **Business details** (children stay a disclosure when the
   sidebar is expanded). Navigating does not expand the rail.
   Collapsed, the bottom of the rail is the Clerk owner photo (UserButton), not initials.
   Nav icons: New chat is a message bubble; Profile is a person, not a house. Sites stays a
   globe; Ads a megaphone; AI tools a sparkle.
   (2026-08-26; moved from website design decision 1, 2026-08-27)
   **Media library** (`/cms/media`) is a Profile child, not a top-level peer of Sites. Collapsed
   Profile still goes to Business details. (2026-08-26)
   No **AI tools** left-nav item. Image cleanup is `/cms/media` (large view of the selected
   photo, prompt box beside or under it, dense mixed-ratio thumbs — not huge square cards).
   The website assistant stays
   the canvas overlay (a later cut may drop that overlay; this item still does not come
   back). (2026-08-26)
   On **narrow**, this left rail is gone: a full-screen overlay selector (see 4). Collapsed
   icon rail, hover peek, and click-to-pin are **wide only**. (2026-08-27)
   Website editor canvas / workspace quiet-default: [website design decision 1](../../features/website/design-decision-record.md).

2. **The yellow strip is mock-only states** — Why: product destinations stay in the left nav;
   a review strip that starts open covers the CMS. Per-screen shortcuts for reviewing
   [cms.html](../../design/cms.html) (copy-out blocked, Ask first pending,
   pages, publication, and so on). Hide with
   `?shot=1`. Copy-out is an error, not always-on UI. (2026-08-26; moved from website
   design decision 7, 2026-08-27)
   Always collapsible to a **circle in the top right**; tap to reopen. Default **collapsed**
   (desktop and mobile). `?dev=1` opens it; `?shot=1` hides it. (2026-08-26; default collapsed
   everywhere 2026-08-27)

3. **The CMS is viewport-locked, not a scrolling document** — Why: The CMS is the sidebar plus
   main area, not a document; scrolling the window would move the nav and composer off screen. The window never
   scrolls. The CMS fills the viewport like a PWA: The CMS stays put, overflow is clipped at
   the CMS. Inner regions scroll only when that surface has more content than it can show
   (Details / Projects / Certifications and reviews, a workspace list, including Content).
   The retired right-hand editing panel is not a scroller. (2026-08-26; moved from website
   design decision 8, 2026-08-27)
   Website canvas scroll (website page inside the stage, assistant overlay pad): [website
   design decision 8](../../features/website/design-decision-record.md).

4. **The CMS is narrow-first** — Why: owners use it on a small screen; 1100px is already the CMS
   breakpoint (do not add another). A leftover `3rem` rail on a small screen eats the main
   area, so narrow is a full-screen overlay selector. A wide screen is extra width, not
   the default story. Global nav copies placis-web `DashboardShell`. (2026-08-27; moved from
   website design decision 16, 2026-08-27)
   **Narrow (≤1100px):** a **full-screen overlay selector** covers `main` (labels, active
   fill, **Placis** + `PanelLeft` to close). No leftover `3rem` rail. Open destinations is
   inline with the screen heading. Overlay rows: New chat, Sites, Business details, Projects,
   Certifications and reviews, Media library, Ads. Profile is not a row.
   Touch targets 44px; review grips visible without hover, with
   compact six-dot marks inside the 44px hit.
   Notifications sit above the workspace bar. Safe-area padding on overlay, bar, assistant.
   **Wide (≥1101px):** sidebar stays permanently collapsible (default collapsed icon rail,
   hover peek, click to pin). Profile icon still goes to Business details. Sites/Ads/Profile
   do not invent a second global nav. (2026-08-27)
   Profile and Ads headings have no decorative boxed icon. Open destinations on narrow
   stays. Viewport controls stay on `/cms/website` only. (2026-08-27)
   Website editor canvas widths, workspace bottom bar, assistant default, Mobile default:
   [website design decision 16](../../features/website/design-decision-record.md).

5. **The CMS (sidebar + main area) clones the placis-web dashboard theme** — Why: one palette
   with the dashboard so The CMS does not look like a second product. `--secondary` is a wash
   token, not a resting chip; Connect hides when both ad accounts are linked so it is not a
   stuck control. Satoshi, body tracking `-0.01em`,
   light weights (`400` / `450` / `500` / `600`), ink `#13120a`, `--secondary` `#f4f4f5`,
   zinc-600 idle rows, zinc-950/6% active fill, stone `#e7e5e4` hairline on the prompt box.
   Do not invent a second palette. Source: placis-web `globals.css` + `marketingSite.ts`.
   (2026-08-27; moved from website design decision 17, 2026-08-27)
   New chat prompt is full width of the main column, max `42rem` (placis-web default
   `PlacisPromptBox`, `w-full max-w-2xl`). Do not use the compact `19.5rem` mobile cap.
   Wordmark + prompt are vertically centered in the main column (Open destinations stays
   top-left on narrow). The Upgrade shelf is full width of the prompt, text centered,
   one outline with the box (placis-web shelf). (2026-08-27)
   New chat clones dashboard `PlacisPromptBox` controls: **Connect** (flat hairline, white
   at rest, zinc-50 only while the Google / Meta panel is open), Paperclip (hidden under
   640px), animated AudioLines Voice on the right (desktop only), ArrowRight send.
   Connect is gone when Google Ads and Meta are both connected (same status as Ads; do not
   flash the control). It is not Connect website address. Placeholders cycle. Secondary
   controls stay outline (canvas fill, `--border`, hover zinc-50) — `--secondary` is a
   token, not a resting chip. Voice on New chat opens a full-screen **orb** for the
   client interview (soft glowing circle, Back). Do not port the DustOrb
   particle renderer bit by bit; the later `frontend-2` port can keep its cheaper orb.
   Website-editor Voice stays the canvas orb ([website design decision 18](../../features/website/design-decision-record.md)). Token table:
   [design.md](design.md). (2026-08-27)
