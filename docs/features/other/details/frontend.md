# Details Frontend Specification

Status: proposed frontend specification for Profile.

Related docs:

1. [Details overview](README.md)
2. [Details decision record](ADR.md)
3. [Details persistence](persistence.md)
4. [Website frontend](../../website/frontend.md) — Projects and Certifications and reviews
5. [Website design-decisions](../../website/design-decisions.md) — opening hours picker look
6. [frontend-debloat.md](frontend-debloat.md) — `frontend-2` port: keep / delete / retarget

## Purpose

This spec covers how the owner reaches **Details**, **Projects**, **Certifications and
reviews**, and the **media library** in The CMS (`frontend-2/`).

Details stays at `/cms/details`. Projects stays at `/cms/projects`. Certifications and reviews
stays at `/cms/certifications-and-reviews`. The media library stays at `/cms/media`. There is no `/cms/profile` route: **Profile** is a
left-nav group, not a destination. There is no `/cms/proof`.

A top-level Projects or Media library item is too much sidebar for how often it is used; Details is also opened
infrequently. One Profile group keeps them reachable without adding another peer of Sites.

Loading placeholders: every screen, per field / row — not a whole-panel swap
([frontend.md](../../../general-architecture/frontend.md)).

## Left nav

The CMS left nav lives in `frontend-2/src/features/cms/` (layout module; names in
[frontend-debloat.md](frontend-debloat.md)). Profile
replaces the current top-level Details item. Sites (the website editor entry) stays
where it is. There is no **AI tools** item: image cleanup is `/cms/media`; the website
assistant is the canvas overlay. Ads is a destination (screens: [ads frontend](../../ads/ad-generation/frontend.md)).

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

## Profile disclosure

Profile is not a route. Clicking it only expands or collapses the group.

- **Children are the destinations.** Business details is the Details view. Projects and Certifications
  and reviews are website-feature screens in this slice. Media library is `/cms/media`
  ([media library](../media/README.md)).
- **Default expansion:** expanded when the current view is a Profile child; otherwise
  collapsed. The owner may toggle it while staying on another view.
- **Current route:** `aria-current` on the child. Profile gets a visual active style when
  a child is current, but is not itself `aria-current` when the sidebar is expanded.
- **Expanded sidebar:** labels only. Children are indented under Profile; no extra icons on
  children.
- **Collapsed sidebar (wide only):** only the Profile icon (person / `UserRound`, not a house). Children are hidden. The icon
  is active if a child is current (`aria-current` on the icon). Click **navigates to Business
  details**. It does not expand the sidebar. Expand or collapse labels with the sidebar panel
  control, or hover-peek. (2026-08-27: peek + pin; see website design-decisions 16.)
- **Narrow overlay selector:** no Profile disclosure. The four children are rows in the
  full-screen overlay (Business details, Projects, Certifications and reviews, Media library),
  with New chat, Sites, and Ads. Open destinations is inline with the screen heading.

## Screens

### Business details (`/cms/details`)

The Details view. The heading is **Business details**. Editing the business profile here
still changes the website editor and the next ad draft; the live website changes on the next
website publication. Persist on **click-off**. There is **no Save details** and no Last saved.
Top menu and footer are not edited here.

Panel order: **Identity** (including logo) first, then Contact and presence, Services, Legal
and compliance, then **Opening hours**. Hours is not the first panel.

#### Opening hours picker

Google Calendar-style, same bones as the onboarding AvailabilityPicker, in the CMS palette
(white, higher contrast). One row per weekday: Opens, to, Closes as a time range. **Closed**
is the unavailable control on that row (not a checkbox under a day column). Copy applies that
day’s hours to the following days. Add a time block is part of the look. These are when they
will pick up the **marketing phone**, not appointment copy. Shown on the contact website page.
Do **not** show an Appointment note field; persistence has no `note` column. Persistence is
still one Opens / Closes / Closed per day; extra time blocks are the target look.

#### Logo picker

Pick from the media library (`logo_media_asset_id`).

#### Link your Facebook

Show the button **only when unlinked**. This pass: paste a public Facebook business URL
(type-to-search TBD). When linked, show the URL and **Change**. Writes `facebook_profile_url`.
Same link as review import on Certifications and reviews. Not Ads Connect Meta, not Facebook
Login, no autoposting. Saving a new URL starts a public extract of that Facebook URL (reviews, posts,
images).

#### Google Maps listing

Same link pattern (`google_maps_listing_url`). Certifications and reviews imports from that
listing.

Do not add unless asked: founder columns, brand tone / typography / colors.

See [README.md](README.md) for the rest of what it edits.

### Projects (`/cms/projects`)

Website-feature screen: title, description, cover photo. See
[website frontend](../../website/frontend.md).

### Certifications and reviews (`/cms/certifications-and-reviews`)

Website-feature screen: certification definition ticks and **All reviews** / **top reviews**
picker (ads). Each reviews website section’s ordered list is edited in website editor Content.
Create owner-written at `/cms/certifications-and-reviews/new` (route for now). See
[website frontend](../../website/frontend.md).

## Out of scope

- Renaming Sites, merging Details into the website editor, adding `/cms/profile`, restoring
  `/cms/proof` or an **AI tools** left-nav item.
