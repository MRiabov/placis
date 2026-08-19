# Details Frontend Specification

Status: proposed frontend specification for Profile. The Details screen is shipped; the
Projects screen at `/cms/projects` is still a placeholder.

Related docs:

1. [Details overview](README.md)
2. [Details decision record](ADR.md)
3. [Details data model](data-model.md)

## Purpose

This spec covers how the owner reaches **Details** and **Projects** in The CMS (`frontend-2/`).
It does not change what Details edits, and it does not specify a Projects editor.

Details stays at `/cms/details`. Projects stays at `/cms/projects`. There is no `/cms/profile`
route: **Profile** is a left-nav group, not a page.

A top-level Projects item is too much chrome for how often it is used; Details is also opened
infrequently. One Profile group keeps both reachable without adding another peer of Sites.

## Left nav

The app-shell left nav lives in `frontend-2/src/features/cms/CmsDashboardShell.tsx`. Profile
replaces the current top-level Details item. Sites (the website editor entry) and AI tools stay
where they are.

```text
New chat
Sites
Profile
  Business details
  Projects
AI tools
```

| Label | Kind | Route |
| -- | -- | -- |
| New chat | page | `/cms` |
| Sites | page | `/cms/website` |
| Profile | disclosure | none |
| Business details | page under Profile | `/cms/details` |
| Projects | page under Profile | `/cms/projects` |
| AI tools | page | `/cms/website` |

Proof (`/cms/proof`) stays unlisted.

## Profile disclosure

Profile is not a route. Clicking it only expands or collapses the group.

- **Children are the pages.** Business details keeps the shipped Details view. Projects keeps
  the existing placeholder (“The completed project showcase.”). A real projects editor is later
  work.
- **Default expansion:** expanded when the current view is Details or Projects; otherwise
  collapsed. The owner may toggle it while staying on another view.
- **Active state:** `aria-current="page"` on the child. Profile gets a visual active style when
  either child is current, but is not itself `aria-current` when the sidebar is expanded.
- **Expanded sidebar:** labels only (today’s pattern). Children are indented under Profile; no
  extra icons on children.
- **Collapsed sidebar:** only the Profile icon (keep `Building2`). Children are hidden. The icon
  is active if either child is current (`aria-current` on the icon). Click expands or peeks the
  sidebar **and** opens the group; it does not navigate. Hover-peek already exists and shows
  the open group the same way.
- **Mobile drawer:** same as expanded (labels visible).

## Screens

### Business details (`/cms/details`)

The shipped Details editor. In-page title is already **Business details**. Editing the business
profile here still changes the website and the next ad draft. See [README.md](README.md) for
what it edits.

### Projects (`/cms/projects`)

Placeholder until a Projects editor ships. Opening it from Profile does not imply the editor
exists. The route and the placeholder copy stay as they are.

## Out of scope

- A Projects editor (the editor API and `useEditorProjects()` already exist unused).
- Renaming Sites, merging Details into the website editor, listing Proof, adding
  `/cms/profile`, backend or API contract changes.
