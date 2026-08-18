# Onboarding Frontend

The contractor-facing onboarding surface in `frontend-2` (`src/features/setup/`). Screens and
fields match the implemented app (copied from OnCall).

Related: [PRD](prd.md), [ADR](ADR.md), [pipeline](pipeline/README.md).

Onboarding is reachable **without** signing in. `/cms` with no active tenant redirects here.

## Screens

### 1. Find — `/onboarding/find`

- **Country** — Ireland / United Kingdom / United States (default Ireland).
- **Company registry** — type the corporate name and pick the record (legal name, company number,
  status, registered office).
- **Google Maps** (optional) — search and pick the place. Confirm with registry, Maps, or both.
- **Consent** — checkbox required to enable Confirm.
- **Confirm and review** — creates the session, starts research, goes to Review. Does not
  generate or preview yet.

### 2. Review — `/onboarding/review`

Found vs missing checklist (who they are, legal, contact, services, area, proof, photos). Research
may still be filling rows (SSE). **Continue to interview**.

### 3. Interview — `/onboarding/interview`

Default surface is **voice** (mic → realtime agent). Text form is the other writer (same fields
as [02b](pipeline/02b-interview.md)). Voice `end_interview` goes to Preview; text submit completes
the interview the same way.

### 4. Preview (progress) — `/onboarding/preview`

Generation timeline from the session SSE (04 instantiate, then 05 copy filling in). In-page
section previews while it runs. **View website** appears as soon as the preview package exists —
do not wait for copy generation to finish.

### 5. Public preview + claim — `/preview/{token}/…`

Rendered site (current draft; copy appears as 05 writes slots). **Claim** starts Clerk if needed,
then Stripe checkout (07). Copy still running is not a blocker. Success → `/cms/website`.

## Resume

`localStorage` holds the session id and step. Reload calls `GET .../profile`. An active preview
package resumes on Preview.

## Components (`frontend-2`)

- `BusinessSourcePanel` — country, registry, optional Maps, consent.
- `FoundInformationReview` — found vs missing.
- `TextInterviewForm` / `AvailabilityPicker` / `AccreditationChecklist` — text interview.
- Voice panel — `useSetupVoiceInterview`.
- `GenerationPanel` / `PreviewProgressPanels` — generating timeline.
- `TargetedPreviewView` / `PayToClaimStrip` — public preview + claim (`src/features/preview/`).
