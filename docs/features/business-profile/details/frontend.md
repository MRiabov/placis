# Details Frontend Specification

Status: proposed frontend specification for Business details.

Related docs:

1. [Details overview](README.md)
2. [Details ADR](ADR.md)
3. [Details persistence](persistence.md)
4. [Details design decision record](design-decision-record.md)
5. [The CMS (sidebar + main area)](../../../general-architecture/cms/frontend.md) — left nav, Profile, New chat
6. [frontend-debloat.md](frontend-debloat.md) — `frontend-2` port: keep / delete / retarget

## Purpose

The Details view at `/cms/details`. The heading is **Business details**. How the owner reaches
it: [The CMS (sidebar + main area)](../../../general-architecture/cms/frontend.md). Projects:
[projects frontend](../projects/frontend.md). Certifications and reviews:
[certifications and reviews frontend](../certifications-and-reviews/frontend.md). Media library:
[media library](../../other/media/README.md).

Loading placeholders: every screen, per field / row — not a whole-panel swap
([frontend.md](../../../general-architecture/frontend.md)).

## Business details (`/cms/details`)

Editing the Details subset of the business profile here still changes the website editor and
the next ad draft; the live website changes on the next website publication. Persist on
**click-off**. There is **no Save details** and no Last saved. Top menu and footer are not
edited here.

Panel order: **Identity** (including logo) first, then Contact and presence, Services, Legal
and compliance, then **Opening hours**. Hours is not the first panel.

#### Opening hours picker

Google Calendar-style, same bones as the onboarding AvailabilityPicker, in the CMS palette
(white, higher contrast). One row per weekday: Opens, to, Closes as a time range. **Closed**
is the unavailable control on that row (not a checkbox under a day column). Copy applies that
day’s hours to the following days. Add a time block is part of the look. These are when they
will pick up the **marketing phone**, not appointment copy. Shown on the contact website page.
Do **not** show an Appointment note field; persistence has no `note` column. Persistence is
still one Opens / Closes / Closed per day; extra time blocks are the target look. On a
narrow screen the day and Closed / add / copy sit on the first line; Opens and Closes chips
sit full-width below (Google Calendar on a small screen). Look: [design decision record](design-decision-record.md).

#### Logo picker

Pick from the media library (`logo_media_asset_id`).

#### Link your Facebook

Show the button **only when unlinked**. This pass: paste a public Facebook business URL
(type-to-search TBD). When linked, show that Facebook profile’s **name, photo, rating, and
review count**, plus **Change** — not the raw URL. Writes `facebook_profile_url`.
Same link as review import on Certifications and reviews. Not Ads Connect Meta, not Facebook
Login, no autoposting. Saving a new URL starts a public extract of that Facebook URL (reviews, posts,
images).

#### Google Maps listing

Same link pattern (`google_maps_listing_url`). When linked, the same card from that listing
(name, photo, rating, review count). Certifications and reviews imports from that listing.

Do not add unless asked: founder columns, brand tone / typography / colors.

See [README.md](README.md) for the rest of what it edits.

## Out of scope

- Renaming Sites, merging Details into the website editor, adding `/cms/profile`, restoring
  `/cms/proof` or an **AI tools** left-nav item.
