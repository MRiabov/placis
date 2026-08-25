# Onboarding Frontend

The contractor-facing onboarding in `frontend-2`. Screens and
fields match the implemented app (copied from the predecessor). Port:
[frontend-debloat.md](frontend-debloat.md).

Related: [PRD](prd.md), [ADR](ADR.md), [pipeline](pipeline/README.md).

Onboarding is reachable **without** signing in. `/cms` with no active tenant redirects here.

Loading placeholders: every screen, per field / row — not a whole-panel swap
([frontend.md](../../general-architecture/frontend.md)).

## Screens

### 1. Find — `/onboarding/find`

- **Country** — Ireland / United Kingdom / United States (default Ireland).
- **Company registry** — type the corporate name and pick the record (legal name, company number,
  status, registered office).
- **Google Maps** (optional) — search and pick the place. Confirm with registry, Maps, or both.
- **Online research consent** — checkbox required to enable Confirm.
- **Confirm and review** — creates the onboarding session **once** (when this browser has no
  token), starts business research, goes to Review. Does not apply the website template or write
  the host yet. Opening Find with nothing stored must not `POST` an onboarding session.
  Opening Find with a stored token restores (see Resume).

### 2. Review — `/onboarding/review`

Found vs missing checklist (who they are, legal, contact, services, service area, certifications and
reviews, photos). Business research may still be filling rows (SSE). **Continue**.

When `research_wait_until` is in the future, a quiet inline wait on this screen (and on the
client interview if they Continue): “We’ll look the business up again in a few minutes.” Not a
modal, not a full-screen stop, Continue stays enabled. Same field on `GET .../profile` and SSE.

### 3. Client interview — `/onboarding/interview`

Default surface is **voice** (mic → realtime agent). Text client interview is the other writer
([04a](pipeline/04a-text-client-interview.md)). Voice is the default
([04b](pipeline/04b-voice-client-interview.md)); `end_interview` completes the client interview,
then 05 apply the website template. Text submit completes the same way.
Port: [frontend-debloat.md](frontend-debloat.md).

### 4. Short progress screen

Wait teaser, not the shareable host. Timeline from the onboarding session SSE (05 apply the
website template, then 06 copy filling in). Rotate **complete** filled website sections (whole-and-valid,
not website placeholders), named interval ~2s, smooth phase in/out especially images. Reuse
**website components** for that one website section — not Astro, not full website pages, not the
website editor path.

Wait until **website copy generation finishes** or the **~15s cap**, whichever first. Then 07
writes `latest/` and the browser **navigates** to the website preview host. Do not
paint full website pages here. Do not put the website-activation strip on this route (it lives in
the host HTML).

### 5. Website preview + website activation — website preview host

Static R2 HTML (Cache then R2). Website-activation strip is a Clerk/Stripe **island** in that
HTML ([07](pipeline/07-website-preview.md), [cloudflare.md](../website/cloudflare.md)). Copy still
running after they land is not a live update. Success (08) → `/cms/website`. Anyone with the URL
may sign in and pay.

## Resume

Same browser. `localStorage` holds the onboarding session **token** and last UI step. Reload calls
`GET .../profile`. The stored step is a hint; onboarding session status and whether `latest/`
exists win. Screen map: [pipeline README](pipeline/README.md).

Reload during the wait → stay on `/onboarding/preview`, reconnect SSE, keep rotating complete
sections, finish the **same** wait (copy done or remaining time to the original cap — not a new
15s). Reload after 07 → the host. `activated` → `/cms/website`. The host opens without
`localStorage`.

Restore failure keeps the token and
retries; it does not `POST` a new onboarding session.

## Components (`frontend-2`)

- `BusinessSourcePanel` — country, registry, optional Maps, online research consent.
- `FoundInformationReview` — found vs missing.
- `TextInterviewForm` / `AvailabilityPicker` / `AccreditationChecklist` — text client interview.
- `ApplyWebsiteTemplatePanel` / `PreviewProgressPanels` — SSE carousel of complete website sections.
- Leftover `src/features/preview/` is predecessor code to drop (no `/preview/{token}/` in this app).
