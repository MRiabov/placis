# Website Frontend Specification

Status: proposed frontend specification. Screens already exist under
`frontend-2/src/features/cms/`; this doc names them against the Go contract.

Related: [PRD](prd.md), [editing.md](editing.md), [assistant.md](assistant.md),
[manifest](manifest.md). Port: [frontend-debloat.md](frontend-debloat.md).

## Purpose

The contractor-facing website editor in `frontend-2`, under `/cms/website` (left-nav **Sites**).
Details, Projects, and Certifications and reviews still appear on website pages; they are
edited on their own screens, not in this website editor. The media library is `/cms/media` and
a selectable workspace item here. Ads and the live contractor website are separate.

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
batches). Switching website page GETs the fold only. Ctrl+Z is
in-memory, then the ordinary PATCH. No `/undo` or `/redo` routes. The predecessor
`EditorHeader` Save control is dropped.

Loading placeholders: every screen, per field / row / website slot — not swapping the whole panel
([frontend.md](../../general-architecture/frontend.md)).

## Routes

| Route | Purpose |
| -- | -- |
| `/cms/website` | Website editor (workspace, canvas, editing panel, website assistant, website publication) |
| `/cms/media` | Media library (full screen) — owned by [media library](../other/media/README.md) |
| `/cms/projects` | Projects under Profile |
| `/cms/certifications-and-reviews` | Certifications and reviews under Profile |
| `/cms/details` | Details (business profile) — owned by [details](../other/details/frontend.md) |

No `/cms/proof`. No `/cms/profile` (Profile is a disclosure). The media library is `/cms/media`
and a selectable workspace item in the website editor; see [media library](../other/media/README.md).

## Website editor (`/cms/website`)

Three surfaces, one unpublished website:

- **Canvas** — the selected website page, live from its website sections. Not a website preview.
- **Workspace** — left column. **Workspace items** are selectable (website pages, media library,
  website styles, top menu, footer). Selecting one fills the workspace. The media library item
  is the same library as `/cms/media` (upload, drag onto the canvas). See
  [media library](../other/media/README.md).
- **Editing panel** — the selected website section: website slots, design controls, SEO columns,
  website forms. Website versions show website publications and website-assistant activity, not
  unpublished checkpoints per website page. Undo/redo stacks are in RAM, seeded from
  website edit history on `/cms/website` open; they are not a timeline UI.

Website styles are tenant-wide (`website_settings`), shown on the website page GET, applied only on
explicit apply. Top menu and footer are edited here, not in Details.

**Website publication** is a toolbar **dropdown**, not one toolbar button and not Save. Choose
where this website publication goes. It is blocked while required website slots cannot resolve
or media library items on the live path are not approved; show those blockers in the dropdown
panel. After a successful website publication, `has_unpublished_changes` is false until the next
edit. One destination per click. All destinations share one R2 `latest/` tree
([cloudflare.md](cloudflare.md)) — this is where the publication is aimed (copy, confirmation,
purge), not two different website versions.

Rows:

1. **Website address host** — `{website_address}` plus the suffix in
   [cloudflare.md](cloudflare.md). Always listed after website activation. Open in a new tab when
   `latest/` exists. Status: not published yet / last website publication time. This is the live
   URL in the website editor until (and alongside) a custom website address. Product copy:
   **website address** / our subdomain. Do not call this host website preview (that is the sales
   stage and `/preview/{token}/`).
2. **Each connected custom website address** (`acme.ie`) — listed once Connect website address
   has a hostname. Disabled until `website_addresses.status=active` (waiting for DNS /
   certificate).
3. **New URL** — not a website publication. Opens the **Connect website address** modal.

**Connect website address** is the point-their-hostname-at-us flow. It is a **modal over the
website editor** on `/cms/website` (overlay, no new route, no left-nav item). The owner types
`acme.ie` or `www.acme.ie`. The API creates the Cloudflare custom hostname and returns copyable
DNS rows (type, name, value): TXT for the certificate, and CNAME (or ALIAS / later Apex Proxying
`A`) as in [cloudflare.md](cloudflare.md). Short copy: add these at GoDaddy, Porkbun, or
Squarespace — do not move nameservers to Placis. Status in the modal: waiting for DNS → waiting
for certificate → active (the website editor polls Go; Go polls Cloudflare). Close returns to
the website editor. The host then appears as row 2; it is enabled when active. Re-open the modal
from New URL or from a still-waiting host to copy records again. Website publication does **not**
attach a custom website address.

Do not advertise `{website_address}.placis.com` as a live URL.

**Website assistant** is a chat in this workspace. Two configs: plan vs continuous, and
instant apply vs Ask first (Apply / Reject). Default is plan + Ask first. Apply and
Reject are one-way; there is no revert-after-apply. Ctrl+Z after Apply is in-memory undo
of that batch, then PATCH — not Apply then Reject. Pending-review AI images may
show on the canvas with a warning; owner approval makes them approved. Website publication
still requires approved media assets.

## Profile screens this feature owns

Projects and Certifications and reviews sit under Profile next to Business details. See
[details frontend](../other/details/frontend.md) for the disclosure. Editing those screens
updates the unpublished website / website editor immediately; the live website changes only on the
next website publication.

### Projects (`/cms/projects`)

A working Projects screen in this slice: title, description, cover photo from the media library.
Not a stub.

### Certifications and reviews (`/cms/certifications-and-reviews`)

One screen: which certifications are selected, and the profile reviews. Website sections attach
reviews through `website_slot_reviews`.
