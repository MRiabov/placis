# Website design decisions

Look and interaction for The CMS website editor (and the Details opening-hours picker).
Architecture stays in [ADR.md](ADR.md). Screens: [frontend.md](frontend.md). Mock:
[design/cms.html](../../website/design/cms.html).

Status: decided (2026-08-26, product owner). Update an entry (keeping the old decision + date)
instead of silently rewriting history.

## Decisions

1. **Canvas is the wide column** — On `/cms/website`, The CMS is quiet by default: the CMS left nav
   collapsed to icons, workspace **rail-only** (list closed until a workspace item is opened),
   editing panel **closed** until a website section is selected or the **Edit** handle is used.
   The three surfaces remain canvas, workspace, editing panel; they do not all sit open at once.
   Two-panel: no right column and no Edit handle; see 12. (2026-08-26)
   Collapsed nav icons **navigate**. Only the sidebar panel control expands or collapses the
   labels. The Profile icon goes to **Business details** (children stay a disclosure when the
   sidebar is expanded). Navigating does not expand the rail.
   Collapsed, the bottom of the rail is the Clerk owner photo (UserButton), not initials.
   Nav icons: New chat is a message bubble; Profile is a person, not a house. Sites stays a
   globe; Ads a megaphone; AI tools a sparkle.
   (2026-08-26)
   **Media library** (`/cms/media`) is a Profile child, not a top-level peer of Sites. Collapsed
   Profile still goes to Business details. (2026-08-26)
   No **AI tools** left-nav item. Image cleanup is `/cms/media`. The website assistant stays
   the canvas overlay (a later cut may drop that overlay; this item still does not come
   back). (2026-08-26)
   On **narrow**, this left rail is gone: a full-screen overlay selector (see 16). Collapsed
   icon rail, hover peek, and click-to-pin are **wide only**. (2026-08-27)

2. **Website assistant is a pinned composer, not a toolbar button** — No toolbar **Website
   assistant** control. The composer is always on, pinned to the bottom of the canvas. Default
   **contracted** (one-line textbox). Expanded: at least half the canvas column, dims and
   **blocks** clicks on the covered website. Contracted and idle: about **40% opacity** so it
   stays out of the way; hover or focus makes it opaque. **Apply / Reject pills never fade.**
   Expand / collapse from the composer chevron. Clear context is the trash icon on the composer.
   Overlay is one chat-like thread; tool calls are silent; Ask first Apply / Reject is bulk for
   the pending turn, as pills on the canvas above the chatbot. (2026-08-26)
   Tool names (`update_slot`, …) never appear. Each tool is a backend `summary`
   (`Updated image on Hero`), never “slot”. An LLM `user_description` is not required.
   (2026-08-26)
   Always on: no hide, no collapse, no contracted composer. No **Website assistant** title.
   Clear context is a silent trash in the overlay top row. A later hide control would be
   bottom-left or bottom-right. (2026-08-26)
   Collapse is back: **reduce height** (chevrons) on the left of the overlay top row, **Clear
   context** trash on the right. Reduced is the composer only — not a hide. The overlay does
   **not** dim or black out the website; the uncovered canvas stays visible and clickable.
   (2026-08-26)
   Overlay has a small inset from the canvas: 12px on the left, right, and bottom. It is not
   flush to the canvas edges. (2026-08-26)
   Composer submit is **Plan** only while the Plan switch is on. Plan off (continuous) is
   **Send**. (2026-08-26)
   Activity lines have a kind icon: **pencil** for writes (`Updated heading on Hero`),
   **lightbulb** for thinking. There is no search/grep tool on the website assistant; do not
   use a search icon on write lines. (2026-08-26)
   Default height: **desktop** is the single-line composer (thread reduced). **Mobile**
   (≤1100px) is the expanded overlay — that height works there. Chevron still expands or
   reduces. `?assistant=expanded` / `collapsed` still forces a shot. (2026-08-26)
   **Narrow default is collapsed** (canvas first), same idea as desktop. Expanded is still
   available. `?assistant=` still forces a shot. (2026-08-27)
   Reduced composer is **max-width 40rem**, centered in the canvas (sides of the website stay
   clickable). Expand (chevrons) grows it to the 12px canvas inset — **180ms**, same ease as
   other CMS motion. Idle / unfocused is **40% opacity**; hover or focus-within is fully
   opaque. **Apply / Reject pills never fade.** (2026-08-26)
   **Desktop collapsed is one row:** chevrons, field, **Plan mode**, **Ask first**, **Plan**
   (or **Send**). No extra row above the field. Height is one control row. Switch owner copy
   is **Plan mode** so it is not a second “Plan” next to the submit button. **Clear context**
   trash is **expanded-only** (hidden while reduced, desktop and mobile). **Mobile** (≤1100px)
   collapsed stays two rows (overlay bar + composer, no trash) — that height reads well there.
   Desktop collapsed pills sit just above the bar. (2026-08-26)

3. **Website publication blockers are jumps** — The dropdown heading is **Website publication
   is blocked:** then one **silent** (no background) button per blocker, with a Lucide
   **ArrowUpRight**. A required heading, text, or image that cannot resolve jumps to that
   website section (canvas + editing panel). Owner copy does not say slot. A media library
   item on the live path that is not approved jumps to that media library item. (2026-08-26)
   After 12: a required heading, text, or image jumps to that website section’s **Content** on
   the left; an unapproved library item not on the canvas jumps to `/cms/media`. (2026-08-26)
   Owner heading is **Publishing is blocked:** (see 13). (2026-08-26)

4. **Opening hours picker is Google Calendar-style** — Details **Opening hours**: one row per
   weekday, Opens to Closes as a time range, Closed as the unavailable control, copy to
   following days, add a time block. CMS palette (white, higher contrast). Hours they pick up
   the marketing phone; no Appointment note. Persistence is still one Opens / Closes / Closed
   per day ([details ADR](../other/details/ADR.md) 6). (2026-08-26)
   Opening hours is not the first Details panel. Identity (name, story, logo) is first; hours
   sit after contact, services, and legal. (2026-08-26)

5. **Top menu and footer are Content, not workspace items** — Select the bar on the canvas;
   edit the depth-2 tree in the editing-panel **Content** tab. Look (logo, density) is
   **Website styles**, not a Design tab. Workspace items stay website pages, media library,
   website styles. HTTP is still `PATCH /v1/website/editor/menus`. (2026-08-26)
   After 12: the same Content list, on the left, after clicking the bar. No media library
   rail item. (2026-08-26)
   No Design tab on the editing panel. Density owner copy is Compact / Comfortable /
   Spacious. (2026-08-26)
   Website versions joined the workspace rail (see 11); it is not an editing-panel tab.
   (2026-08-26)
   Website page nodes pick from the website pages list (a dropdown, not free text). Text is a
   label. URL is an ads-style combobox: pick an existing URL or type to create one. **Show
   contact** is a bar CTA like Show marketing phone / email (not a tree node). Content has no
   Add below / website-component picker and no depth-2 explainer. (2026-08-26)

6. **Certifications and reviews layout is 1fr | 2fr** — Left: catalog ticks (checkbox + badge
   + name). Right: review cards in three headings: **Top reviews**, **All reviews**, **Archive**.
   Create owner-written is a route for now (`/cms/certifications-and-reviews/new`;
   look TBD). Product rules stay in [ADR.md](ADR.md) 16. (2026-08-26)
   The top reviews heading is the **ads** featured list. Pinning it does not rewrite reviews
   website sections. Website editor reviews Content is **that website section’s** ordered
   list (see 15). (2026-08-26)
   Owner copy is **All reviews** (not pool). That heading excludes cards already in Top
   reviews. Top reviews and All reviews are visually the same: plain section headings, not a
   dashed drop well. A drop-target around Top reviews is parked (see mock CSS comment).
   Archive is a collapsible heading (chevron down on the right), default collapsed — not a
   toolbar button. No hairline under the page title. (2026-08-26)

7. **The yellow strip is mock-only states** — Per-screen shortcuts for reviewing
   [design/cms.html](../../website/design/cms.html) (copy-out blocked, Ask first pending,
   pages, publication, and so on). Product destinations stay in the left nav. Hide with
   `?shot=1`. Copy-out is an error, not always-on UI. (2026-08-26)
   Always collapsible to a **circle in the top right**; tap to reopen. Default **collapsed on
   mobile** (≤1100px) so it does not eat the editor; desktop starts open. `?dev=1` / `?dev=0`
   force open / collapsed. (2026-08-26)

8. **The CMS is viewport-locked, not a scrolling document** — The window never
   scrolls. The CMS fills the viewport like a PWA: The CMS stays put, overflow is clipped at
   the CMS. Inner regions scroll only when that surface has more content than it can show
   (Details / Projects / Certifications and reviews, a workspace list, including Content).
   The retired right-hand editing panel is not a scroller. (2026-08-26)
   The website editor canvas does **not** scroll the website page: the page is clipped to the
   stage. (2026-08-26)
   The website page **does** scroll inside the canvas stage (the browser UI stays). The
   website assistant thread also scrolls. (2026-08-26)

9. **Website versions: Preview on live, rollback on earlier** — The live website version has
   **Preview** (opens the live website). It does not say Continue editing and has no rollback.
   Earlier owner website versions have a silent **website rollback** icon. Assistant activity
   is not a website version. (2026-08-26)
   The list is a workspace item at the bottom of the rail, not an editing-panel tab.
   (2026-08-26)

10. **Content head has no website-section picker** — Click the canvas to select. The head is
    the website section name, hide, and move up/down. No “Website section” dropdown and no
    “1 of 6” line. Up/down have browser tooltips **Move website section up** /
    **Move website section down**. (2026-08-26)
    Hide is an **eye**, not a switch: open = on the website, closed = hidden. A hidden
    website section stays on the canvas as a compact **Hidden** block so it can still be
    selected. It is not on the live website. (2026-08-26)
    There is no Add below / website-component dropdown on Content. Add and pick website
    sections on the canvas. (2026-08-26)

11. **Website versions sits at the bottom of the workspace rail** — It is a rare, site-wide
    control (website publications + website-assistant activity), not a website-section tab.
    Pin it to the bottom of the workspace rail, below website pages / media library /
    website styles. Selecting it opens the workspace list like any other workspace item.
    Editing-panel tabs are **Content** and **SEO**. (2026-08-26)
    Superseded as a right-hand column: see 12. (2026-08-26)

12. **Two-panel website editor** — Surfaces are the global sidebar, the workspace (rail + one
    list), and the canvas (plus the website assistant). There is no right-hand editing panel
    and no **Edit** handle. Default is still rail-only until a workspace item or a canvas
    selection opens the list.
    **Workspace rail:** Website pages, **SEO**, Website styles, Website versions (bottom).
    **SEO** is its own rail panel and always shows the **current website page** (the one on
    the canvas). It is not under the pages list, not a tab, and not always-on in the
    rail-only default.
    **Content** is not a rail item. Click a website section or an image on the canvas and the
    left list **replaces** with Content — the same closed union as the old Content tab
    (slots, image attach, reviews, top menu, footer, website form, projects), plus the
    section head (name, hide, move). Clicking an image focuses that image (thumb, pick from
    the media library, upload/drop). Website pages on the rail (or a quiet back) returns to
    the pages list.
    No **media library** rail item. Attach/pick lives in Content on image select. `/cms/media`
    stays the full-screen route (Ads, Details logo, crop / focal / cleanup). Owner copy
    **website style** / **website styles** is the same singular/plural as website page /
    website pages. (2026-08-26)
    Content has no back chevron. Website pages on the rail returns to the pages list.
    (2026-08-26)
    Pending-review AI image warning is in Content when that image is selected. It is not
    copy on the website. (2026-08-26)
    **Mobile** (≤1100px): the workspace rail is a **bottom bar**. Website versions stays at
    the end. The list (and Content) opens above that bar, not beside it. (2026-08-26)
    Safe-area padding on that bar. The list/Content sheet stays a cap so the canvas remains
    visible (~45vh). (2026-08-27)

13. **The website editor control is Publish** — Owner copy is the verb **Publish** (toolbar
    dropdown), not the noun **website publication**. Blocked heading: **Publishing is
    blocked:**. Host status uses **Last published**. Specs still say website publication for
    the act. (2026-08-26)

14. **Website editor toolbar has no Home crumb** — Sites in the global nav is enough. Drop
    the **Home** back control on desktop and mobile.    **Desktop / Tablet / Mobile** and
    **Publish** stay on **one row** (title can sit above on a narrow canvas). (2026-08-26)
    On narrow, **Open destinations** (`PanelLeft`) sits **inline with the heading** (left of
    **Website editor**), not an extra bar and not on the viewport/Publish row. (2026-08-27)

15. **Reviews Content is that website section’s ordered list** — Not the Profile top band.
    Add from all reviews, remove, reorder. Cap is the website component’s max (some layouts take
    3, others 6 or 8). Owner copy: reviews **on this website section**. Product: [ADR.md](ADR.md)
    16. (2026-08-26)

16. **The CMS is narrow-first** — Owners use it on a small screen. A wide screen is extra width, not
    the default story. Global nav copies placis-web `DashboardShell`. (2026-08-27)
    **Narrow (≤1100px):** a **full-screen overlay selector** covers `main` (labels, active
    fill, **Placis** + `PanelLeft` to close). No leftover `3rem` rail. Open destinations is
    inline with the screen heading. Overlay rows: New chat, Sites, Business details, Projects,
    Certifications and reviews, Media library, Ads. Profile is not a row. Workspace bottom
    bar is **Sites only**. Website assistant default is **collapsed**. Canvas website-width
    defaults to **Mobile**. Touch targets 44px; review grips visible without hover.
    Notifications sit above the workspace bar. Safe-area padding on overlay, bar, assistant.
    **Wide (≥1101px):** sidebar stays permanently collapsible (default collapsed icon rail,
    hover peek, click to pin). Profile icon still goes to Business details. Sites/Ads/Profile
    do not invent a second global nav. (2026-08-27)
