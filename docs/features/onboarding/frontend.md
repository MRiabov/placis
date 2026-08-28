# Onboarding Frontend

The contractor-facing onboarding in `frontend-2`. Screens and
fields match the implemented app (copied from the predecessor). Port:
[frontend-debloat.md](frontend-debloat.md). Look export:
[onboarding.html](../../design/onboarding.html) ([design.md](design.md)).

Related: [PRD](prd.md), [ADR](ADR.md), [pipeline](pipeline/README.md).

Onboarding is reachable **without** signing in. `/cms` with no active tenant
redirects here.

Loading placeholders: every screen, per field / row — not a whole-panel swap
([frontend.md](../../general-architecture/frontend.md)).

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
filling rows (SSE). **Continue**.

When `research_wait_until` is in the future, a quiet inline wait on this screen
(and on the client interview if they Continue): “We’ll look the business up
again in a few minutes.” Not a modal, not a full-screen stop, Continue stays
enabled. Same field on `GET .../profile` and SSE.

### 3. Client interview — `/onboarding/interview`

Default surface is **text**. Voice is listed and deferred ([04a](pipeline/04a-text-client-interview.md), [04b](pipeline/04b-voice-client-interview.md)). Text
submit completes the client interview, then 05 apply the website template. Port:
[frontend-debloat.md](frontend-debloat.md).

- **Who they are / contact / opening hours** — same fields as today. Legal
  identity stays on Review.
- **Services and service area** — free text is allowed. The LLM turns services
  into named services.
- **Photos** — show what business research already put in the media library
  (logo plus a few photos). Do not label a photo with the Google Maps listing or
  Facebook. **Upload photos** is always available. Do not ask a photos-choice
  question. **Source from the internet** and **AI photo** only when there are
  not enough photos yet.
- **Certifications** — trade accreditations with the definition badge, plus
  other certifications. Do not say proof. If they picked the company registry
  record on Find, the matching business-registry certification (CRO in Ireland)
  is selected and not deselectable.
- **Reviews** — present the reviews already found (who wrote it, the rating, the
  review citation, and where it came from). Not a blank notes box.
  **We do not have online reviews yet** only when none were found.

### 4. Wait teaser — `/onboarding/preview`

Wait teaser, not the shareable host. Timeline from the onboarding session SSE
(05 apply the website template, then 06 copy filling in). Rotate **complete**
filled website sections (whole-and-valid, not website placeholders), named
interval ~2s, smooth phase in/out especially images. Reuse
**website components** for that one website section — not Astro, not full
website pages, not the website editor path.

Wait until **website copy generation finishes** or the **~15s cap**, whichever
first. Then 07 writes `latest/` and the browser **navigates** to the preview
website address. Do not paint full website pages here. Do not put the
website-activation strip on this route (it lives in the host HTML).

### 5. Website preview + website activation — preview website address

Static R2 HTML (Cache then R2). Website-activation strip is a Clerk/Stripe
**island** in that HTML ([07](pipeline/07-website-preview.md), [cloudflare.md](../website/cloudflare.md)). Copy still running after they
land is not a live update. Success (08) → `/cms/website`. Anyone with the URL
may sign in and pay.

## Resume

Same browser. `localStorage` holds the onboarding session **token** and last UI
step. Reload calls `GET .../profile`. The stored step is a hint; onboarding
session status and whether `latest/` exists win. Screen map: [pipeline README](pipeline/README.md).

Reload during the wait → stay on `/onboarding/preview`, reconnect SSE, keep
rotating complete sections, finish the **same** wait (copy done or remaining
time to the original cap — not a new 15s). Reload after 07 → the host.
`activated` → `/cms/website`. The host opens without `localStorage`.

Restore failure keeps the token and
retries; it does not `POST` a new onboarding session.

## Components (`frontend-2`)

- `BusinessSourcePanel` — country, registry, optional Maps, online research
  consent.
- `FoundInformationReview` — found vs missing.
- `TextInterviewForm` / `AvailabilityPicker` / `AccreditationChecklist` — text
  client interview.
- `ApplyWebsiteTemplatePanel` / `PreviewProgressPanels` — SSE carousel of
  complete website sections.
- Leftover `src/features/preview/` is predecessor code to drop (no
  `/preview/{token}/` in this app).
