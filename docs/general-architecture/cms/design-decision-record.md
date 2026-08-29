# CMS design decision record

Look and interaction for The CMS (sidebar + main area): left nav, `/cms` two
cards, viewport lock, theme. Website editor look stays in
[website design decision record](../../features/website/design-decision-record.md). Tokens: [design.md](design.md). Look: [`demo/`](../../../demo/README.md). HTML
archive: [cms.html](../../design/cms.html). Screens:
[frontend.md](frontend.md).

Status: decided (dates on each entry). Do not silently replace the old entry.
One number is one decision. **Why** is owner-written; omit it rather than
inventing it.

## Decisions

1. **Left nav and Profile** — Collapsed nav icons **navigate**. Only the sidebar
   panel control expands or collapses the labels. The Profile icon goes to
   **Business details** (children stay a disclosure when the sidebar is
   expanded). Navigating does not expand the rail. Collapsed, the bottom of the
   rail is the Clerk owner photo (UserButton), not initials. Nav icons: New chat
   is a message bubble; Profile is a person, not a house. Sites stays a globe;
   Ads a megaphone; AI tools a sparkle. (2026-08-26; moved from website design
   decision 1, 2026-08-27) **Media library** (`/cms/media`) is a Profile child,
   not a top-level peer of Sites. Collapsed Profile still goes to Business
   details. (2026-08-26) No **AI tools** left-nav item. Image cleanup is
   `/cms/media` (large view of the selected photo, prompt box beside or under
   it, dense mixed-ratio thumbs — not huge square cards). (2026-08-28) Cleanup
   waits 5–10 seconds on that view (**Cleaning up…**, scan, filling bar) before
   the before/after sweep; `?cleanup=1` and Dev **Cleanup compare** skip the
   wait. The website assistant is called from the bottom-right **Assistant**
   button; the orb / overlay is what they see after they call (a later cut may
   drop that overlay; this item still does not come back). (2026-08-26) On
   **narrow**, this left rail is gone: a full-screen overlay selector (see 4).
   Collapsed icon rail, hover peek, and click-to-pin are **wide only**.
   (2026-08-27) Website editor canvas / workspace quiet-default:
   [website design decision 1](../../features/website/design-decision-record.md).
   (2026-08-29) Profile and its nested children default **expanded** whenever
   labels are visible. The owner may still collapse the group. Collapsed icon
   rail still hides children.

2. **The yellow strip is mock-only states** — Per-screen shortcuts for reviewing
   [cms.html](../../design/cms.html) (copy-out blocked, Ask first pending, pages, publication, and so
   on). Hide with `?shot=1`. Copy-out is an error, not always-on UI.
   (2026-08-26; moved from website design decision 7, 2026-08-27) Always
   collapsible to a **circle in the top right**; tap to reopen. Default
   **collapsed** (desktop and mobile). `?dev=1` opens it; `?shot=1` hides it.
   (2026-08-26; default collapsed everywhere 2026-08-27) (2026-08-28) Ads
   destination states: **My ads** / **New ad** / **Review**. That destination
   embeds [ads.html](../../design/ads.html) (`?embed=1`); standalone `ads.html` keeps the same
   collapsible strip as onboarding.

3. **The CMS is viewport-locked, not a scrolling document** — The window never
   scrolls. The CMS fills the viewport like a PWA: The CMS stays put, overflow
   is clipped at the CMS. Inner regions scroll only when that surface has more
   content than it can show (Details / Projects / Certifications and reviews, a
   workspace list, including Content). The retired right-hand editing panel is
   not a scroller. (2026-08-26; moved from website design decision 8,
   2026-08-27) Website canvas scroll (website page inside the stage, assistant
   overlay pad): [website design decision 8](../../features/website/design-decision-record.md).

4. **The CMS is narrow-first** — Owners use it on a small screen. A wide screen
   is extra width, not the default story. Global nav copies placis-web
   `DashboardShell`. (2026-08-27; moved from website design decision 16,
   2026-08-27) **Narrow (≤1100px):** a **full-screen overlay selector** covers
   `main` (labels, active fill, **Placis** + `PanelLeft` to close). No leftover
   `3rem` rail. Open destinations is inline with the screen heading. Overlay
   rows: New chat, Sites, Business details, Projects, Certifications and
   reviews, Media library, Ads. Profile is not a row. Touch targets 44px; review
   grips visible without hover, with compact six-dot marks inside the 44px hit.
   Notifications sit above the workspace bar. Safe-area padding on overlay, bar,
   assistant. **Wide (≥1101px):** sidebar stays permanently collapsible (default
   collapsed icon rail, hover peek, click to pin). Profile icon still goes to
   Business details. Sites/Ads/Profile do not invent a second global nav.
   (2026-08-27) Profile and Ads headings have no decorative boxed icon. Open
   destinations on narrow stays. Viewport controls stay on `/cms/website` only.
   (2026-08-27) Website editor canvas widths, workspace bottom bar, assistant
   default, Mobile default: [website design decision 16](../../features/website/design-decision-record.md). (2026-08-27): Overlay
   rows drop New chat. Product overlay is Sites, Profile children, Ads.
   (2026-08-28): Overlay keeps the nested Profile object. Profile is a
   disclosure on narrow too (Sites / Profile / Ads); Business details, Projects,
   Certifications and reviews, and Media library stay children, not overlay
   peers. Tapping Profile on the overlay expands or collapses the group.
   (2026-08-28) On narrow, Ads heading is **Ads**, inline with Open
   destinations. The list does not repeat **Your ads**.

5. **The CMS (sidebar + main area) clones the placis-web dashboard theme** —
   Satoshi, body tracking `-0.01em`, light weights (`400` / `450` / `500` /
   `600`), ink `#13120a`, `--secondary` `#f4f4f5`, zinc-600 idle rows,
   zinc-950/6% active fill, stone `#e7e5e4` hairline on the prompt box. Do not
   invent a second palette. Source: placis-web `globals.css` +
   `marketingSite.ts`. (2026-08-27; moved from website design decision 17,
   2026-08-27) New chat prompt is full width of the main column, max `42rem`
   (placis-web default `PlacisPromptBox`, `w-full max-w-2xl`). Do not use the
   compact `19.5rem` mobile cap. Wordmark + prompt are vertically centered in
   the main column (Open destinations stays top-left on narrow). Usage copy is
   not predecessor dashboard Usage & billing copy. (2026-08-27; two-card `/cms`
   2026-08-28 — [assistant design decision 3](../../features/assistant/design-decision-record.md).) New chat clones dashboard
   `PlacisPromptBox` controls: **Connect** (flat hairline, white at rest,
   zinc-50 only while the Google / Meta panel is open), Paperclip (hidden under
   640px), animated AudioLines Voice on the right (desktop only), ArrowRight
   send. Connect is gone when Google Ads and Meta are both connected (same
   status as Ads; do not flash the control). It is not Connect website address.
   Placeholders cycle. Secondary controls stay outline (canvas fill, `--border`,
   hover zinc-50) — `--secondary` is a token, not a resting chip. Voice on New
   chat opens a full-screen **orb** for the client interview (soft glowing
   circle, Back). Do not port the DustOrb particle renderer bit by bit; the
   later `frontend-2` port can keep its cheaper orb. Website-editor Voice stays
   the canvas orb ([website design decision 18](../../features/website/design-decision-record.md)). Token table: [design.md](design.md).
   (2026-08-27) (2026-08-27): Product `/cms` is two cards (**Do my website…** /
   **Run my ads**), not this prompt. Keep the prompt-box markup in the
   look-export HTML for later restore. Hide Paperclip, Start client interview,
   predecessor dashboard Usage & billing copy. Overlay rows drop New chat.
   Connect stays. (2026-08-28): Voice on `/cms` is gone. Overlay look:
   [assistant design decision record](../../features/assistant/design-decision-record.md). `/cms` cards clone the prompt-box look
   (hairline, prompt radius) with a readable lift of the prompt shade, and carry
   destination logos (Sites globe, Ads megaphone). Google / Meta connect lives
   on Ads too. The two cards sit in one row on a wide screen and stack on a
   narrow screen so the titles stay one line. (2026-08-29): Product `/cms` does
   not paint the leftover Connect bar. Keep that markup in the look-export HTML
   as a restorable node (`is-hidden`). Nav glyphs are the archive strokes (1.6),
   not Lucide defaults. Wordmark weight matches placis-web (`font-semibold`,
   16px / 14px from `sm`, same as the placis-web rail).

   (2026-08-29): `/cms` **placis** is the placis-web dashboard new-chat
   wordmark: `text-4xl`, `leading-tight`, tracking `-0.03em`. Type weights stay
   the placis-web map (`400` / `450` / `500` / `600`). Sidebar **Placis** uses
   the same class as placis-web (`text-[16px] sm:text-[14px]`), not the 1100px
   CMS breakpoint.

6. **Owner field controls share one look** — Input, textarea, and select in The
   CMS, onboarding, and Ads use `.cms-field-control` (look export:
   [details-fields.css](../../design/details-fields.css)). Same sunken fill,
   radius, type, and focus ring. Leftover `.cms-careers-input` /
   `.cms-careers-textarea` / onboarding `.field-control` are that same control.
   Not the website assistant composer, not the New chat prompt, not the
   contractor website form, not Ads inplace names. Don't say form. Don't say
   component. **Why:** we have so many forms, all of them use different styles;
   no textarea is shared between components.
   (2026-08-28)
   (2026-08-28): Same file now holds owner buttons
   (`.button-primary` / `.button-secondary`), combobox (`.cms-combo`), field
   labels (13px / 450), and the mock-only yellow strip. Ads maps its old
   `.btn` look to those buttons and About-the-ad combos to `.cms-combo`. Find
   registry search stays search-then-pick; only the listbox look matches the
   combo popover. `.cms-careers-input` / `.cms-careers-textarea` are renamed to
   `.cms-field-control`.
