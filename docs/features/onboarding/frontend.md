# Onboarding Frontend

The contractor-facing onboarding in `frontend-2` (`src/features/setup/`). Screens and
fields match the implemented app (copied from OnCall).

Related: [PRD](prd.md), [ADR](ADR.md), [pipeline](pipeline/README.md).

Onboarding is reachable **without** signing in. `/cms` with no active tenant redirects here.

## Screens

### 1. Find — `/onboarding/find`

- **Country** — Ireland / United Kingdom / United States (default Ireland).
- **Company registry** — type the corporate name and pick the record (legal name, company number,
  status, registered office).
- **Google Maps** (optional) — search and pick the place. Confirm with registry, Maps, or both.
- **Online research consent** — checkbox required to enable Confirm.
- **Confirm and review** — creates the onboarding session, starts business research, goes to
  Review. Does not apply the website template or create a website preview yet.

### 2. Review — `/onboarding/review`

Found vs missing checklist (who they are, legal, contact, services, service area, certifications and
reviews, photos). Business research may still be filling rows (SSE). **Continue**.

### 3. Client interview — `/onboarding/interview`

Default surface is **voice** (mic → realtime agent). Text client interview is the other writer
(same fields as [02b](pipeline/02b-client-interview.md)). Voice `end_interview` goes to the
website preview; text submit completes the client interview the same way.

### 4. Website preview (progress) — `/onboarding/preview`

Timeline from the onboarding session SSE (04 apply the website template, then 05 copy filling in). In-page
website section renders while it runs. **View website** appears as soon as the website preview exists —
do not wait for website copy generation to finish.

### 5. Website preview + website activation — `/preview/{token}/…`

Rendered site (current unpublished website; copy appears as 05 writes website slots).
**Website activation** starts Clerk if needed, then Stripe checkout (07). Copy still running
is not a blocker. Success → `/cms/website`.

## Resume

`localStorage` holds the onboarding session id and step. Reload calls `GET .../profile`. An active website
preview resumes on the website preview screen.

## Components (`frontend-2`)

- `BusinessSourcePanel` — country, registry, optional Maps, online research consent.
- `FoundInformationReview` — found vs missing.
- `TextInterviewForm` / `AvailabilityPicker` / `AccreditationChecklist` — text client interview.
- Voice panel — `useSetupVoiceInterview`.
- `ApplyWebsiteTemplatePanel` / `PreviewProgressPanels` — timeline (apply-the-website-template + copy progress).
- `TargetedPreviewView` / `PayToClaimStrip` — website preview + website activation (`src/features/preview/`).
