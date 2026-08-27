# Ad Generation Frontend Specification

Status: proposed frontend specification.

Related docs:

1. [Ad generation PRD](prd.md)
2. [Ad generation technical implementation](technical-implementation.md)
3. [Ad generation ADR](ADR.md)
4. [frontend-debloat.md](frontend-debloat.md) — `frontend-2` port: keep / delete / retarget

## Purpose

This spec covers **Ads** in the CMS (`frontend-2/`), under `/cms/ads`.
It is the contractor-facing UI for the ad generation service: create an ad, review LLM
drafts, edit, approve, and download. It is one caller of the service; it is not the website editor,
not the media library, and not campaign management (which is future work).

`/cms/ads` is a **view in the CMS, not a standalone website page**: the left
sidebar (New chat, Sites, Profile with Business details, Projects, Certifications and reviews,
and Media library) stays around
it, and Ads is dashboard-ish content in the main area — My ads list, the ad workspace, and the ad
detail all render inside that frame. The mock shows the sidebar for context.

Stack: Vite + React + TanStack Router (the `/cms/*` island), generated API types, Tailwind +
Radix, Kibo/shadcn components where they fit. Ads follows the existing workspace
patterns (projects-style: list, copy fields, media picker modal, blocker panel).

## Principles

These principles shape every screen in this workspace:

1. **Who first, how second** — the workflow decides who the ad is for (ideal customer profile)
   before any ad mechanics. How people get in touch is always a Meta ad lead form. The owner
   picks one ad format as pills before generate; crops then follow from that format automatically.
2. **Business details, not ad jargon** — the UI talks about the business: what you promote, who
   it's for, how people get in touch, photos, text. Internal jargon and ratios like 1:1 or 9:16
   never appear in the UI.
3. **Approve is the last step of the screen** — first create the ad and review its content, then
   approve at the bottom of the flow. Approval is not a toolbar action.
4. **Generation is not instant** — LLM drafting and photo picking run in the background; the
   flow is progressive and never blocks. The owner can leave and come back later.
5. **Media captions help** — we write the media caption (LLM) for the picker and later
   generates. The picker shows it when it exists; the owner is never asked to label a
   photo. A photo the owner just added to this ad does not wait on a media caption.

## Design Mock

A static HTML mock of the workspace lives at `design/ads-workspace.html` — open it in a browser
directly (no build). It shows the current direction: **one accordion wrapper with two
expandable steps, both visible immediately** — step 1 "About the ad" (open by default, all the
questions), step 2 "Review" (visible but locked — "Complete step 1 to unlock" — and
expands once step 1 is complete; after generate, About the ad is confirmed until **Revise**
on the generate row), then the approve block when the ad is ad ready to post.
The combobox is closed by default with a conditional "create new". Format pills are single-select
(one format per ad) using owner-facing names (Square feed, Portrait feed, Carousel, Story) — no
ratios, no ad-set jargon.
The mock is skinned to match the CMS home composer in
`frontend-2`: **white canvas**, Satoshi / Helvetica Neue / Arial, `#e1e1e1` hairlines,
`#fafafa` titles (not a blue-gray wizard look), 28px composer radius and the
prompt's soft shadow on the accordion and ad cards, sunken 10px fields, 36px controls
(8px control radius — same as the rest of the CMS). Pills are only for format selection and
status badges, not for actions. The real implementation imports the app globals and should reuse the
dashboard prompt look rather than duplicate a palette.

**My ads / New ad / Review** at the top of the mock are a **developer scene switcher only**
(dashed "Dev only" strip). They are not product tabs and must not ship. The owner reaches Ads from
the ad list (`+ New ad`, open a card) and, on the workspace, the About the ad / Review
accordion. Screenshots pass `?shot=1` so the strip is hidden.

## Routes

| Route | Purpose |
| -- | -- |
| `/cms/ads` | Ad list |
| `/cms/ads/new` | Starts a new ad (opens the same screen) |
| `/cms/ads/{id}` | Ad detail (existing ad); "Edit" opens the ad workspace |

There are only two screens: the list and the ad workspace. The ad workspace is one accordion wrapper
containing two expandable steps, an inline loading state, and the approve block at the end.

## Screens

### 1. Ad list (`/cms/ads`)

- large cards, one per ad: the ad's image, name/offer, status badge, last updated, and a
  performance strip (impressions / clicks / spend) that is **grayed out as a stub** until
  ad posting is connected and real metrics exist
- cards are **large by default** — contractors rarely run more than 6 ads at once, and 6 cards
  fill most of the screen; when more than 6 ads exist the list **compresses to dense rows**
- **default sort: active ads first, then newest** (by created time); spend-based sorting
  replaces this once performance exists
- status badges: **Ad draft**, **Creative ready** (the ad is done), **Published** (the next status once
  ad posting exists), archived. "Ad needs review" and "Ad ready to post" are creation-flow labels
  and are not used on existing ads.
- filter by status, search by name
- ad-platform connection: a **"Connect Meta" / "Connect Google Ads"** button appears next to
  "+ New ad" for each **unconnected** ad platform; the buttons are **never rendered by default**
  — they load only after the connection-status check confirms an ad platform is unconnected, so
  the owner never sees one flash and disappear; a connected ad platform shows nothing at all, and
  the button never comes back. New chat **Connect** uses this same status: gone when Google Ads
  and Meta are both connected ([look](../../../general-architecture/cms/design-decision-record.md) 5).
- "+ New ad" button; empty state with a one-line explanation and a start button

### 2. Ad workspace (`/cms/ads/new`, `/cms/ads/{id}`)

One accordion wrapper with two expandable steps; both are visible immediately:

- **Step 1 — About the ad** (always open, **not collapsible**): all the questions in one
  expandable step (offer, audience, ad lead form questions, format). After generate this step is
  **confirmed** (fields locked, including format and audience). **Revise** sits next to
  **Generate again** on that row after the first generate (not on the About the ad title,
  and not before the first generate). It unlocks so the owner can change format, audience,
  offer, or the ad lead form questions, then **Generate again** — changing format regenerates this ad
  ([ADR 33](ADR.md)). Revise is not the Review **AI orb** (that rewrites one copy field or
  prompts a different cleanup of the current photo).
- **Step 2 — Review**: visible but locked — its title reads "Complete step 1 to unlock". It
  expands once step 1 is complete; step 2 itself is collapsible.
- **AI loading state**: after **Create ad and generate**, a brief loading bar on the same screen
  ("Drafting your ad… AI is picking photos and writing your text. This takes a moment — you can
  leave and come back.").
- **Approve block**: actions only at the bottom, in order: **Approve** (→ **ad ready to post**)
  first — Download is disabled until the ad is approved, then becomes the temporary
  manual ad-posting bridge; **Ad posting** stays disabled until ad posting ships. Disabled actions
  carry tooltips explaining why ("Ad posting is not available yet — ad posting to Meta is coming",
  "Approve the ad first"). Validation lives inline in the steps, not in a separate list here.
  Photos never show "has no media caption" or "still in review" — we write the media caption
  in the background, and a photo already in the ad is not a review chore ([ADR 13](ADR.md)).
  Owner-added thumbs read **Uploading…** only while the photo is uploading (usable in about 10 seconds).
  Hover the thumb: a circle-and-cross button; click it to cancel (same overlay as the media library and the website editor).
  Ads do not show **Processing…** as a wait-to-use overlay. A failed upload is a warning
  with an upload sign ("Couldn't upload that photo — try again").

The questions and review content:

1. **What are you promoting?** — offer/goal and service focus from a searchable picker over the
   contractor's known services and goals (pre-filled from onboarding), with a
   conditional "create new" when the typed text matches nothing. No re-typing known data.
2. **Who it's for** — the ideal customer profile and location, both the same searchable
   combobox as services (create-new: "profile", "area"). On a new ad they are filled from the
   last ad the owner created; first ad uses the default married couples aged 30-40 and the
   service area on the business profile ([ADR 37](ADR.md)). The owner can still pick another.
   First we decide who the ad speaks to. The ideal customer profile is loose: it steers
   tone and imagery — not precise targeting (that comes with ad posting) — and it never appears
   in the copy itself.
3. **How people get in touch** — the **ad lead form** questions: a **fixed set of
   standard fields** (phone number, full name, postcode, email) with include/exclude toggles; each
   field maps to a Meta ad lead form field at ad posting — no custom questions. People answer
   in Facebook; ads do not send them to a website page. The suggested **ad lead form title**
   is Review copy ([ADR 38](ADR.md)), not this step.
4. **Ad format** — clickable pills in About the ad, **before generate**, single select: Square
   feed, Portrait feed, Carousel, or Story. One ad is one format ([ADR 32](ADR.md)). The
   ad draft matches that format ([ADR 33](ADR.md)): feed is one photo; carousel is several
   cards; story is almost always one image with shorter overlay copy. Changing format after
   generate regenerates this ad. Want another format? A new ad. Default: Square feed.
5. **Photos** — approved photos from the **media library** (the same gallery
   picker as the rest of the app, e.g. the projects media picker — no duplicated
   gallery or tokens), with framing adjustments and light cleanup drafts (reviewable
   **before/after sweep viewer** — drag the divider to clip, not resize, the photo — with Accept/Reject).
   First upload already ran a tailored default cleanup from visual-issue classification
   (ranked hints on Cleanup edit). After generate, an AI orb asks for a **different**
   cleanup (required prompt, overlay) and calls the same media library
   `cleanup_image` as the website assistant — not a photo picker.
   The sweep's size follows this ad's format: Square feed and Carousel cards are 1:1,
   Portrait feed is 4:5, Story is 9:16. The **photo strip is always shown** — the LLM
   proposes, the owner picks. Square feed, Portrait feed, and Story are **one image**:
   tapping a thumb uses that photo for the ad (single select). Carousel is several square
   cards: tapping a thumb picks which card the cleanup viewer shows.
   Crops follow the selected format automatically from the **photo's stored focal
   point** (one anchor). Thumbnail labels are the media caption (alt text) when it exists —
   there is no short-title guarantee, so the strip truncates to two lines with the full
   media caption on hover. Until the media caption is written, the thumb has no media caption line (not an
   error). A newly added photo shows **Uploading…** only while the photo is uploading; hover the thumb
   for a circle-and-cross button and click it to cancel (no photo is added). If they do not cancel, it is
   usable in this ad (about 10 seconds) — captioning continues in the background. The owner
   is never asked to label it. A failed upload is a warning with an
   upload sign. "+ Add" opens the file picker; dragging a
   file anywhere on the screen also adds a photo (drop overlay) — a pattern intended to extend
   across the website editor, Details, Media library, and Ads.
6. **Text** — headline (input sized to 40 characters, not full-bleed), primary text, short
   label, button label, and the suggested **ad lead form title**. Live character counts against the shared limits; button label from
   Meta’s fixed enum (no AI orb on the CTA). After the first unprompted generate, each copy
   field except the CTA has the CMS **AI orb**, sized to the
   44px field height (not the 34px chat orb). Selecting a span opens a prompt
   **overlay above that selection**. Orb click with no selection rewrites the whole field
   (Ctrl+Z restores the previous text). Prompt text is required; submit stays disabled while
   blank. Optional selection on rewrite; omit means the whole field. Other owner edits are
   kept. Result is still editable. Not the website assistant chat.
7. **Ad format preview** — the selected format, rendered from the backend response, as
   **Facebook and Instagram** placements from an existing dual-platform mock kit
   (title / image / actions; add **Sponsored** and the CTA if the kit is organic-post-only).
   Desktop shows both platforms; narrow screens toggle Facebook | Instagram. Labels are
   owner-facing ("Square feed", "Portrait feed", "Carousel", "Story") — no ratios. Placement
   type is Meta-like, not Satoshi: Facebook is Helvetica / Helvetica Neue / Arial;
   Instagram is system UI (`-apple-system`, Segoe UI, Roboto). The card label under the card
   ("Facebook · Square feed") stays the CMS type. Not Meta `generatepreviews` (that is
   ad posting time). If no variant exists yet, the block shows a brief note.

Actions:

- **Approve** — the last step of the screen; enabled only when no blockers (character
  limits, uploads still in flight, failed uploads — not a missing media caption on an
  owner-added photo); explicit
  confirmation; moves the ad to **ad ready to post**.
- **Ad posting** — present but disabled until direct transmission to Meta exists (ad posting is
  future work).
- **Download** — produces the zip of the ad set (temporary step until direct transmission to
  Meta exists).
- **AI orb (Review)** — after generate: promptable rewrite of headline, primary text, or
  short label, and promptable cleanup of the current photo via the shared media library
  `cleanup_image` (prompt required for a different cleanup; the upload default already ran).
  Replaces unprompted **Regenerate**. Marks **ad needs
  review**. Owner-typed or owner-prompted marketing statements are allowed. If they include a
  detail, a separate Details tool call writes the business profile; a **notification**
  (OK / Revert) appears bottom-right. Approve is not blocked. Same as website
  generation for the conservative first ad draft.
- **Revise** — on the generate row after the first generate: unlocks the confirmed step
  (format, audience, offer, ad lead form questions). Generate again applies; a format change regenerates this ad.

### 3. Ad detail (existing ad) (`/cms/ads/{id}`)

Read-oriented view opened by clicking an ad card; "Edit" opens the ad workspace (the accordion).

- **Top bar (upper block)** — the ad name is an **invisible silent-edit field** (plain
  heading text, adaptive width, hairline on focus only; blur/Enter saves, no save button).
  The status badge sits **on the right next to the actions**: Ad posting (disabled until
  ad posting), **Download (always available on an existing ad — approve is a creation-flow gate,
  not a detail action)**, Edit. Edit is the same outline control as Download — not a filled
  CTA (Approve is the filled action, and only on the create flow). Back to the list. The badge is an existing-ad status —
  **Creative ready** (next status: **Published** once ad posting exists).
- **One single card, two columns — inputs left, outputs right** — the whole detail view is
  one card (no per-format cards). The top bar, then a two-column area:
  - **Left (inputs)**: Images — a **one-image ad** shows that photo, not a thumbnail
    gallery (changing the photo is **Edit**, in the workspace strip). A **carousel** shows
    the cards as viewable thumbs. Then **Budget** (disabled stub until ad posting is connected): daily budget,
    and **duration**: a native end-date picker on the same row as daily budget, with remaining
    days under the picker (`4 days left (15 Aug to 29 Aug)`), not a length like "2 weeks". Both
    disabled until ad posting. Then
    **Audience** and **Area** (read-only, not editable yet, below the images).
  - **Right (outputs)**: Performance with Ad leads directly under it (stacks to one column on
    narrow screens).
- **Performance** — impressions, clicks, spend, results, cost per ad lead (grayed stub until
  ad posting connects) plus the projection line: "At this spend, we expect X more ad leads in
  the next 30 days."
- **Ad leads** — ad leads from this ad's ad lead form submissions: name, contact, service;
  **uncontacted ad leads are clearly labelled in urgent red**; contacted ones are muted. This is
  in scope, not deferred.
- **Audience** — the ideal customer profile with the "steers tone/imagery, targeting comes with
  ad posting" note. Audience-match detection ("are we hitting the right audience?") is
  **disabled/deferred**.

### States

- generation in progress — "AI generation isn't instant": a progress indicator on the ad, leave
  and come back
- LLM copy review: accept / edit / reject per text field and per image; rejected drafts
  are dropped, accepted ones become the ad draft content
- empty states: no ads yet, no approved photos (link to the media library)
- error states: load failure, generation failure, download failure — with a retry action

## Components

Reusable pieces (Kibo/shadcn where possible, custom only when the workspace needs it):

- AdList, AdRow, StatusBadge
- AdAccordion (one wrapper containing two expandable steps — "About the ad" (not collapsible)
  and "Review" (collapsible); both visible; Review is locked until About the ad is complete,
  then expands)
- LoadingBar (inline generation progress, leave-and-return note)
- InlineError (validation shown next to the field it belongs to)
- ApproveBlock (actions only: approve/download, closing the screen)
- **SearchableCombobox** — the picker for offers, services, the ideal customer profile, and
  location (create-new per kind). Full control spec below.
- IdealCustomerProfileEditor (default + free text + async suggestion display; steers
  generation, not targeting)
- AdLeadFormQuestions (About the ad: a fixed set of standard fields: phone number, full name, postcode, email,
  include/exclude toggles; each maps to a Meta ad lead form field, no custom questions)
- FormatPills (About the ad, before generate: Square feed, Portrait feed, Carousel, Story;
  single select — one format per ad; changing format after generate regenerates this ad)
- MediaGallery (the existing media library gallery, reused — no new picker; scoped to
  approved photos, rows show each item's existing media caption) plus a screen-level drop target
  and a "+ Add" that opens the file picker (app-wide pattern)
- FramingControls (adjust how a photo is framed; touch-friendly)
- CleanupReview (before/after per image, accept/reject; frame matches the ad format's ratio;
  photo strip always visible — single-select for one-image formats, card select for carousel;
  the CMS AI orb on cleanup with a required overlay prompt for a different cleanup, calling the shared media library cleanup)
- CopyEditor (fields + character counts + CTA select + ad lead form title; headline ~40ch wide; field labels
  match the rest of the step — uppercase 11px muted; the CMS AI orb on headline, primary
  text, and short label — 44px, matching the field; prompt overlay, required; highlight
  to edit a span)
- AdPreview (Facebook + Instagram placement for this ad's one format, from an existing mock
  kit; Meta-like fonts inside the placement, the CMS fonts on our card label; labels are
  owner-facing, no ratios; shows a brief empty note when no variant exists yet)
- AdReadyBlockersPanel
- ApproveBar (at the bottom of the screen: approve → ad ready to post; ad posting disabled)

### SearchableCombobox (searchable select with create-new)

Used for offers, services, the ideal customer profile, and location. Behavior:

- **Trigger field**: single-line text input, full width, hint text like "Select or type to
  create a new service…" (the noun follows the kind: service / profile / area); typing filters
  the list in real time. No extra icons in the field.
- **Dropdown panel** (closed by default, opens below the input on focus/click):
  - *Create-new block* (top): the dropdown always shows a visible prompt — "✎ Type to
    create a new service…" — so creating is discoverable. While the typed text matches no
    existing item, the prompt becomes the actionable create row: a "+" icon echoing the typed
    text (`+ Create new service "gutter guards"`), pre-highlighted so pressing Enter creates
    it. A thin divider separates this block from the list when the create row is shown.
  - *List block*: a small uppercase gray group label (e.g. "Your services" / "Recent"), then
    a scrollable list of existing items. Each row has a leading icon (a checkmark on the
    currently active item), a bold primary line (item name), and a muted secondary line with
    metadata separated by " • " (e.g. "category • short-id • location"), truncated with an
    ellipsis when too long. A "no matches" line shows when typing finds nothing.
- **Behavior**: typing filters both blocks at once; selecting a list row closes the dropdown,
  moves the active checkmark to that row, and fills the trigger with the item's name;
  selecting a create-new row closes it, creates the item from the source, and switches
  to it. Exactly one list row shows the active checkmark.
- **Style**: light theme, ~8-10px row padding, 13-14px primary text, 11-12px secondary, subtle
  1px dividers, clean combobox popover — not a modal.

## Data And API

- Consumes the typed generated API types for `/v1/ads/*` (list, create, get,
  patch, variant patch, rewrite, cleanup, approve, ad-set, download).
- **Prefetch early + cache**: the ads list and ad-platform connection status are fetched as soon
  as the app loads and **cached in the browser** (query cache), so `/ads` renders
  instantly — cards and connect buttons are already resolved, revisits don't re-fetch. A
  visible loading state is a fallback only: it should never appear except on direct routing to
  `/ads` or a bug. Connect buttons render only from the prefetched status; `/ads` itself does
  no status-triggered loading.
- The contractor comes from the authenticated sign-in / Clerk context, never from a URL or
  request header the browser controls.
- Standard loading/error/empty handling; mutations are explicit (no silent autosave surprises
  mid-review). Loading placeholders are per field / row / image cell, not a whole-card swap
  ([frontend.md](../../../general-architecture/frontend.md)). Mutating calls send last-seen
  `ads.updated_at` as `base_updated_at`; `409` re-GETs the ad (two tabs), not an undo stack
  ([ADR 31](ADR.md)).
- No raw JSON editing anywhere in this workspace.

## Responsive And Mobile

Mobile is a primary viewport. Ads must work on a mobile device:

- Story format mock renders 9:16 without horizontal overflow
- the ad format preview and the bottom approve bar stay reachable
- media picker and framing controls are modal/touch-friendly
- character counts and blocker messages remain readable at narrow widths

## Testing

- Workspace statuses: list badges, accordion flow (step 1 pinned, confirmed after generate
  with Revise next to Generate again, step 2 lock/unlock), copy
  limits, inline validation errors, approve at the bottom, AI-orb rewrite/cleanup preserving
  other fields' manual edits (empty prompt does not fire; Ctrl+Z restores an LLM rewrite and
  cleanup Accept; owner-prompted details write Details via a tool call and a
  notification, Approve is not blocked)
- media picker scoped to this contractor's photos; new files show Uploading… until the
  photo is uploaded (hover: circle-and-cross, click to cancel); then they are usable in this ad without waiting on a media caption; cleanup drafts
  render as before/after and
  accept/reject per image; photo strip is always shown (single-select on one-image
  formats; card select on carousel)
- combobox: create-new pre-highlight, filtering both blocks, active checkmark
- Story format mock on a mobile viewport
- one E2E: create → review/edit → approve → use the ad set (service + download),
  external/paid integrations mocked, core logic unmocked
- visual QA (desktop + mobile) before shipping Ads

## Non-Goals (frontend)

- no campaign console, bidding, targeting, or live performance UIs (daily budget and duration
  stay disabled stubs until ad posting; duration's future shape is remaining days plus a
  native end-date picker, not a scheduling console)
- no ad posting UI
- no integration with the website editor (ads are their own records)
- no raw JSON editing
