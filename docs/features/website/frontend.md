# Website Frontend Specification

Status: proposed frontend specification. Screens already exist under
`frontend-2/src/features/cms/`; this doc names them against the Go contract.

Related: [PRD](prd.md), [editing.md](editing.md), [assistant.md](assistant.md),
[manifest](manifest.md).

## Purpose

The contractor-facing website editor in `frontend-2`, under `/cms/website` (left-nav **Sites**).
Details, Projects, Certifications and reviews, and the media library still appear on website
pages; they are edited on their own screens, not in this website editor. Ads and the live
contractor website are separate.

Stack: Vite + React + TanStack Router, generated API types. The canvas renders unpublished
website sections through the shared contractor-website component package — the same package the
live website uses.

The frontend holds **one** website editor projection in React. Edits mutate that working copy
first; the canvas paints it. PATCH copies the change to the backend; it does not round-trip the
projection to re-render ([editing.md](editing.md)). Text copies out on click-off, not while
typing. It does not accumulate unpublished documents in memory. There is no unpublished revision
stack. There is **no Save** in the website editor toolbar. The predecessor `EditorHeader` Save
control is dropped. A Saving / Saved status is allowed.

## Routes

| Route | Purpose |
| -- | -- |
| `/cms/website` | Website editor (website pages rail, canvas, editing panel, website assistant, website publication) |
| `/cms/projects` | Projects under Profile |
| `/cms/certifications-and-reviews` | Certifications and reviews under Profile |
| `/cms/details` | Details (business profile) — owned by [details](../other/details/frontend.md) |

No `/cms/proof`. No `/cms/profile` (Profile is a disclosure). The media library is a workspace
inside the website editor and a standalone surface; see [media library](../other/media/README.md).

## Website editor (`/cms/website`)

Three surfaces, one unpublished website:

- **Canvas** — the selected website page, live from its website sections. Not a website preview.
- **Workspace** — left column. Website pages, **media library panel**, website styles, top menu
  and footer. The media library panel is where the owner drops files to upload (and a file
  picker). See [media library](../other/media/README.md).
- **Editing panel** — the selected website section: website slots, design controls, SEO columns,
  website forms. Website versions show website publications and website-assistant activity, not
  unpublished checkpoints per website page.

Website styles are tenant-wide (`website_settings`), shown on the website page GET, applied only on
explicit apply. Top menu and footer are edited here, not in Details.

**Website publication** is an explicit action (toolbar / editing panel). It is not Save. It is blocked while
required website slots cannot resolve or media library items on the live path are not approved. After it
succeeds, `has_unpublished_changes` is false until the next edit. Website publication does **not**
attach a custom website address.

**Connect website address** is a separate flow on this same route (toolbar / empty live URL), not
a new left-nav item. The owner types `acme.ie` or `www.acme.ie`. The API creates the Cloudflare
custom hostname and returns copyable DNS rows (type, name, value): TXT for the certificate, and
CNAME (or ALIAS / later Apex Proxying `A`) as in [cloudflare.md](cloudflare.md). Short copy:
add these at GoDaddy, Porkbun, or Squarespace — do not move nameservers to Placis. Status:
waiting for DNS → waiting for certificate → active (the CMS polls Go; Go polls Cloudflare).
When active, the live website URL is that hostname. Until then the live URL is empty; the owner
uses the website preview. Never show `{website_address}.placis.com` as the live website.

**Website assistant** is a chat in this workspace. Plan mode by default; revert last
website-assistant batch (refuses if a manual edit came after). Pending-review AI images may
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
