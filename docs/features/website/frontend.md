# Website Frontend Specification

Status: proposed frontend specification. Screens already exist under
`frontend-2/src/features/cms/`; this doc names them against the Go contract.

Related: [PRD](prd.md), [editing.md](editing.md), [assistant.md](assistant.md),
[manifest](manifest.md), [design decision record](design-decision-record.md). Port: [frontend-debloat.md](frontend-debloat.md).

## Purpose

The contractor-facing website editor in `frontend-2`, under `/cms/website` (left-nav **Sites**).
Details, Projects, and Certifications and reviews still appear on website pages; they are
edited on their own screens ([business profile](../business-profile/README.md)), not in this
website editor. The media library is `/cms/media`.
Attach and pick from Content when an image is selected on the canvas. Ads and the live
contractor website are separate.

Stack: Vite + React + TanStack Router, generated API types. The canvas renders unpublished
website sections through the shared contractor-website component package — the same package the
live website uses.

The frontend holds **one** website editor projection in React. Edits mutate that working copy
first; the canvas paints it. PATCH copies the change to the backend; it does not round-trip the
projection to re-render ([editing.md](editing.md)). Text copies out on click-off, not while
typing. A 500ms safety timer coalesces sends so `429` is rare. There is **no Save** and no
Saving / Saved indicator. If a copy-out or upload has not succeeded after 10 seconds, show a
visible error ([editing.md](editing.md)). If a copy-out or upload is in flight or has failed,
leaving is blocked until it succeeds or the owner confirms discard. It does not
accumulate unpublished documents in memory. Edits do not keep a second unpublished copy.
Opening `/cms/website` hydrates undo/redo stacks from website edit history (last 200
batches). Switching website page GETs the unpublished website only. Ctrl+Z is
in-memory, then the ordinary PATCH. No `/undo` or `/redo` routes. The predecessor
`EditorHeader` Save control is dropped.

Loading placeholders: every screen, per field / row / website slot — not swapping the whole panel
([frontend.md](../../general-architecture/frontend.md)).

## Routes

| Route | Purpose |
| -- | -- |
| `/cms/website` | Website editor (workspace, canvas, website assistant, website publication) |

Left nav, New chat, `/cms/details`, `/cms/projects`, `/cms/certifications-and-reviews`,
`/cms/media`, `/cms/ads`: [The CMS (sidebar + main area)](../../general-architecture/cms/frontend.md).

No `/cms/proof`. No `/cms/profile` (Profile is a disclosure). Attach from Content when an image is selected. See [media library](../other/media/README.md).

## Website editor (`/cms/website`)

Two surfaces plus global nav, one unpublished website:

- **Canvas** — the selected website page, live from its website sections. Not a website preview.
- **Workspace** — on a **narrow** screen (≤1100px) the rail is a **bottom bar** (Sites only)
  and the list opens above it. That open list (and Content) has the same reduce chevrons as
  the website assistant, on the left of the title: hide the sheet back to the bottom bar.
  The whole title row does that hide (Add a website page stays its own control). The row is
  compact, not a second toolbar. That is not a back to Website pages. On a **wide** screen it is a left rail plus one list.
  **Workspace items** on the rail: website pages, SEO,
  website styles, website versions. Selecting one **opens** the workspace list. Default on
  `/cms/website` is rail-only (list closed). **Website versions** is pinned to the end of
  the rail (bottom on a wide screen, trailing on a narrow screen). **SEO** is its own rail panel and always shows the current website page (the
  one on the canvas). It is not under Website pages and not a tab. There is no media library
  rail item; attach / pick / drop-on-image live in **Content** when an image is selected (same
  library as `/cms/media`). Crop / focal / cleanup and Ads / Details logo stay on `/cms/media`
  ([media library](../other/media/README.md): large view, promptable cleanup, dense mixed-ratio
  thumbs).
  Top menu and footer are **not** workspace items; select the bar on the canvas and edit it in
  Content.
- **Content** is not a rail item. Click a website section or an image on the canvas and the
  workspace list **replaces** with Content (the closed union below). There is
  no right-hand editing panel and no **Edit** handle. There is no website-section picker —
  click the canvas. There is no back chevron on Content; Website pages on the rail returns
  to the pages list. The Content head is the website section name, an **eye** (hide / show),
  and move up/down (browser tooltips: Move website section up / down). Open eye = on the
  website; closed = hidden. A hidden website section stays on the canvas as a compact
  **Hidden** block so it can still be selected; it is not on the live website. Look (logo,
  density, colors) is
  **Website styles** on the workspace rail. Content is a **closed union** keyed by **website
  component** (do not say “section type”):
  - **Reviews** — the ordered reviews **on this website section**. Add from all reviews, remove,
    reorder. Cap is that website component’s max (some layouts take 3, others 6 or 8). Immediate
    unpublished `website_slot_reviews` rewrite for **this** website section only. A service
    website page can use a different set than Home. Overlap across sections is allowed. This
    is not **top reviews** (those stay on Certifications and reviews for ads). Empty array:
    keep the website section (no fake copy; do not hide the website component).
  - **Top menu / footer** — depth-2 tree (website page / text / URL, one dropdown). A
    website page is a dropdown of website pages, not free text. Text is a label. URL is a combobox:
    pick an existing URL or type to create one. Bar CTAs: show/hide marketing phone, marketing
    email, and **contact**. Do not edit those numbers here. Look (logo, density) is Website styles,
    not this panel. No Add below picker and no depth-2 explainer on this panel.
  - **Website form** — title, typed fields, privacy notice, `submit_action`.
  - **Projects** — the project gallery for that website section. Title / description / cover
    stay at `/cms/projects` ([projects frontend](../business-profile/projects/frontend.md)).
  - Everything else — website slots.
  Click an image on the canvas: Content focused on that image (thumb, pick from the media library,
  upload/drop). SEO stays website-page-level in its own rail panel. Website versions
  is a workspace item (bottom of the rail):
  website publications and website-assistant activity, not unpublished checkpoints per website page. Undo/redo stacks
  are in RAM, seeded from website edit history on `/cms/website` open; they are not a
  timeline UI. Onboarding-written website versions are omitted (not website-rollback targets).

Website styles are tenant-wide (`website_settings`), shown on the website page GET, applied only on
explicit apply. Top menu and footer are edited in **Content** as a **depth-2 tree** (bar + one
dropdown; website page / text / URL nodes). Website page picks from website pages; URL is a
combobox (existing or create). Bar CTAs: marketing phone, marketing email, and contact.
Look (logo, density) is **Website styles**, not a Design tab. Logo store is
`logo_media_asset_id` on Details (pick from the media library). Publication may emit
`{{logo_url}}` only from that file — not a hotlink and not a `website_settings` URL.
Owner-facing density labels are Compact, Comfortable, Spacious (API stays
`compact` / `comfortable` / `spacious`). Primary, Neutral, and Accent are color pickers
(the color chip). Hex is not on the field; it is only inside the picker.

**Publish** is a toolbar **dropdown**, not one toolbar button and not Save. Specs still call
the act **website publication**. There is no **Home** back control; Sites in the global nav
is enough. **Desktop / Tablet / Mobile** and **Publish** stay on one row (the title may sit
above that row on a narrow canvas). On narrow those three are icons (44px hits) so Publish
fits; wide keeps the words. The canvas lays out the contractor website at native widths
(Desktop 1080, Tablet 760, Mobile 390). If the stage is larger, Mobile and Tablet stay those
widths; **Desktop fills the stage**. If the stage is smaller, CSS `transform: scale()` (same as
scaling an iframe) shrinks the frame to fit; the website still lays out at the native width.
Do not reflow Mobile or Tablet (`max-width: 100%`) and do not pan the stage. Never scale
Mobile or Tablet up past 1.
Publish is
blocked while required website slots cannot resolve or media library items on the live path
are not approved. Blockers in the dropdown are a short heading (**Publishing is blocked:**)
plus **one silent jump per
blocker** (no background): the website section in Content, or `/cms/media` for an unapproved
library item not on the canvas. Each jump uses a
Lucide **ArrowUpRight**. After a successful website publication, `has_unpublished_changes` is
false until the next edit. The POST sends `website_address_id`: that host’s R2 tree, then purge
**that** host ([api.md](api.md), [cloudflare.md](cloudflare.md)). The **host row** is the Publish
click. Hosts can diverge.

Live **website rollback** (`POST …/publications/{id}/rollback`) returns that publication
`*Read`; the dropdown and Website versions list update from the body. Rollback is on
**earlier owner website versions**, not the live one. **Preview** on the live website version
opens the live website in a new tab. Do not label that **Continue editing**, and do
not call it a website preview (that is the sales stage). Loading an owner website version
into the unpublished canvas (`GET` with `publication_id`, then PATCH) is not a Website
versions control in this UI.

Rows:

1. **Preview website address** — `{website_prefix}` plus the suffix in
   [cloudflare.md](cloudflare.md). Always listed after website activation. Open in a new tab when
   `latest/` exists. Status: not published yet / **Last published** (time). This is the live
   URL in the website editor until (and alongside) a website address. Product copy:
   **preview website address**. Do not call this host website preview after website
   activation (while unactivated it **is** the website preview).
2. **Each connected website address** (`acme.ie`) — listed once Connect website address
   has a hostname. Disabled until `website_addresses.status=active` (waiting for DNS /
   certificate).
3. **New URL** — not a website publication. Opens the **Connect website address** modal.

Those three rows are one group. **Publishing is blocked:** jumps sit **after** that
group, not between website addresses and New URL. Host rows are actions (open in a new tab,
or reopen Connect while waiting). New URL is Connect, with a plus. Do not lay this out as a
status card of labels.

**Connect website address** is the point-their-hostname-at-us flow. It is a **modal over the
website editor** on `/cms/website` (overlay, no new route, no left-nav item). The owner types
`acme.ie` or `www.acme.ie`. The API creates the Cloudflare custom hostname and returns copyable
DNS rows (type, Host, Value): TXT for the certificate, and CNAME (or ALIAS / later Apex Proxying
`A`) as in [cloudflare.md](cloudflare.md). Each row shows Host and Value as separate large fields
with Copy; status is not mixed into the value. On-screen how-to: add these at the DNS panel where
the domain already lives (GoDaddy, Porkbun, or Squarespace) — copy Host into name/host and Value
into value/points-to; do not move nameservers to Placis. Status in the modal: waiting for DNS →
waiting for certificate → active (the website editor polls Go; Go polls Cloudflare). Close returns
to the website editor. The host then appears as row 2; it is enabled when active. Re-open the
modal from New URL or from a still-waiting host to copy records again. Website publication does
**not** attach a website address.

Do not advertise `{website_prefix}.placis.com` as a live URL.

**Website assistant** is a default-on **overlay** pinned to the bottom of the canvas (not a
toolbar button, not a modal) while the **chatbot** is showing. Empty composer turns the
**voice agent** on: overlay hidden, soft orb bottom-right of the canvas (glow that falls
off, no hard edge). On narrow that is just above the workspace rail, not above the hidden
overlay. The switch is a fade, not a cut. Restore chatbot is an opaque pill under Apply /
Reject; the orb is a circle on the right spanning both rows. A small close on the top-right of the orb also
restores. Tools and apply stay in [assistant.md](assistant.md). Two overlay switches: plan vs
continuous, and instant apply vs Ask first (Apply / Reject). **Follow** is a third config,
default off, not owner-turnable. Default is plan + Ask first. Composer submit is **Plan**
when Plan is on, **Send** when Plan is off (continuous); empty chatbot field shows **Voice**.

**Quiet by default.** On a **narrow** screen the canvas is the destination until they open
destinations. The CMS is viewport-locked (PWA): the window does not
scroll. The website page scrolls inside the canvas stage; the website assistant thread scrolls.
Last website sections can scroll clear of the website assistant overlay (and Apply / Reject).
See [design decision record](design-decision-record.md) 8 and 16.

```text
narrow (≤1100px):
Open destinations (inline with Website editor) | heading
Desktop / Tablet / Mobile + Publish
website (canvas) + voice agent orb (empty composer) or website-assistant overlay
workspace rail (bottom bar; list / Content opens above it)
full-screen overlay selector covers all of that when open

wide (≥1101px):
nav (collapsed icons, hover peek, click to pin) | workspace (rail + one list) | website (Desktop canvas)
                                                                     | voice agent orb or website-assistant overlay
```

- **Always on** when `/cms/website` is open (overlay while the chatbot is showing; orb when
  the voice agent is on). There is no toolbar **Website assistant** control
  and no overlay title. It does not open a modal. Overlay has a 12px inset from the canvas
  on the left, right, and bottom (not flush to the edges). Chevrons expand or reduce; that is
  not a hide. **Collapsed** (desktop and narrow default) is one row on a wide screen:
  chevrons, field, **Plan mode**, **Ask first**, **Plan** (or **Send**). On narrow, collapsed
  stays two rows (overlay bar + composer). Reduced composer is **max-width 40rem**, centered;
  expand grows it to the 12px canvas inset (180ms). **Narrow default is collapsed** (canvas
  first). Idle /
  unfocused overlay is **40% opacity**; hover or focus-within is opaque. The overlay does
  **not** dim or black out the website; clicks on the uncovered canvas still work.
  **Apply / Reject pills never fade.**
- **Clear context** — silent trash on the **right** of the overlay top row, **expanded only**
  (hidden while reduced). Starts a new thread (drops
  prior turns). Discards pending Ask-first proposals that have not been Applied (same as
  Reject those). Does **not** undo already-Applied batches. Not a glossary term; it is a
  control.
- **Ask first applied vs not applied** must be obvious. The overlay is **one chat-like thread**.
  Ask first **Apply / Reject is per pending turn** (the whole run’s tools in bulk), not per tool.
  Those two actions are **pills on the canvas**, always sitting immediately above the website
  assistant overlay (chatbot) or in the left stack next to the orb
  (voice agent), not inside the thread and not
  at the canvas midpoint. Each tool in the
  thread is the backend `summary` (`Updated image on Hero`),
  never a tool name and never “website slot” ([assistant.md](assistant.md)). Write lines use a
  **pencil**; thinking uses a **lightbulb**. There is no search/grep tool.
  - **Pending** — canvas paints the proposal in memory; changed website sections use the
    pending outline. Nothing PATCHed. Apply and Reject pills shown. Do not paint
    **Not applied** as copy on the website.
  - **Applied** — canvas is the unpublished website; proposal overlay gone. Pills gone (one-way).
  - **Rejected** — canvas back to pre-proposal. Pills gone.

Apply mutates the in-memory projection, then the ordinary PATCH; **Apply** / **Reject** only
record activity metadata. They are one-way; there is no revert-after-apply on the unpublished
website. A Details tool write (`update_details`) is applied immediately and uses the shared
**notification** Revert (`POST /v1/business-profile/edits/{id}/undo`), not these pills.
Ctrl+Z after Apply
is in-memory undo of that batch, then PATCH — not Apply then Reject. Pending-review AI images
may attach on the unpublished canvas; the warning is in **Content** when that image is
selected, not copy on the website. Owner approval makes them approved. Website publication
still requires approved media assets.

