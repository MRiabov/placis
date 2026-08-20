# Website Frontend Specification

Status: proposed frontend specification. Screens already exist under
`frontend-2/src/features/cms/`; this doc names them against the Go contract.

Related: [PRD](prd.md), [editing.md](editing.md), [assistant.md](assistant.md),
[manifest](manifest.md).

## Purpose

The contractor-facing website editor in `frontend-2`, under `/cms/website` (left-nav **Sites**).
It is not Details, not the media library, not Ads, and not the live contractor website.

Stack: Vite + React + TanStack Router, generated API types. The canvas renders unpublished
website sections through the shared contractor-website component package — the same package the
live website uses.

The frontend holds **one** website editor projection in React and PATCHes. It does not accumulate
unpublished documents in memory. There is no unpublished revision stack.

## Routes

| Route | Purpose |
| -- | -- |
| `/cms/website` | Website editor (website pages rail, canvas, inspector, website assistant, website publication) |
| `/cms/projects` | Projects under Profile |
| `/cms/certifications-and-reviews` | Certifications and reviews under Profile |
| `/cms/details` | Details (business profile) — owned by [details](../other/details/frontend.md) |

No `/cms/proof`. No `/cms/profile` (Profile is a disclosure). The media library is a workspace
inside the website editor and a standalone surface; see [media library](../other/media/README.md).

## Website editor (`/cms/website`)

Three surfaces, one unpublished website:

- **Canvas** — the selected website page, live from its website sections. Not a website preview.
- **Workspace** — Website pages, Media library, Website styles, Top menu and footer.
- **Inspector** — the selected website section: website slots, design controls, SEO columns,
  website forms. Website versions show website publications and website-assistant activity, not
  unpublished checkpoints per website page.

Website styles are tenant-wide (`website_settings`), shown on the website page GET, applied only on
explicit apply. Top menu and footer are edited here, not in Details.

**Website publication** is an explicit action (toolbar / inspector). It is blocked while
required website slots cannot resolve or media library items on the live path are not approved. After it
succeeds, `has_unpublished_changes` is false until the next edit.

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
