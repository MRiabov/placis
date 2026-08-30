# Onboarding Frontend

The contractor-facing onboarding in `frontend-2`. Screens and
fields match the implemented app (copied from the predecessor). Port:
[frontend-debloat.md](frontend-debloat.md). Look export:
[onboarding.html](../../design/onboarding.html) ([design.md](design.md),
[design decision record](design-decision-record.md)).

Related: [PRD](prd.md), [ADR](ADR.md), [pipeline](pipeline/README.md).

Onboarding is reachable **without** signing in. `/cms` with no active tenant
redirects here.

Loading placeholders: every screen, per field / row — not a whole-panel swap
([frontend.md](../../general-architecture/frontend.md)).

Find, Review, client interview, and the wait teaser share one screen layout
([design decision](design-decision-record.md) 1): heading and lede, card wells, sticky footer with the
primary action in the same place. Visible copy is owner language, not PRD or
pipeline phrasing ([design decision](design-decision-record.md) 6). The wordmark is the Placis orb lockup
([design decision](design-decision-record.md) 3). Each card opens with a heading block that is visibly
larger than field labels ([design decision](design-decision-record.md) 9).

## Screens

### 1. Find — `/onboarding/find`

- **Country** — Ireland / United Kingdom / United States (default Ireland).
- **Company registry** — type the corporate name and pick the record (legal
  name, company number, status, registered office).
- **Google Maps** (optional) — search and pick the place. Business lookup with
  registry, Maps, or both.
- **Online research consent** — checkbox required to enable business lookup.
- **Business lookup** — creates the onboarding session **once** (when this
  browser has no token), starts business research, goes to Review. Does not
  apply the website template or write the host yet. Opening Find with nothing
  stored must not `POST` an onboarding session. Opening Find with a stored token
  restores (see Resume).

### 2. Review — `/onboarding/review`

Found vs missing checklist (who they are, legal, contact, services, service
area, certifications and reviews, photos). Business research may still be
filling rows (SSE). **Continue** in the shared footer. No missing-topics queue
or “next: client interview” aside ([design decision](design-decision-record.md) 2).

When `research_wait_until` is in the future, a quiet inline wait on this screen
(and on the client interview if they Continue): “We’ll look the business up
again in a few minutes.” Not a modal, not a full-screen stop, Continue stays
enabled. Same field on `GET .../profile` and SSE.

### 3. Client interview — `/onboarding/interview`

**Onboarding Details == Business details** ([ADR](ADR.md) 19). The Details block on this
screen is `/cms/details`: same fields, same controls, same writes. If Details
changes, this screen changes. Legal identity stays on Review.
Client-interview-only extras wrap that block (photos, certifications, reviews,
Projects, extra notes, contact name, `emergency_phone`). Look: white
`.onb-card`, not the Details panel ([design decision](design-decision-record.md) 12).

Default surface is **text** (owner: **Write**). Voice is listed and deferred
([04a](pipeline/04a-text-client-interview.md), [04b](pipeline/04b-voice-client-interview.md)); owner copy is that voice is coming later, not pipeline phrasing.
Text submit completes the client interview, then 05 apply the website template.
Port:
[frontend-debloat.md](frontend-debloat.md).

02 may still be running. SSE applies the live business profile onto this
screen so they do not re-type what business research finds
([04a](pipeline/04a-text-client-interview.md) live fill). A control they have
not edited this visit, and whose winning `algorithm` is not `human`, takes the
new value. Lists that can grow (services, service areas, hours on empty days,
certifications they did not remove, reviews, photos, Projects) **enrich**: new
rows appear; existing contractor rows stay. Do not replace a control they are
editing or have already saved. Extra notes are contractor-only (business
research does not write them).

- **Your business / contact / opening hours** — Details identity, contact, and
  hours, same controls as `/cms/details`. Legal identity stays on Review.
  Hours: one range per day, Closed, copy to following days; no extra time
  block ([design decision](design-decision-record.md) 12). Untouched hours fill
  from Maps; a day they edited is not rewritten.
- **Services and service area** — featured services as a list
  (`business_profile_services`), not a textarea. Paste of one-per-line or
  comma-separated **names** splits into rows (no LLM). Service areas: Google
  Maps territory lookup, one card per region (`locality` + `radius_km`). Owner
  copy: we’ll turn each name into a website page; search a place, then set how
  far you travel. Complete has those list rows before 05
  ([ADR](ADR.md) 18). Crawl may add rows they have not already entered.
- **Photos** — media library items business research has attached so far
  (logo plus a few photos). New items appear as extract chunks land. Do not
  label a photo with the Google Maps listing or Facebook. **Upload photos** is
  always available. Do not ask a photos-choice question. **Find more online**
  and **Create a stand-in** only when there are not enough photos yet.
- **Certifications** — trade accreditations with the definition badge, plus
  other certifications. Do not say proof. If they picked the company registry
  record on Find, the matching business-registry certification (CRO in Ireland)
  is selected and not deselectable. Newly found accreditations may select;
  a certification they unmarked stays `removed`.
- **Reviews** — reviews on the live profile, looking like Google reviews
  (profile photo when we have one, else the initial; name, source mark, stars,
  relative date, review citation)
  ([design decision](design-decision-record.md) 4). Not a blank notes box.
  The list grows as scrape / transform inserts. **We do not have online
  reviews yet** only while the pool is still empty (hide that line once the
  first review lands).
- **Projects** — if business research has `active` business research origin
  Projects, show up to four cards (current completeness rank: cover, then text
  length). Same card look as `/cms/projects` (cover, title, description). No
  Project draft badge. Not editable. **Archive** on the card (onboarding session
  token; [api](api.md)). Zero `active` → omit the whole block. Cards may appear or
  reorder while business research is still running. The onboarding guide does
  not Archive these cards.
- **Anything else we should know?** — extra notes (`additional_notes`).
  Optional. Helper: what would help us generate a better website or run ads
  ([design decision](design-decision-record.md) 5).

### 4. Wait teaser — `/onboarding/preview`

Wait teaser, not the shareable host. Timeline from the onboarding session SSE
(05 apply the website template, then 06 copy filling in). Rotate **complete**
filled website sections (whole-and-valid, not website placeholders), named
interval ~2s, smooth phase in/out especially images. Reuse
**website components** for that one website section — not Astro, not full
website pages, not the website editor path.

Wait until **website copy generation finishes** or the **~15s cap**, whichever
first. The footer shows a progress bar for that cap, painted every animation
frame ([design decision](design-decision-record.md) 7). Then the browser **navigates** to
`/onboarding/preview-and-edit/`. Do not paint full website pages here. Do not
put the website-activation strip on this route (it lives in the host HTML after
Share). The wait-teaser hero uses the same job-site photo as the site they will
open. The wait timeline moves to “Opening the site” as the cap ends
([design decision](design-decision-record.md) 11). `prefers-reduced-motion` stops the carousel loop and
jumps the bar in second steps.

The look export’s **Skip generation** and `?scene=generated` are mock-only
([design decision](design-decision-record.md) 8). That mock includes the sticky
website-activation strip ([design decision](design-decision-record.md) 10).
Paid (the Paid tab) opens the website editor look export with **Publish**
(`?scene=website&publication=1&from=activation`).

### 5. Website preview + website activation — `/onboarding/preview-and-edit/`

Wait teaser `/onboarding/preview` (SSE carousel, ~15s cap) then **navigates to
`/onboarding/preview-and-edit/`**. Live unpublished canvas. Custom top-left
control to switch website pages (titles list; not the CMS Website pages rail).
Canvas top-menu/footer website page clicks stay on this route. Top-right: pay,
**Share**, **Assistant** (text composer + DustOrb). No Content, no website
styles rail, no click-to-edit, no design controls. Signed-out: view + switch
website pages; send/Voice require sign-in.

**Share** (optional) runs [07](pipeline/07-website-preview.md): preview website
address with website-activation strip. Pay on the website preview **or** on
that strip ([08](pipeline/08-website-activation.md)). After 08 this route
redirects to `/cms/website` (website editor, **Publish**).

The look export’s unpaid website preview is `apps/demo/`
`/onboarding/preview-and-edit`. The static host mock stays `GeneratedPage`
(`/onboarding/generated`).

## Resume

Same browser. `localStorage` holds the onboarding session **token** and last UI
step. Reload calls `GET .../profile`. The stored step is a hint; onboarding
session status and whether `latest/` exists win. Screen map: [pipeline README](pipeline/README.md).

Reload during the wait → stay on `/onboarding/preview`, reconnect SSE, keep
rotating complete sections, finish the **same** wait (copy done or remaining
time to the original cap — not a new 15s). Reload after wait-end →
`/onboarding/preview-and-edit/`. `activated` → `/cms/website`. The preview
website address (after share) opens without `localStorage`.

Restore failure keeps the token and
retries; it does not `POST` a new onboarding session.

## Components (`frontend-2`)

- `BusinessSourcePanel` — country, registry, optional Maps, online research
  consent.
- `FoundInformationReview` — found vs missing; no missing-topics aside.
- `TextInterviewForm` — Details block == `/cms/details` (same field controls:
  featured-service list, Maps territory cards, hours picker) plus
  client-interview extras. SSE live-fills untouched controls and enriches
  lists (reviews, photos, Projects, services) while 02 runs. Extra notes
  owner copy: Anything else we should know? Helper: what would help us
  generate a better website or run ads.
- `AccreditationChecklist` — trade certifications plus other certifications.
- `ApplyWebsiteTemplatePanel` / `PreviewProgressPanels` — SSE carousel of
  complete website sections; 15s wait progress in the shared footer, painted
  every animation frame.
- Leftover `src/features/preview/` is predecessor code to drop (no
  `/preview/{token}/` in this app).
