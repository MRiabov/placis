# Left nav and `/cms`

The CMS (sidebar + main area): left nav, Profile disclosure, `/cms` chooser. Destination
screens live with their features. Loading placeholders: every screen, per field / row — not a
whole-panel swap ([frontend.md](../frontend.md)).

Look: [design decision record](design-decision-record.md). Tokens: [design.md](design.md). Port:
[frontend-debloat.md](../frontend-debloat.md). [ADR](ADR.md).

## Left nav

The CMS left nav lives in `frontend-2/src/features/cms/` (layout module; names in
[frontend-debloat.md](../frontend-debloat.md)). Profile replaces the current top-level Details
item. Sites (the website editor entry) stays where it is. There is no **AI tools** item: image
cleanup is `/cms/media`; the website assistant is the canvas overlay. Ads is a destination
(screens: [ads frontend](../../features/ads/ad-generation/frontend.md)).

`/cms` is **not** a sidebar destination. After they pick a card, the rail is Sites / Profile /
Ads. Direct `/cms` (land or go to the URL) still shows the chooser.

On a **narrow** screen the destinations are a **full-screen overlay selector** (no leftover
icon rail). Profile is not a row; the four children are:

```text
Sites
Business details
Projects
Certifications and reviews
Media library
Ads
```

On a **wide** screen Profile is a disclosure:

```text
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

**Hide in product; keep mock HTML:** Settings, Log out, New chat nav row, Paperclip, Start
client interview orb, Upgrade shelf. Do not delete those nodes from the look-export HTML.
Do **not** hide the website-editor voice orb.

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
  control, or hover-peek. (2026-08-27: peek + pin; see [design decision record](design-decision-record.md) 4.)
- **Narrow overlay selector:** no Profile disclosure. The four children are rows in the
  full-screen overlay (Business details, Projects, Certifications and reviews, Media library),
  with Sites and Ads. Open destinations is inline with the screen heading.

Headings on Details, Projects, Certifications and reviews, Media library, and Ads have
no decorative icon. On narrow, Open destinations stays inline with the heading.

## `/cms` (two cards)

`/cms` is a **deep-link only** chooser: land on it or go to the URL. Two cards under **Placis**:

- **Do my website…** — done-for-you. Goes to `/cms/website`. Description: **Have Placis do your
  website** (or similar).
- **Run my ads** — the ads twin. Goes to `/cms/ads`. Ad posting is soon enough that “Run” is
  allowed.

No first-turn assistant POST. No Paperclip. No Start client interview (that control promised a second
client interview after website activation). Product voice is the website-editor canvas orb and
the Ads product guide — not this screen.

**Connect** stays (Google Ads and Meta ad accounts). It is not Connect website address and not
Details Facebook / Google Maps listing. Hide Connect when both ad accounts are already
connected (same status as Ads; do not paint it and then hide it). No first-slice connection
HTTP in this pass. Owner copy must not say “run campaigns” while Ads only export.

The old prompt-box markup stays in the look-export HTML as restorable nodes
(look: [design decision record](design-decision-record.md) 5). Product paints the two cards
instead.

Ads look for `/cms/ads` is [ads-workspace.html](../../features/ads/ad-generation/design/ads-workspace.html)
(list, then workspace). The look-export Ads pane is a pointer stub, not Ads UX.

## Account

Clerk UserButton photo. Name under it is the **Clerk human name** (the person), not the
business / `tenant.name` and not the Clerk organization string. Never an org chooser; never
owner copy “Clerk organization”. Settings is Clerk account handling — hide the tab. No log out
for now. Keep that markup in the mock.

## Out of scope

- Renaming Sites, adding `/cms/profile`, restoring `/cms/proof` or an **AI tools** left-nav item.
- Destination field specs (Details, Projects, Certifications and reviews, website editor, Ads).
- Deleting restorable nodes from the look-export HTML.
