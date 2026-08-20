# Details Frontend Specification

Status: proposed frontend specification for Profile.

Related docs:

1. [Details overview](README.md)
2. [Details decision record](ADR.md)
3. [Details data model](data-model.md)
4. [Website frontend](../../website/frontend.md) — Projects and Certifications and reviews

## Purpose

This spec covers how the owner reaches **Details**, **Projects**, and **Certifications and
reviews** in The CMS (`frontend-2/`).

Details stays at `/cms/details`. Projects stays at `/cms/projects`. Certifications and reviews
stays at `/cms/certifications-and-reviews`. There is no `/cms/profile` route: **Profile** is a
left-nav group, not a destination. There is no `/cms/proof`.

A top-level Projects item is too much sidebar for how often it is used; Details is also opened
infrequently. One Profile group keeps them reachable without adding another peer of Sites.

## Left nav

The CMS left nav lives in `frontend-2/src/features/cms/CmsDashboardShell.tsx`. Profile
replaces the current top-level Details item. Sites (the website editor entry) and AI tools stay
where they are.

```text
New chat
Sites
Profile
  Business details
  Projects
  Certifications and reviews
AI tools
```

| Label | Kind | Route |
| -- | -- | -- |
| New chat | destination | `/cms` |
| Sites | destination | `/cms/website` |
| Profile | disclosure | none |
| Business details | destination under Profile | `/cms/details` |
| Projects | destination under Profile | `/cms/projects` |
| Certifications and reviews | destination under Profile | `/cms/certifications-and-reviews` |
| AI tools | destination | `/cms/website` |

## Profile disclosure

Profile is not a route. Clicking it only expands or collapses the group.

- **Children are the destinations.** Business details is the Details view. Projects and Certifications
  and reviews are website-feature screens in this slice.
- **Default expansion:** expanded when the current view is a Profile child; otherwise
  collapsed. The owner may toggle it while staying on another view.
- **Current route:** `aria-current` on the child. Profile gets a visual active style when
  a child is current, but is not itself `aria-current` when the sidebar is expanded.
- **Expanded sidebar:** labels only. Children are indented under Profile; no extra icons on
  children.
- **Collapsed sidebar:** only the Profile icon (keep `Building2`). Children are hidden. The icon
  is active if a child is current (`aria-current` on the icon). Click expands or peeks the
  sidebar **and** opens the group; it does not navigate.
- **Mobile drawer:** same as expanded (labels visible).

## Screens

### Business details (`/cms/details`)

The Details view. The heading is **Business details**. Editing the business profile here
still changes the website editor and the next ad draft; the live website changes on the next
website publication. See [README.md](README.md) for what it edits. Top menu and footer are not
edited here.

### Projects (`/cms/projects`)

Website-feature screen: title, description, cover photo. See
[website frontend](../../website/frontend.md).

### Certifications and reviews (`/cms/certifications-and-reviews`)

Website-feature screen: certification selections and profile reviews. See
[website frontend](../../website/frontend.md).

## Out of scope

- Renaming Sites, merging Details into the website editor, adding `/cms/profile`, restoring
  `/cms/proof`.
