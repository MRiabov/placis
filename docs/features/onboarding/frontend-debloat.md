# Onboarding `frontend-2` port — what to reduce

Status: planning (port instructions, not shipped UI).

## Target

[frontend.md](frontend.md), [pipeline README](pipeline/README.md),
[06 website preview](pipeline/06-website-preview.md),
[07 website activation](pipeline/07-website-activation.md).
Shared rules: [planning index](../../../planning/frontend-debloat.md).

First-pass client interview is **text**. Voice is a later milestone
([go-backend-rewrite.md](../../../planning/go-backend-rewrite.md)).

## Code today

- Don't say setup: `frontend-2/src/features/setup/` (Find, Review, client interview,
  progress, resume). Target folder: `frontend-2/src/features/onboarding/`.
- Website preview + website activation: `frontend-2/src/features/preview/`
  (`PreviewRoute.tsx`, `TargetedPreviewView.tsx`, `PayToClaimStrip.tsx`,
  `api/preview.ts`).
- Router: `/onboarding`, `/onboarding/$step`, `/preview/$token/$module` in
  `frontend-2/src/app/router/index.tsx`.
- Don't say setup: API `frontend-2/src/features/setup/api/setup.ts`,
  `interview.ts`, `eventsStream.ts`, `voice.ts` — all call
  Don't say setup: `/api/v1/setup-sessions…`.
- MSW: `frontend-2/src/test/msw/server.ts` stubs those same routes.
- Fixture: `frontend-2/src/test/fixtures/setupProfile.ts`.

## Keep

- Screens: `/onboarding/find`, `/onboarding/review`, `/onboarding/interview`,
  `/onboarding/preview`.
- `BusinessSourcePanel` (country, company registry, optional Google Maps, online
  research consent). Confirm creates the onboarding session **once**.
- `FoundInformationReview` (found vs missing; SSE may still fill rows).
- `TextInterviewForm` / `AvailabilityPicker` / `AccreditationChecklist`.
- Progress timeline (`PreviewProgressPanels` / apply-the-website-template panel).
  **View website** as soon as the website preview exists.
- `TargetedPreviewView` + Stripe website-activation strip. Success → `/cms/website`.
- Resume: `localStorage` holds the onboarding session token + last UI step;
  `GET …/profile` restores. Restore failure does not `POST` a new onboarding session.

## Delete

- Don't say setup: entire `frontend-2/src/features/setup/voice/` (~12 files:
  `useSetupVoiceInterview.ts`, `realtimeRuntime.ts`, `protocol.ts`, codecs,
  checklist inference). Recover from git when voice ships.
- Don't say setup: `api/voice.ts` (`…/voice-agent/session`, `…/events`,
  `…/debug-events`).
- Default-to-voice UI on `/onboarding/interview`.

## Do not port

- Don't say setup: `/api/v1/setup-sessions` and `…/profile/facts`.
- Voice as the first-pass client interview.
- Website publication CRUD under onboarding (belongs under the website editor).
- CRM / quotes / invoices / jobs leftover types on the website preview sandbox.

## Retarget

| Today | Constrained API |
| --- | --- |
| Don't say setup: `POST /api/v1/setup-sessions` | `POST /api/v1/onboarding-sessions` |
| Don't say setup: `…/from-google-place` | `…/from-google-maps-listing` |
| Company registry search, Google Maps autocomplete | same nested under onboarding sessions |
| `GET …/profile`, checklist | `…/profile`, `…/profile/checklist`, confirmations, details |
| Text client interview autosave + submissions | client interview autosave + submissions |
| Don't say setup: `GET …/events/stream` | `GET /api/v1/onboarding-sessions/{id}/events/stream` |
| Don't say claim: `POST …/preview/{token}/claim` and `…/claim/checkout` | activate / activation-checkout / activation-status |
| Don't say claim: `GET …/claim/status` | activation-status |

SSE drives `/onboarding/preview` only. The `/preview/{token}` route reloads; it is
not an SSE endpoint.

## Don't say / rename

- Don't say setup: folder `src/features/setup/` → `src/features/onboarding/`.
- Don't say setup: `SetupRoute` → `OnboardingRoute`; `useSetup*` → `useOnboarding*`.
- Don't say setup: `createGuidedSetupSession` / `getSetupProfile` → onboarding session helpers.
- Don't say setup: `localStorage` key `placis.contractorOnboarding.setupSessionId` → onboarding session token key.
- Don't say shell: `OnboardingShell` → onboarding layout.
- Don't say claim: `PayToClaimStrip` → website-activation strip; copy is website activation, never claim.
- Don't say session (bare): always **onboarding session** (or sign-in / client interview).

## Tests

- Don't say setup: retarget `setup/api/setup.test.ts`, `eventsStream.test.ts`, `interview.test.ts`,
  resume/onboarding model tests, `PayToClaimStrip.test.tsx` onto onboarding-session
  routes.
- Don't say setup: drop MSW handlers for `/api/v1/setup-sessions*`.
- Don't say setup: `e2e/parity/onboarding-parity.spec.ts` stubs those routes —
  drop with the cross-cutting parity suite.
- One E2E (feature `testing.md`): find → review → text client interview → apply
  the website template → website preview → website activation (Google / LLM /
  Stripe faked).

## Done when

- Folder and types use onboarding, not the predecessor name.
- Voice code is gone from first-pass `frontend-2`.
- Generated types and MSW call `/api/v1/onboarding-sessions…` only.
- Text client interview is the default `/onboarding/interview` surface.
- Website activation copy and routes match 07. Don't say claim.
