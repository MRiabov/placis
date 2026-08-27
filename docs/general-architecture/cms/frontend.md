# Left nav and New chat

The CMS (sidebar + main area): left nav, Profile disclosure, New chat (`/cms`). Destination
screens live with their features. Loading placeholders: every screen, per field / row — not a
whole-panel swap ([frontend.md](../frontend.md)).

Look: [design decision record](design-decisions.md). Tokens: [design.md](design.md). Port:
[frontend-debloat.md](../frontend-debloat.md). [ADR](ADR.md).

## Left nav

The CMS left nav lives in `frontend-2/src/features/cms/` (layout module; names in
[frontend-debloat.md](../frontend-debloat.md)). Profile replaces the current top-level Details
item. Sites (the website editor entry) stays where it is. There is no **AI tools** item: image
cleanup is `/cms/media`; the website assistant is the canvas overlay. Ads is a destination
(screens: [ads frontend](../../features/ads/ad-generation/frontend.md)).

On a **narrow** screen the destinations are a **full-screen overlay selector** (no leftover
icon rail). Profile is not a row; the four children are:

```text
New chat
Sites
Business details
Projects
Certifications and reviews
Media library
Ads
```

On a **wide** screen Profile is a disclosure:

```text
New chat
Sites
Profile
  Business details
  Projects
  Certifications and reviews
  Media library
Ads
```

| Label | Kind | Route |
| -- | -- | -- |
| New chat | destination | `/cms` |
| Sites | destination | `/cms/website` |
| Profile | disclosure | none |
| Business details | destination under Profile | `/cms/details` |
| Projects | destination under Profile | `/cms/projects` |
| Certifications and reviews | destination under Profile | `/cms/certifications-and-reviews` |
| Media library | destination under Profile | `/cms/media` |
| Ads | destination | `/cms/ads` |

There is no `/cms/profile` route: **Profile** is a left-nav group, not a destination. There is
no `/cms/proof`. A top-level Projects or Media library item is too much sidebar for how often
it is used; Details is also opened infrequently. One Profile group keeps them reachable without
adding another peer of Sites.

## Profile disclosure

Profile is not a route. Clicking it only expands or collapses the group.

- **Children are the destinations.** Business details is the Details view
  ([details frontend](../../features/business-profile/details/frontend.md)). Projects:
  [projects frontend](../../features/business-profile/projects/frontend.md). Certifications and
  reviews: [certifications and reviews frontend](../../features/business-profile/certifications-and-reviews/frontend.md).
  Media library is `/cms/media` ([media library](../../features/other/media/README.md)).
- **Default expansion:** expanded when the current view is a Profile child; otherwise
  collapsed. The owner may toggle it while staying on another view.
- **Current route:** `aria-current` on the child. Profile gets a visual active style when
  a child is current, but is not itself `aria-current` when the sidebar is expanded.
- **Expanded sidebar:** labels only. Children are indented under Profile; no extra icons on
  children.
- **Collapsed sidebar (wide only):** only the Profile icon (person / `UserRound`, not a house). Children are hidden. The icon
  is active if a child is current (`aria-current` on the icon). Click **navigates to Business
  details**. It does not expand the sidebar. Expand or collapse labels with the sidebar panel
  control, or hover-peek. (2026-08-27: peek + pin; see [design decision record](design-decisions.md) 4.)
- **Narrow overlay selector:** no Profile disclosure. The four children are rows in the
  full-screen overlay (Business details, Projects, Certifications and reviews, Media library),
  with New chat, Sites, and Ads. Open destinations is inline with the screen heading.

Headings on Details, Projects, Certifications and reviews, Media library, and Ads have
no decorative icon. On narrow, Open destinations stays inline with the heading.

## New chat (`/cms`)

The New chat prompt clones dashboard `PlacisPromptBox` (look: [design decision record](design-decisions.md) 5). **Connect** links Google Ads and Meta ad accounts. It is not Connect website address and not Details Facebook / Google Maps listing. Hide Connect when both ad accounts are already connected (same status as Ads; do not paint it and then hide it). Voice is desktop-only; it opens a full-screen orb for the client interview (looks like the dashboard orb; not the website-editor canvas orb). Placeholders cycle.

## Out of scope

- Renaming Sites, adding `/cms/profile`, restoring `/cms/proof` or an **AI tools** left-nav item.
- Destination field specs (Details, Projects, Certifications and reviews, website editor, Ads).
