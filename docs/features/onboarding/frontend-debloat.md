# Onboarding `frontend-2` port — what to reduce

Status: planning (port instructions, not shipped UI).

## Target

[frontend.md](frontend.md), [pipeline README](pipeline/README.md),
[07 contractor copy improvement](pipeline/07-contractor-copy-improvement.md),
[08 preview website address](pipeline/08-preview-website-address.md),
[09 website activation](pipeline/09-website-activation.md),
[api.md](api.md).
Shared rules: [planning index](../../../planning/frontend-debloat.md).

Default client interview is **text**. Voice is listed and deferred ([04a](pipeline/04a-text-client-interview.md),
[04b](pipeline/04b-voice-client-interview.md)).

## Code today

- Don't say setup: `frontend-2/src/features/setup/` (Find, Review, client
  interview, progress, resume). Target folder:
  `frontend-2/src/features/onboarding/`.
- Website preview + website activation: leftover
  `frontend-2/src/features/preview/` (`PreviewRoute.tsx`,
  `TargetedPreviewView.tsx`, `PayToClaimStrip.tsx`, `api/preview.ts`). Drop that
  folder. Website preview is `/onboarding/preview-and-edit/` in `frontend-2`.
  The preview website address is the contractor host. The website-activation
  strip lives in the host HTML after share, not on `/onboarding/preview`.
- Router: `/onboarding`, `/onboarding/$step` in
  `frontend-2/src/app/router/index.tsx`. Drop `/preview/$token/$module`.
- Don't say setup: API `frontend-2/src/features/setup/api/setup.ts`,
  `interview.ts`, `eventsStream.ts`, `voice.ts` — all call
  Don't say setup: `/api/v1/setup-sessions…`.
- MSW: `frontend-2/src/test/msw/server.ts` stubs those same routes.
- Fixture: `frontend-2/src/test/fixtures/setupProfile.ts`.

## Keep

- Screens: `/onboarding/find`, `/onboarding/review`, `/onboarding/interview`,
  `/onboarding/preview` (SSE carousel), `/onboarding/preview-and-edit/`
  (unpaid canvas). Website preview + pay on the preview website address after
  Share.
- `BusinessSourcePanel` (country, company registry, optional Google Maps, online
  research consent). Business lookup creates the onboarding session **once**.
- `FoundInformationReview` (found vs missing; SSE may still fill rows).
- `TextInterviewForm` / `AccreditationChecklist`. Onboarding Details ==
  `/cms/details` (same field controls; not a separate AvailabilityPicker).
- Progress timeline (`PreviewProgressPanels` / select-and-copy website template
  panel): SSE carousel of website sections whose placeholders can resolve
  (~2s). Navigate to the
  preview website address when 07 has written `latest/` (copy done or ~15s cap).
- Drop leftover `TargetedPreviewView` and any website-activation strip on
  `/onboarding/preview`.
- Resume: `localStorage` holds the onboarding session token + last UI step;
  `GET …/profile` restores. Restore failure does not `POST` a new onboarding
  session.

## Delete

- Don't say setup: entire `frontend-2/src/features/setup/voice/` (~12 files:
  `useSetupVoiceInterview.ts`, `realtimeRuntime.ts`, `protocol.ts`, codecs,
  checklist inference). Recover from git when voice ships.
- Don't say setup: `api/voice.ts` (`…/voice-agent/session`, `…/events`,
  `…/debug-events`).
- Default-to-voice UI on `/onboarding/interview`.

## Do not port

- Don't say setup: `/api/v1/setup-sessions` and `…/profile/facts`.
- Voice as the first-pass client interview. Guide Voice
  (`/v1/onboarding/assistant/…`) stays listed + deferred.
- CMS `POST /v1/websites/{website_prefix}/publications` (or list /
  rollback) from the unpaid canvas. Share is
  `POST /v1/onboarding/website/publications`. Do not invent
  `/v1/onboarding/website-editor/…` or
  `POST /v1/onboarding/preview-website-address`.
- CRM / quotes / invoices / jobs leftover types on the website preview sandbox.

## Retarget

Named Routes and auth: [api.md](api.md). This table is predecessor → path.

| Today | Constrained API |
| --- | --- |
| Don't say setup: `POST /api/v1/setup-sessions` | `POST /v1/onboarding/business-lookup` |
| Don't say setup: `…/from-google-place` | company registry / Maps on the business-lookup body (no `…/from-google-maps-listing`) |
| Company registry search, Google Maps autocomplete | `GET /v1/onboarding/find/search/company-registry`, `GET /v1/onboarding/find/search/google-maps` |
| Attach or change Maps / registry after lookup | `PUT /v1/onboarding/sources` |
| `GET …/profile`, checklist | `GET /v1/onboarding/profile` (fill status nested; no checklist, no confirmations) |
| Text client interview autosave + submissions | `PUT /v1/onboarding/interview`; `POST /v1/onboarding/interview/complete` |
| Interview Project Archive | `POST /v1/onboarding/projects/{projectId}/archive` |
| Interview photo list / upload | `GET /v1/onboarding/media-assets`; `POST /v1/onboarding/media-assets/start-upload`; `POST /v1/onboarding/media-assets/{id}/confirm-upload` (not `/v1/media-assets` while unactivated) |
| Don't say setup: `GET …/events/stream` | `GET /v1/onboarding/events/stream` |
| Unpaid canvas `GET/PATCH` leftover website editor | `GET/PATCH /v1/onboarding/website/editor/pages…` and `…/menus` (not `/v1/websites/{website_prefix}/editor` while unactivated; PATCH Clerk only) |
| Unpaid `create_page` leftover CMS POST pages | `POST /v1/onboarding/website/editor/pages` (Clerk only; not CMS POST pages while unactivated) |
| Unpaid `update_details` leftover Details PATCH / Revert | `PATCH /v1/onboarding/business-profile`; `POST /v1/onboarding/business-profile/edits/{id}/undo` (Clerk only; not `/v1/business-profile` while unactivated) |
| Unpaid canvas Assistant hydrate / send / Voice | `GET /v1/onboarding/website/assistant/thread` (onboarding session token or Clerk); send and Voice same prefix, Clerk only. Not `/v1/assistant/…` |
| Don't say claim: `POST …/preview/{token}/claim` and `…/claim/checkout` | `POST /v1/onboarding/activation/checkout` (Host / `website_prefix`; not `/v1/website-previews/{token}/…`) |
| Don't say claim: `GET …/claim/status` | `GET /v1/onboarding/activation/status` |
| Don't say preview-packages / leftover share POST | `POST /v1/onboarding/website/publications` |

SSE drives Review, the client interview (live fill), `/onboarding/preview`,
and `/onboarding/preview-and-edit/` while 06 runs. The contractor host is
static HTML; it is not an SSE endpoint.

## Don't say / rename

- Don't say setup: folder `src/features/setup/` → `src/features/onboarding/`.
- Don't say setup: `SetupRoute` → `OnboardingRoute`; `useSetup*` →
  `useOnboarding*`.
- Don't say setup: `createGuidedSetupSession` / `getSetupProfile` → onboarding
  session helpers.
- Don't say setup: `localStorage` key
  `placis.contractorOnboarding.setupSessionId` → onboarding session token key.
- Don't say shell: `OnboardingShell` → onboarding layout.
- Don't say claim: `PayToClaimStrip` → website-activation strip on the preview
  website address; copy is website activation, never claim.
- Don't say session (bare): always **onboarding session** (or sign-in / client
  interview).

## Tests

- Don't say setup: retarget `setup/api/setup.test.ts`, `eventsStream.test.ts`,
  `interview.test.ts`, resume/onboarding model tests, `PayToClaimStrip.test.tsx`
  onto onboarding-session routes.
- Don't say setup: drop MSW handlers for `/api/v1/setup-sessions*`.
- Don't say setup: `e2e/parity/onboarding-parity.spec.ts` stubs those routes —
  drop with the cross-cutting parity suite.
- One E2E (feature `testing.md`): find → review → text client interview → apply
  the website template → website preview → website activation (Google / LLM /
  Stripe faked).

## Done when

- Folder and types use onboarding, not the predecessor name.
- Client-interview Voice code is gone from first-pass `frontend-2`. Unpaid
  canvas Voice stays (Retarget).
- Generated types and MSW call `/v1/onboarding/…` only.
- Text client interview is the default `/onboarding/interview` surface.
- Website activation copy and routes match 07. Don't say claim.
