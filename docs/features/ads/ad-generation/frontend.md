# Ad Generation Frontend Specification

Status: proposed frontend specification.

Related docs:

1. [Ad generation PRD](prd.md)
2. [Ad generation technical implementation](technical-implementation.md)
3. [Ad generation decision record](ADR.md)
4. [frontend-debloat.md](frontend-debloat.md) — `frontend-2` port: keep / delete / retarget

## Purpose

This spec covers **Ads** in the CMS (`frontend-2/`), under `/cms/ads`.
It is the contractor-facing UI for the ad generation service: create an ad, review LLM
drafts, edit, approve, and download. It is one caller of the service; it is not the website editor,
not the media library, and not campaign management (which is future work).

`/cms/ads` is a **view in the CMS, not a standalone website page**: the left
sidebar (New chat, Sites, Profile with Business details and Projects, AI tools) stays around
it, and Ads is dashboard-ish content in the main area — My ads list, the ad workspace, and the ad
detail all render inside that frame. The mock shows the sidebar for context.

Stack: Vite + React + TanStack Router (the `/cms/*` island), generated API types, Tailwind +
Radix, Kibo/shadcn components where they fit. Ads follows the existing workspace
patterns (projects-style: list, copy fields, media picker modal, blocker panel).

## Principles

These principles shape every screen in this workspace:

1. **Who first, how second** — the workflow decides who the ad is for (ideal customer profile)
   before any ad mechanics. How people get in touch is always a Meta ad lead form. Ad formats,
   crops, and sizes follow automatically.
2. **Business details, not ad jargon** — the UI talks about the business: what you promote, who
   it's for, how people get in touch, photos, text. Internal jargon and ratios like 1:1 or 9:16
   never appear in the UI.
3. **Approve is the last step of the screen** — first create the ad and review its content, then
   approve at the bottom of the flow. Approval is not a toolbar action.
4. **Generation is not instant** — LLM drafting and photo picking run in the background; the
   flow is progressive and never blocks. The owner can leave and come back later.
5. **Image descriptions help** — media library items already carry media captions; the picker
   shows them and LLM selection uses them.

## Design Mock

A static HTML mock of the workspace lives at `design/ads-workspace.html` — open it in a browser
directly (no build). It shows the current direction: **one accordion wrapper with two
expandable steps, both visible immediately** — step 1 "About the ad" (open by default, all the
questions), step 2 "Review" (visible but locked — "Complete step 1 to unlock" — and
expands once step 1 is complete; step 1 can be returned to), then the approve block when the ad is ad ready to post.
The combobox is closed by default with a conditional "create new". No ad-format or ad-set jargon.
The mock is skinned to match the live CMS home composer (`.cms-dashboard-prompt` in
`frontend-2`): **white canvas**, Satoshi / Helvetica Neue / Arial, `#e1e1e1` hairlines,
`#fafafa` section headers (not blue-gray wizard chrome), 28px composer radius and the
prompt's soft shadow on the accordion and ad cards, sunken 10px fields, 36px controls,
near-black accent. The real implementation imports the app globals and should reuse the
dashboard prompt chrome rather than duplicate a palette.

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
  the button never comes back
- "+ New ad" button; empty state with a one-line explanation and a start button

### 2. Ad workspace (`/cms/ads/new`, `/cms/ads/{id}`)

One accordion wrapper with two expandable steps; both are visible immediately:

- **Step 1 — About the ad** (always open, **not collapsible**): all the questions in one
  expandable step (1-3 below).
- **Step 2 — Review**: visible but locked — its title reads "Complete step 1 to unlock". It
  expands once step 1 is complete; step 2 itself is collapsible.
- **AI loading state**: after "Create ad", a brief loading bar on the same screen
  ("Drafting your ad… AI is picking photos and writing your text. This takes a moment — you can
  leave and come back.").
- **Approve block**: actions only at the bottom, in order: **Approve** (→ **ad ready to post**)
  first — Download is disabled until the ad is approved, then becomes the temporary
  manual ad-posting bridge; **Ad posting** stays disabled until ad posting ships. Disabled actions
  carry tooltips explaining why ("Ad posting is not available yet — ad posting to Meta is coming",
  "Approve the ad first"). Validation lives inline in the steps, not in a separate list here:
  errors appear next to the field they belong to (e.g. under Photos: "Photo 'Crew at work' is
  still in review", "Photo 'New roof' has no media caption").

The questions and review content:

1. **What are you promoting?** — offer/goal and service focus from a searchable picker over the
   contractor's known services and goals (pre-filled from onboarding), with a
   conditional "create new" when the typed text matches nothing. No re-typing known data.
2. **Who it's for** — the ideal customer profile (default married couples aged 30-40) and
   location, both entered with the same searchable combobox as services (create-new: "profile",
   "area"). First we decide who the ad speaks to. The ideal customer profile is loose: it steers
   tone and imagery — not precise targeting (that comes with ad posting) — and it never appears
   in the copy itself.
3. **How people get in touch** — the **ad lead form**: suggested title and a **fixed set of
   standard fields** (phone number, full name, postcode, email) with include/exclude toggles; each
   field maps to a Meta ad lead form field at ad posting — no custom questions. People answer
   in Facebook; ads do not send them to a website page.
4. **Photos** — approved photos from the **media library** (the same gallery
   picker as the rest of the app, e.g. the projects media picker — no duplicated
   gallery or tokens), with framing adjustments and light cleanup drafts (reviewable
   **before/after sweep viewer** — drag the divider to compare — with Accept/Reject). Ad formats
   are not exposed: photos are fitted to the ad sizes automatically ("we fit them to the ad
   sizes"). Every size — card thumbnail, feed, carousel, story, sweep — crops from the
   **photo's stored focal point** (one anchor), so the same photo stays coherent across
   ad formats instead of being independently framed. "+ Add" opens the file picker; dragging a
   file anywhere on the screen also adds a photo (drop overlay) — a pattern intended to extend
   across the website editor, Details, Media library, and Ads.
5. **Text** — headline, primary text, short label, button label. Live character counts against
   the shared limits; button label from the fixed set.
6. **Ad formats** — format-accurate mocks rendered from the backend response, not hardcoded. Each
   card corresponds to one variant the backend returns. Only ad formats with approved
   images appear; empty ad formats are omitted, never rendered as empty slots. Labels are
   owner-facing ("Square feed", "Portrait feed", "Carousel", "Story") — no ratios. If no variants exist yet, the block
   shows a brief note instead of empty cards.

Actions:

- **Approve** — the last step of the screen; enabled only when no blockers; explicit
  confirmation; moves the ad to **ad ready to post**.
- **Ad posting** — present but disabled until direct transmission to Meta exists (ad posting is
  future work).
- **Download** — produces the zip of the ad set (temporary step until direct transmission to
  Meta exists).
- **Regenerate** — per format block: re-runs LLM drafts for text and/or the photo selection
  without losing manual edits; the result is marked **ad needs review**.

### 3. Ad detail (existing ad) (`/cms/ads/{id}`)

Read-oriented view opened by clicking an ad card; "Edit" opens the ad workspace (the accordion).

- **Top bar (upper block)** — the ad name is an **invisible silent-edit field** (plain
  heading text, adaptive width, hairline on focus only; blur/Enter saves, no save button).
  The status badge sits **on the right next to the actions**: Ad posting (disabled until
  ad posting), **Download (always available on an existing ad — approve is a creation-flow gate,
  not a detail action)**, Edit. Back to the list. The badge is an existing-ad status —
  **Creative ready** (next status: **Published** once ad posting exists).
- **One single card, two columns — inputs left, outputs right** — the whole detail view is
  one card (no per-format cards). The top bar, then a two-column area:
  - **Left (inputs)**: Images (the image gallery: main image with clickable thumbnails
    underneath), then **Budget** (disabled stub until ad posting is connected: daily budget,
    duration), then **Audience** and **Area** (read-only, not editable yet, below the
    images).
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
- AdLeadFormEditor (title + a fixed set of standard fields: phone number, full name, postcode, email,
  include/exclude toggles; each maps to a Meta ad lead form field, no custom questions)
- MediaGallery (the existing media library gallery, reused — no new picker; scoped to
  approved photos, rows show each item's existing media caption) plus a screen-level drop target
  and a "+ Add" that opens the file picker (app-wide pattern)
- FramingControls (adjust how a photo is framed; touch-friendly)
- CleanupReview (before/after per image, accept/reject)
- CopyEditor (fields + character counts + CTA select)
- AdPreview (conditionally renders one card per variant the backend returns; only ad formats
  with approved images appear, empty ad formats are omitted; labels are owner-facing, no ratios;
  shows a brief empty note when no variants exist yet)
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

- Consumes the typed generated API types for `/api/v1/ads/*` (list, create, get,
  patch, variant patch, regenerate, approve, ad-set, download).
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
- the previews and the bottom approve bar stay reachable
- media picker and framing controls are modal/touch-friendly
- character counts and blocker messages remain readable at narrow widths

## Testing

- Workspace statuses: list badges, accordion flow (step 1 pinned, step 2 lock/unlock), copy
  limits, inline validation errors, approve at the bottom, regeneration preserving manual edits
- media picker only offers approved tenant photos and shows media captions; cleanup
  drafts render as before/after and accept/reject per image
- combobox: create-new pre-highlight, filtering both blocks, active checkmark
- Story format mock on a mobile viewport
- one E2E: create → review/edit → approve → use the ad set (service + download),
  external/paid integrations mocked, core logic unmocked
- visual QA (desktop + mobile) before shipping Ads

## Non-Goals (frontend)

- no campaign console, budgets, targeting, scheduling, or performance UIs
- no ad posting UI
- no integration with the website editor (ads are their own records)
- no raw JSON editing
