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
  token), starts business research, goes to Review. Does not apply the website template or create a
  website preview yet. Opening Find with nothing stored must not `POST` an onboarding session.
  Opening Find with a stored token restores (see Resume).

### 2. Review — `/onboarding/review`

Found vs missing checklist (who they are, legal, contact, services, service area, certifications and
reviews, photos). Business research may still be filling rows (SSE). **Continue**.

### 3. Client interview — `/onboarding/interview`

First-pass surface is **text** (same fields as [02b](pipeline/02b-client-interview.md)).
Submit completes the client interview and starts applying the website template. Voice is a
**later milestone** (not in this port); see [frontend-debloat.md](frontend-debloat.md).

### 4. Website preview (progress) — `/onboarding/preview`

Timeline from the onboarding session SSE (04 apply the website template, then 05 copy filling in). On-screen
website section renders while it runs. **View website** appears as soon as the website preview exists —
do not wait for website copy generation to finish.

### 5. Website preview + website activation — `/preview/{token}/…`

Rendered site (current unpublished website; copy appears as 05 writes website slots).
**Website activation** starts Clerk if needed, then Stripe checkout (07). Copy still running
is not a blocker. Success → `/cms/website`.

## Resume

Same browser. `localStorage` holds the onboarding session **token** and last UI step. Reload calls
`GET .../profile`. The stored step is a hint; onboarding session status and `active_website_preview`
win. Screen map: [pipeline README](pipeline/README.md).

An active website preview lands on `/onboarding/preview` with View website. The website preview
link still opens without `localStorage` and has no TTL (410 only if unknown, superseded, or
activated).

Restore failure keeps the token and
retries; it does not `POST` a new onboarding session.

## Components (`frontend-2`)

- `BusinessSourcePanel` — country, registry, optional Maps, online research consent.
- `FoundInformationReview` — found vs missing.
- `TextInterviewForm` / `AvailabilityPicker` / `AccreditationChecklist` — text client interview.
- `ApplyWebsiteTemplatePanel` / `PreviewProgressPanels` — timeline (apply-the-website-template + copy progress).
- `TargetedPreviewView` plus the website-activation strip — website preview + website activation (`src/features/preview/`).
