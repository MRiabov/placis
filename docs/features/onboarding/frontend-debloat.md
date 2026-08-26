# Onboarding `frontend-2` port — what to reduce

Status: planning (port instructions, not shipped UI).

## Target

[frontend.md](frontend.md), [pipeline README](pipeline/README.md),
[07 website preview](pipeline/07-website-preview.md),
[08 website activation](pipeline/08-website-activation.md),
[api.md](api.md).
Shared rules: [planning index](../../../planning/frontend-debloat.md).

Default client interview is **text**. Voice is listed and deferred
([04a](pipeline/04a-text-client-interview.md), [04b](pipeline/04b-voice-client-interview.md)).

## Code today

- Don't say setup: `frontend-2/src/features/setup/` (Find, Review, client interview,
  progress, resume). Target folder: `frontend-2/src/features/onboarding/`.
- Website preview + website activation: leftover `frontend-2/src/features/preview/`
  (`PreviewRoute.tsx`, `TargetedPreviewView.tsx`, `PayToClaimStrip.tsx`,
  `api/preview.ts`). Drop that folder; website preview is the contractor host
  ([frontend stack](../../general-architecture/frontend-stack.md)).
  The website-activation strip lives in the host HTML, not on `/onboarding/preview`.
- Router: `/onboarding`, `/onboarding/$step` in
  `frontend-2/src/app/router/index.tsx`. Drop `/preview/$token/$module`.
- Don't say setup: API `frontend-2/src/features/setup/api/setup.ts`,
  `interview.ts`, `eventsStream.ts`, `voice.ts` — all call
  Don't say setup: `/api/v1/setup-sessions…`.
- MSW: `frontend-2/src/test/msw/server.ts` stubs those same routes.
- Fixture: `frontend-2/src/test/fixtures/setupProfile.ts`.

## Keep

- Screens: `/onboarding/find`, `/onboarding/review`, `/onboarding/interview`,
  `/onboarding/preview` (SSE carousel). Website preview + pay: the preview website address.
- `BusinessSourcePanel` (country, company registry, optional Google Maps, online
  research consent). Business lookup creates the onboarding session **once**.
- `FoundInformationReview` (found vs missing; SSE may still fill rows).
- `TextInterviewForm` / `AvailabilityPicker` / `AccreditationChecklist`.
- Progress timeline (`PreviewProgressPanels` / apply-the-website-template panel): SSE carousel of
  complete website sections (~2s). Navigate to the preview website address when 07
  has written `latest/` (copy done or ~15s cap).
- Drop leftover `TargetedPreviewView` and any website-activation strip on `/onboarding/preview`.
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
| Don't say setup: `POST /api/v1/setup-sessions` | `POST /v1/onboarding-sessions/business-lookup` |
| Don't say setup: `…/from-google-place` | company registry / Maps on the business-lookup body (no `…/from-google-maps-listing`) |
| Company registry search, Google Maps autocomplete | same nested under onboarding sessions |
| `GET …/profile`, checklist | `…/profile`, `…/profile/checklist`, confirmations, details |
| Text client interview autosave + submissions | client interview autosave + submissions |
| Don't say setup: `GET …/events/stream` | `GET /v1/onboarding-sessions/{id}/events/stream` |
| Don't say claim: `POST …/preview/{token}/claim` and `…/claim/checkout` | public checkout / activation-status (Host / `website_prefix`; not `/v1/website-previews/{token}/…`) |
| Don't say claim: `GET …/claim/status` | activation-status |

SSE drives `/onboarding/preview` only. The contractor host is static HTML; it is not an SSE
endpoint.

## Don't say / rename

- Don't say setup: folder `src/features/setup/` → `src/features/onboarding/`.
- Don't say setup: `SetupRoute` → `OnboardingRoute`; `useSetup*` → `useOnboarding*`.
- Don't say setup: `createGuidedSetupSession` / `getSetupProfile` → onboarding session helpers.
- Don't say setup: `localStorage` key `placis.contractorOnboarding.setupSessionId` → onboarding session token key.
- Don't say shell: `OnboardingShell` → onboarding layout.
- Don't say claim: `PayToClaimStrip` → website-activation strip on the preview website address; copy is website activation, never claim.
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
- Generated types and MSW call `/v1/onboarding-sessions…` only.
- Text client interview is the default `/onboarding/interview` surface.
- Website activation copy and routes match 07. Don't say claim.
