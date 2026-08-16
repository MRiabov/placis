# Ad Generation Frontend Specification

Status: proposed frontend specification.

Related docs:

1. [Ad generation PRD](prd.md)
2. [Ad generation technical implementation](technical-implementation.md)
3. [Ad generation decision record](ADR.md)

## Purpose

This spec covers the **Ads workspace** in the private Vite app (`frontend-2/`), under `/cms/ads`.
It is the contractor-facing UI for the ad generation service: create an ad, review AI
proposals, edit, approve, and download. It is one user of the service; it is not the website
editor, not the media library, and not campaign management (which is future work).

`/cms/ads` is a **view inside the existing CMS shell, not a standalone page**: the CMS left
sidebar (website, posts, careers, media, proof, ads, settings) stays around it, and the ads
workspace is dashboard-ish content in the main area — My ads list, the ad page, and the ad
detail all render inside that frame. The mock shows the sidebar for context.

Stack: Vite + React + TanStack Router (the `/cms/*` island), generated API client, Tailwind +
Radix, Kibo/shadcn components where they fit. The workspace follows the existing CMS workspace
patterns (careers/posts-style: list, editor, media picker modal, blocker panel).

## Principles

These principles shape every screen in this workspace:

1. **Who first, how second** — the workflow decides who the ad is for (ideal customer profile,
   how people get in touch) before any ad mechanics. Users pick the target and the lead path;
   formats, crops, and sizes follow automatically.
2. **Business details, not ad jargon** — the UI talks about the business: what you promote, who
   it's for, how people get in touch, photos, text. Internal terms (formats like 1:1 or 9:16,
   "package", "creative set") never appear in the UI.
3. **Approve is the last step of the page** — first create the ad and review its content, then
   approve at the bottom of the flow. Approval is not a header action.
4. **Generation is not instant** — AI drafting and photo picking run in the background; the
   flow is progressive and never blocks. The user can leave and come back later.
5. **Image descriptions help** — media assets already carry descriptions; the picker shows them
   and AI selection uses them.

## Design Mock

A static HTML mock of the workspace lives at `design/ads-workspace.html` — open it in a browser
directly (no build). It shows the current direction: **one accordion wrapper with two
expandable forms, both visible immediately** — form 1 "About the ad" (open by default, all the
questions), form 2 "Review" (visible but locked — "Complete step 1 to unlock" — and
expands once form 1 is complete; form 1 can be returned to), then the publish block when ready.
The combobox is closed by default with a conditional "create new". No format or package jargon.
The mock is skinned with the app's actual tokens, mirrored verbatim from
`frontend-2/src/styles/cms/tokens.css` and `private-app-tokens.css`: **white canvas
background** like the CMS app, near-black accent, zinc neutrals, CMS status colors
(error/success/warning), 8/12/16 radii, Satoshi type (the app is switching to Satoshi
globally; the demo uses it too, falling back to Switzer/Inter when the font file isn't
available locally). The real implementation imports the app globals directly — the ads
feature must not duplicate the palette.

## Routes

| Route | Purpose |
| -- | -- |
| `/cms/ads` | Ad list |
| `/cms/ads/new` | Starts a new ad (opens the same page) |
| `/cms/ads/{id}` | Ad detail (existing ad); "Edit" opens the ad page |

There are only two screens: the list and the ad page. The ad page is one accordion wrapper
containing two expandable forms, an inline loading state, and the publish block at the end.

## Screens

### 1. Ad list (`/cms/ads`)

- large cards, one per ad: the ad's image, name/offer, status badge, last updated, and a
  performance strip (impressions / clicks / spend) that is **grayed out as a stub** until
  posting is connected and real metrics exist
- cards are **large by default** — clients rarely run more than 6 ads at once, and 6 cards
  fill most of the screen; when more than 6 ads exist the list **compresses to dense rows**
- **default sort: active ads first, then newest** (by created time); spend-based sorting
  replaces this once performance exists
- status badges: draft, **creative ready** (creative is done), published (the next state once
  posting exists), archived. "Needs review" and "Ready to post" are creation-flow labels and
  are not used on existing ads.
- filter by status, search by name
- platform connection: a **"Connect Meta" / "Connect Google"** button appears next to
  "+ New ad" for each **unconnected** platform; the buttons are **never rendered by default**
  — they load only after the connection-status check confirms a platform is unconnected, so
  users never see one flash and disappear; a connected platform shows nothing at all, and the
  button never comes back
- "+ New ad" button; empty state with a one-line explanation and a start button

### 2. Ad page (`/cms/ads/new`, `/cms/ads/{id}`)

One accordion wrapper with two expandable forms; both are visible immediately:

- **Form 1 — About the ad** (always open, **not collapsible**): all the questions in one
  expandable form (1-3 below).
- **Form 2 — Review**: visible but locked — its header reads "Complete step 1 to unlock". It
  expands once form 1 is complete; form 2 itself is collapsible.
- **AI loading state**: after "Create ad and generate", a brief loading bar on the same page
  ("Drafting your ad… AI is picking photos and writing your text. This takes a moment — you can
  leave and come back.").
- **Publish block**: actions only at the bottom, in order: **Approve** (→ `ready to post`)
  first — Download is disabled until the ad is approved, then becomes the temporary
  manual-posting bridge; **Publish** stays disabled until posting ships. Disabled actions
  carry tooltips explaining why ("Publish is not available yet — posting to Meta is coming",
  "Approve the ad first"). Validation lives inline in the forms, not in a separate list here:
  errors appear next to the field they belong to (e.g. under Photos: "Photo 'Crew at work' is
  still in review", "Photo 'New roof' has no alt text"; under the destination picker: "Choose
  where the ad sends people").

The questions and review content:

1. **What are you promoting?** — offer/goal and service focus from a searchable picker over the
   tenant's known services and goals (pre-filled from the interview), with a conditional
   "create new" when the typed text matches nothing. No re-typing known data.
2. **Who it's for** — the ICP (default married couples aged 30-40) and location, both entered
   with the same searchable combobox as services (create-new: "profile", "area"). First we
   decide who the ad speaks to. The ICP is loose: it steers tone and imagery — not precise
   targeting (that comes with posting) — and it never appears in the copy itself.
3. **How people get in touch** — a toggle: **Meta form** (default) or **Website page**. The
   Meta form shows the suggested title and a **fixed set of standard fields** (phone, full
   name, postcode, email) with include/exclude toggles; each field maps to a Meta lead form
   field when posting — no custom questions. Choosing Website page reveals a destination page
   picker (combobox over published/scheduled tenant pages, no create-new).
4. **Photos** — approved photos from the **existing CMS media gallery** (the same gallery
   component as the rest of the CMS, e.g. the careers/posts media picker — no duplicated
   gallery or tokens), with framing adjustments and light cleanup proposals (reviewable
   **before/after sweep viewer** — drag the divider to compare — with Accept/Reject). Formats
   are not exposed: photos are fitted to the ad sizes automatically ("we fit them to the ad
   sizes"). Every size — card thumbnail, feed, carousel, story, sweep — crops from the
   **asset's stored focal point** (one anchor), so the same photo stays coherent across
   formats instead of being independently framed. "+ Add" opens the file picker; dragging a
   file anywhere on the page also adds a photo (drop overlay) — a pattern intended to extend
   across the whole CMS.
5. **Text** — headline, primary text, short label, button label. Live character counts against
   the shared limits; button label from the fixed set.
6. **Preview** — format-accurate mocks rendered from the backend response, not hardcoded. Each
   preview card corresponds to one variant the backend returns. Only formats with approved images
   appear; empty formats are omitted, never rendered as placeholders. Labels are user-facing
   ("Feed", "Carousel", "Story") — no ratios. If no variants exist yet, the preview section
   shows a brief note instead of empty cards.

Actions:

- **Approve** — the last step of the page; enabled only when no blockers; explicit
  confirmation; moves the ad to `ready to post`.
- **Publish** — present but disabled until direct transmission to Meta exists (posting is
  future work).
- **Download** — produces the zip package (temporary step until direct transmission to Meta
  exists).
- **Regenerate** — per section: re-runs AI proposals for text and/or the photo selection
  without losing manual edits; the result is marked `needs review`.

### 3. Ad detail (existing ad) (`/cms/ads/{id}`)

Read-oriented view opened by clicking an ad card; "Edit" opens the ad page (the accordion).

- **Header (upper section)** — the ad name is an **invisible silent-edit form** (plain
  heading text, adaptive width, hairline on focus only; blur/Enter saves, no save button).
  The status badge sits **on the right next to the actions**: Publish (disabled until
  posting), **Download (always available on an existing ad — approve is a creation-flow gate,
  not a detail action)**, Edit. Back to the list. The badge is an existing-ad status —
  **Creative ready** (next state: **Published** once posting exists).
- **One single card, two columns — inputs left, outputs right** — the whole detail view is
  one card (no per-section cards). The header at the top, then a two-column area:
  - **Left (inputs)**: Creative (the image gallery: main image with clickable thumbnails
    underneath), then **Budget** (disabled stub until posting is connected: daily budget,
    duration), then **Audience** and **Area** (read-only, not editable yet, below the
    creative).
  - **Right (outputs)**: Performance with Leads directly under it (stacks to one column on
    narrow screens).
- **Performance** — impressions, clicks, spend, results, cost per lead (grayed stub until
  posting connects) plus the projection line: "At this spend, we expect X more leads in the
  next 30 days."
- **Leads** — per-ad leads (from this ad's Meta form submissions): name, contact, service;
  **uncontacted leads are clearly labelled in urgent red**; contacted ones are muted. This is
  in scope, not deferred.
- **Audience** — the ICP with the "steers tone/imagery, targeting comes with posting" note.
  Audience-match detection ("are we hitting the right audience?") is **disabled/deferred**.

### States

- generation in progress — "AI generation isn't instant": a progress state on the ad, leave
  and come back
- AI proposal review: accept / edit / reject per text field and per image; rejected proposals
  are dropped, accepted ones become the draft content
- empty states: no ads yet, no approved media (link to the media library), no destination page
  published yet
- error states: load failure, generation failure, download failure — with a retry action

## Components

Reusable pieces (Kibo/shadcn where possible, custom only when the workspace needs it):

- AdList, AdRow, StatusBadge
- AdAccordion (one wrapper containing two expandable forms — "About the ad" (not collapsible)
  and "Review" (collapsible); both visible; Review is locked until About the ad is complete,
  then expands)
- LoadingBar (inline generation state, leave-and-return note)
- InlineError (validation shown next to the field it belongs to)
- PublishBlock (actions only: approve/download/publish, closing the page)
- **SearchableCombobox** — the picker for offers, services, the ICP, and location (create-new
  per kind). The destination page picker is the same combobox without create-new. Full
  component spec below.
- IcpEditor (default + free text + async suggestion display; steers generation, not targeting)
- LeadFormEditor (title + a fixed set of standard fields: phone, full name, postcode, email,
  include/exclude toggles; each maps to a Meta lead form field, no custom questions)
- MediaGallery (the existing CMS media gallery, reused — no new component; scoped to approved
  assets, rows show each asset's existing description) plus a page-level drop target and a
  "+ Add" that opens the file picker (CMS-wide pattern)
- FramingControls (adjust how a photo is framed; touch-friendly)
- CleanupReview (before/after per image, accept/reject)
- CopyEditor (fields + character counts + CTA select)
- AdPreview (conditionally renders one card per variant the backend returns; only formats with
  approved images appear, empty formats are omitted; labels are user-facing, no ratios; shows a
  brief empty note when no variants exist yet)
- PublishBlockersPanel
- ApproveBar (at the bottom of the page: approve → ready to post; Publish disabled)

### SearchableCombobox (searchable select with create-new)

Used for offers, services, the ICP, and location. Behavior:

- **Trigger field**: single-line text input, full width, placeholder like "Select or type to
  create a new service…" (the noun follows the kind: service / profile / area); typing filters
  the list in real time. No extra icons in the field.
- **Dropdown panel** (closed by default, opens below the input on focus/click):
  - *Create-new section* (top): the dropdown always shows a visible prompt — "✎ Type to
    create a new service…" — so creating is discoverable. While the typed text matches no
    existing item, the prompt becomes the actionable create row: a "+" icon echoing the typed
    text (`+ Create new service "gutter guards"`), pre-highlighted so pressing Enter creates
    it. A thin divider separates this section from the list when the create row is shown.
    Comboboxes without create-new (e.g. the destination page picker) skip this section and
    just filter.
  - *List section*: a small uppercase gray group label (e.g. "Your services" / "Recent"), then
    a scrollable list of existing items. Each row has a leading icon (a checkmark on the
    currently active item), a bold primary line (item name), and a muted secondary line with
    metadata separated by " • " (e.g. "category • short-id • location"), truncated with an
    ellipsis when too long. A "no matches" line shows when typing finds nothing.
- **Behavior**: typing filters both sections at once; selecting a list row closes the dropdown,
  moves the active checkmark to that row, and fills the trigger with the item's name;
  selecting a create-new row closes it, creates the item from the template/source, and switches
  to it. Exactly one list row shows the active checkmark.
- **Style**: light theme, ~8-10px row padding, 13-14px primary text, 11-12px secondary, subtle
  1px dividers, clean combobox popover — not a modal.

## Data And API

- Consumes the typed generated client for `/api/v1/website/editor/ads/*` (list, create, get,
  patch, variant patch, regenerate, approve, package, download).
- **Prefetch early + cache**: the ads list and platform connection status are fetched as soon
  as the app/CMS loads and **cached in the browser** (query cache), so `/ads` renders
  instantly — cards and connect buttons are already resolved, revisits don't re-fetch. A
  visible loading state is a fallback only: it should never appear except on direct routing to
  `/ads` or a bug. Connect buttons render only from the prefetched status; `/ads` itself does
  no status-triggered loading.
- Tenant comes from the authenticated session/Clerk context, never from a URL or header the
  client controls.
- Standard loading/error/empty handling; mutations are explicit (no silent autosave surprises
  mid-review).
- No raw JSON editing anywhere in this workspace.

## Responsive And Mobile

Mobile is a primary viewport for the CMS. The workspace must work on a phone:

- story preview renders 9:16 without horizontal overflow
- the previews and the bottom approve bar stay reachable
- media picker and framing controls are modal/touch-friendly
- character counts and blocker messages remain readable at narrow widths

## Testing

- Workspace states: list badges, accordion page flow (form 1 pinned, form 2 lock/unlock), copy
  limits, inline validation errors, approve at the bottom, regeneration preserving manual edits
- media picker only offers approved tenant assets and shows asset descriptions; cleanup
  proposals render as before/after and accept/reject per image
- combobox: create-new pre-highlight, filtering both sections, active checkmark
- story preview on a mobile viewport
- one E2E: create → generate → review/edit → approve → use the package (service + download),
  external/paid integrations mocked, core logic unmocked
- visual QA (desktop + mobile) before shipping the workspace

## Non-Goals (frontend)

- no campaign console, budgets, targeting, scheduling, or performance UIs
- no platform posting UI
- no integration with the website page editor (ads are their own records)
- no raw JSON editing
