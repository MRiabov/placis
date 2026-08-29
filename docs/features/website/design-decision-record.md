# Website design decision record

Look and interaction for The CMS website editor. Architecture stays in [ADR.md](ADR.md).
Screens: [frontend.md](frontend.md). Tokens: [CMS design.md](../../general-architecture/cms/design.md). CMS nav / `/cms` / theme:
[CMS design decision record](../../general-architecture/cms/design-decision-record.md). Mock:
[cms.html](../../design/cms.html).

Status: decided (2026-08-26, product owner). Update an entry (keeping the old
decision + date) instead of silently rewriting history. One number is one
decision. **Why** is owner-written; omit it rather than inventing it. Vacated
numbers are HTML comments so later entries keep their numbers.

## Decisions

1. **Canvas is the wide column** — On `/cms/website`, The CMS is quiet by
   default: the CMS left nav collapsed to icons, workspace **rail-only** (list
   closed until a workspace item is opened), editing panel **closed** until a
   website section is selected or the **Edit** handle is used. The three
   surfaces remain canvas, workspace, editing panel; they do not all sit open at
   once. Two-panel: no right column and no Edit handle; see 12. (2026-08-26)

2. **Website assistant is a pinned composer, not a toolbar button** — No toolbar
   **Website assistant** control. The composer is always on, pinned to the
   bottom of the canvas. Default **contracted** (one-line textbox). Expanded: at
   least half the canvas column, dims and **blocks** clicks on the covered
   website. Contracted and idle: about **40% opacity** so it stays out of the
   way; hover or focus makes it opaque. **Apply / Reject pills never fade.**
   Expand / collapse from the composer chevron. Clear context is the trash icon
   on the composer. Overlay is one chat-like thread; tool calls are silent; Ask
   first Apply / Reject is bulk for the pending turn, as pills on the canvas
   above the chatbot. (2026-08-26) Tool names (`update_slot`, …) never appear.
   Each tool is a backend `summary` (`Updated image on Hero`), never “slot”. An
   LLM `user_description` is not required. (2026-08-26) Always on: no hide, no
   collapse, no contracted composer. No **Website assistant** title. Clear
   context is a silent trash in the overlay top row. A later hide control would
   be bottom-left or bottom-right. (2026-08-26) Collapse is back:
   **reduce height** (chevrons) on the left of the overlay top row,
   **Clear context** trash on the right. Reduced is the composer only — not a
   hide. The overlay does **not** dim or black out the website; the uncovered
   canvas stays visible and clickable. (2026-08-26) Overlay has a small inset
   from the canvas: 12px on the left, right, and bottom. It is not flush to the
   canvas edges. (2026-08-26) Composer submit is **Plan** only while the Plan
   switch is on. Plan off (continuous) is **Send**. (2026-08-26) Activity lines
   have a kind icon: **pencil** for writes (`Updated heading on Hero`),
   **lightbulb** for thinking. There is no search/grep tool on the assistant; do
   not use a search icon on write lines. (2026-08-26) Default height:
   **desktop** is the single-line composer (thread reduced). **Mobile**
   (≤1100px) is the expanded overlay — that height works there. Chevron still
   expands or reduces. `?assistant=expanded` / `collapsed` still forces a shot.
   (2026-08-26) **Narrow default is collapsed** (canvas first), same idea as
   desktop. Expanded is still available. `?assistant=` still forces a shot.
   (2026-08-27) Product term is **Assistant**. Overlay look for every CMS
   assistant screen: [assistant design decision record](../assistant/design-decision-record.md). (2026-08-28) Reduced
   composer is **max-width 40rem**, centered in the canvas (sides of the website
   stay clickable). Expand (chevrons) grows it to the 12px canvas inset —
   **180ms**, same ease as other CMS motion. Idle / unfocused is
   **40% opacity**; hover or focus-within is fully opaque.
   **Apply / Reject pills never fade.** (2026-08-26)
   **Desktop collapsed is one row:** chevrons, field, **Plan mode**,
   **Ask first**, **Plan** (or **Send**). No extra row above the field. Height
   is one control row. Switch owner copy is **Plan mode** so it is not a second
   “Plan” next to the submit button. **Clear context** trash is
   **expanded-only** (hidden while reduced, desktop and mobile). **Mobile**
   (≤1100px) collapsed stays two rows (overlay bar + composer, no trash) — that
   height reads well there. Desktop collapsed pills sit just above the bar.
   (2026-08-26) Apply / Reject sit immediately above the website assistant
   overlay (collapsed and expanded). They are not at the vertical middle of the
   canvas. (2026-08-27) Ask first pending is the pills plus the pending outline
   on changed website sections. Do not paint **Not applied** as copy on the
   website. (2026-08-27) (2026-08-29): The call is the top-right **Assistant**
   button ([assistant design decision 11](../assistant/design-decision-record.md)), not a pinned-always composer.
   Default is closed. Overlay / Voice orb still use this canvas geometry after
   they call.

3. **Website publication blockers are jumps** — The dropdown heading is
   **Website publication is blocked:** then one **silent** (no background)
   button per blocker, with a Lucide **ArrowUpRight**. A required heading, text,
   or image that cannot resolve jumps to that website section (canvas + editing
   panel). Owner copy does not say slot. A media library item on the live path
   that is not approved jumps to that media library item. (2026-08-26) After 12:
   a required heading, text, or image jumps to that website section’s
   **Content** on the left; an unapproved library item not on the canvas jumps
   to `/cms/media`. (2026-08-26) Owner heading is **Publishing is blocked:**
   (see 13). (2026-08-26) Host rows and New URL stay one group of actions (open
   a host, Connect). Blockers sit after that group, not between website
   addresses and New URL. The dropdown is actions, not a status card of labels.
   (2026-08-27) (2026-08-29) When the subscription is not active, a third jump:
   **Pay the subscription price to Publish** → Usage & billing. Not extra usage
   credit. Live website rollback uses the same jump.

<!-- placeholder - insert design decision 4 here -->

5. **Top menu and footer are Content, not workspace items** — Select the bar on
   the canvas; edit the depth-2 tree in the editing-panel **Content** tab. Look
   (logo, density) is **Website styles**, not a Design tab. Workspace items stay
   website pages, media library, website styles. HTTP is still
   `PATCH /v1/website/editor/menus`. (2026-08-26) After 12: the same Content
   list, on the left, after clicking the bar. No media library rail item.
   (2026-08-26) No Design tab on the editing panel. Density owner copy is
   Compact / Comfortable / Spacious. (2026-08-26) Primary, Neutral, and Accent
   are color pickers (the color chip). Hex is not on the field; it is only
   inside the picker. (2026-08-27) Website versions joined the workspace rail
   (see 11); it is not an editing-panel tab. (2026-08-26) Website page nodes
   pick from the website pages list (a dropdown, not free text). Text is a
   label. URL is an ads-style combobox: pick an existing URL or type to create
   one. **Show contact** is a bar CTA like Show marketing phone / email (not a
   tree node). Content has no Add below / website-component picker and no
   depth-2 explainer. (2026-08-26) Radius is a corner selector (`none` / `xs` /
   `sm` / `md` / `lg`), not a text dropdown. Each option shows that corner.
   Density is a spacing selector (Compact / Comfortable / Spacious), not a text
   dropdown. Each option shows that spacing. (2026-08-28)

<!-- placeholder - insert design decision 6 here -->

<!-- placeholder - insert design decision 7 here -->

8. **The website page scrolls inside the canvas stage** — The website editor
   canvas does **not** scroll the website page: the page is clipped to the
   stage. (2026-08-26) The website page **does** scroll inside the canvas stage
   (the browser UI stays). The website assistant thread also scrolls.
   (2026-08-26) Scroll room at the bottom of the website clears the website
   assistant overlay and Apply / Reject, so the last website sections can sit
   above them. That extra room is the canvas cell background, not a white pad.
   (2026-08-27)

9. **Website versions: Preview on live, rollback on earlier** — The live website
   version has **Preview** (opens the live website). It does not say Continue
   editing and has no rollback. Earlier owner website versions have a silent
   **website rollback** icon. Assistant activity is not a website version.
   (2026-08-26) The list is a workspace item at the bottom of the rail, not an
   editing-panel tab. (2026-08-26)

10. **Content head has no website-section picker** — Click the canvas to select.
    The head is the website section name, hide, and move up/down. No “Website
    section” dropdown and no “1 of 6” line. Up/down have browser tooltips
    **Move website section up** / **Move website section down**. (2026-08-26)
    Hide is an **eye**, not a switch: open = on the website, closed = hidden. A
    hidden website section stays on the canvas as a compact **Hidden** block so
    it can still be selected. It is not on the live website. (2026-08-26) There
    is no Add below / website-component dropdown on Content. Add and pick
    website sections on the canvas. (2026-08-26)

11. **Website versions sits at the bottom of the workspace rail** — It is a
    rare, site-wide control (website publications + website-assistant activity),
    not a per-website-section tab. Pin it to the bottom of the workspace rail,
    below website pages / media library / website styles. Selecting it opens the
    workspace list like any other workspace item. Editing-panel tabs are
    **Content** and **SEO**. (2026-08-26) Superseded as a right-hand column: see
    12. (2026-08-26)

12. **Two-panel website editor** — Surfaces are the global sidebar, the
    workspace (rail + one list), and the canvas (plus the website assistant).
    There is no right-hand editing panel and no **Edit** handle. Default is
    still rail-only until a workspace item or a canvas selection opens the list.
    **Workspace rail:** Website pages, **SEO**, Website styles, Website versions
    (bottom). **SEO** is its own rail panel and always shows the
    **current website page** (the one on the canvas). It is not under the pages
    list, not a tab, and not always-on in the rail-only default. **Content** is
    not a rail item. Click a website section or an image on the canvas and the
    left list **replaces** with Content — the same closed union as the old
    Content tab (slots, image attach, reviews, top menu, footer, website form,
    projects), plus the section head (name, hide, move). Clicking an image
    focuses that image (thumb, pick from the media library, upload/drop).
    Website pages on the rail (or a quiet back) returns to the pages list. No
    **media library** rail item. Attach/pick lives in Content on image select.
    `/cms/media` stays the full-screen route (Ads, Details logo, crop / focal /
    cleanup). Owner copy **website style** / **website styles** is the same
    singular/plural as website page / website pages. (2026-08-26) Content has no
    back chevron. Website pages on the rail returns to the pages list.
    (2026-08-26) Pending-review AI image warning is in Content when that image
    is selected. It is not copy on the website. (2026-08-26) **Mobile**
    (≤1100px): the workspace rail is a **bottom bar**. Website versions stays at
    the end. The list (and Content) opens above that bar, not beside it.
    (2026-08-26) Safe-area padding on that bar. The list/Content sheet stays a
    cap so the canvas remains visible (~45vh). (2026-08-27) The open list /
    Content has the same reduce chevrons as the website assistant, on the left
    of the sheet title. The whole title row hides the sheet (Add a website page
    and Content controls stay their own hits). The row is compact, in line with
    the list. That hides the sheet back to the bottom bar so the canvas is not
    covered. (2026-08-27)

13. **The website editor control is Publish** — Owner copy is the verb
    **Publish** (toolbar dropdown), not the noun **website publication**.
    Blocked heading: **Publishing is blocked:**. Host status uses
    **Last published**. Specs still say website publication for the act.
    (2026-08-26)

14. **Website editor toolbar has no Home crumb** — Drop the **Home** back
    control on desktop and mobile. **Desktop / Tablet / Mobile** and **Publish**
    stay on **one row** (title can sit above on a narrow canvas). (2026-08-26)
    On narrow, **Open destinations** (`PanelLeft`) sits
    **inline with the heading** (left of **Website editor**), not an extra bar
    and not on the viewport/Publish row. (2026-08-27) On narrow, Desktop /
    Tablet / Mobile are **icons** (44px hits; visible labels hidden) so Publish
    still fits that row at 320px. Wide keeps the words. (2026-08-27)

15. **Reviews Content is that website section’s ordered list** — Not the Profile
    top band. Add from all reviews, remove, reorder. Cap is the website
    component’s max (some layouts take 3, others 6 or 8). Owner copy: reviews
    **on this website section**. Product: [ADR.md](ADR.md) 16 and
    [certifications-and-reviews ADR](../business-profile/certifications-and-reviews/ADR.md). (2026-08-26)

16. **Website editor canvas is narrow-first** — **Narrow (≤1100px):** Workspace
    bottom bar is **Sites only**. Website assistant default is **closed** (call
    from top-right **Assistant**). (2026-08-29; previously **collapsed**
    2026-08-27)
    Canvas website-width defaults to **Mobile**. Viewport controls stay on
    `/cms/website` only. (2026-08-27) Canvas widths are native: Desktop
    **1080**, Tablet **760**, Mobile **390**. If the stage is wider, Mobile and
    Tablet stay those widths (do not stretch). **Desktop fills the stage**
    (layout grows with the column; no 1080 card in a sea of grid). If the stage
    is narrower, CSS `transform: scale()` shrinks the frame to fit; the
    contractor website still lays out at the native width (iframe or in-process
    renderer, same scale). Do not reflow Mobile or Tablet with `width: 100%` /
    `max-width: 100%`. Do not pan the stage. Never scale Mobile or Tablet up
    past
    1. (2026-08-27)
    **Wide** canvas website-width defaults to **Desktop**. Crossing the 1100px
    line to wide restores Desktop; crossing to narrow still selects Mobile.
    (2026-08-27)

<!-- placeholder - insert design decision 17 here -->

18. **Website editor voice agent is DustOrb, not a full-screen takeover** —
    Empty composer turns the **voice agent** on. Geometry: orb
    `min(5.5rem, 30vw)` bottom-right of the canvas. Clicks pass through except
    Restore chatbot and close. Restore chatbot is an **opaque pill** under Apply
    / Reject. Look is DustOrb (particle orb), not a soft glowing CSS circle —
    that HTML was a stand-in. Dispatcher: [assistant](../assistant/README.md). **Follow** is default
    **on**; the owner cannot turn it off; canvas snaps to the website slot the
    **agent** is editing. (2026-08-27: glow mock + Follow off. 2026-08-28:
    DustOrb; Follow on. Same day, later: [cms.html](../../design/cms.html) uses [dust-orb.js](../../design/dust-orb.js); bounce
    on hover/tap and while speaking. Same day, later: scale matches placis-web
    OrbDemo (`hover:scale-[1.03]`, speaking `scale-110`, 500ms); dust recycles
    from the centre and the cursor pulls it. Same day, later: Voice asks for the
    microphone and bounces from owner noise level. Same day, later: mock
    greeting [cms-voice-greeting.mp3](../../design/cms-voice-greeting.mp3) when the orb comes on. Same day, later:
    ≤480px orb **50vw** (`min(50vw, 50dvh)`); wider **30vw**
    (`min(30vw, 24rem)`), not `min(5.5rem, 30vw)`. Same day, later: wider is
    `min(5.5rem, 30vw)` again; ≤480px stays **50vw**. Apply / Reject over
    Restore chatbot stay a compact cluster; the cluster does not stretch across
    the canvas. Same day, later: desktop / tablet click target is a
    **2.75rem circle**; particle wrap stays `min(5.5rem, 30vw)`; clicks outside
    the circle pass through. Close and Restore chatbot still capture. ≤480px hit
    is `min(12rem, 42vw)`. Same day, later: denied microphone restores the
    chatbot and the shared **notification**; **Try again** and
    **Switch to text mode** (not Revert / OK). Same day, later: the prerecorded
    greeting plays on the first Voice start; starting Voice again more than
    **5 seconds** after that greeting began does not replay it. Same day, later:
    the realtime connection is created only after the microphone is granted.) On
    narrow the orb sits at the **bottom of the canvas** (just above the
    workspace rail). (2026-08-27)

19. **Connect website address shows copyable Host and Value** — DNS rows are not
    compact version cards. Each record is type, **Host**, and **Value** as
    separate large fields with Copy. Status (waiting for DNS → waiting for
    certificate → active) sits on the modal, not inside Value. On-screen how-to:
    add these at GoDaddy, Porkbun, or Squarespace (where the domain already
    lives); copy Host into name/host and Value into value/points-to; do not move
    nameservers to Placis. (2026-08-27)

20. **Content image pick is Upload, not Drop files here** — Owner copy is pick
    from the media library and **Upload**. Drop onto Upload still uploads.
    Thumbs keep landscape / square / portrait ratio; dozens of photos. Same
    thumbs as `/cms/media` and the project cover overlay. (2026-08-29)
