# Onboarding Technical Implementation

Status: proposed implementation plan.

Related: [PRD](prd.md), [ADR](ADR.md), [tenancy/auth/data model](../../tenancy-auth-and-data-model.md).

## Domain objects

- `onboarding_sessions` — the source the contractor started from (Google Maps listing or
  company-registry record), the interview channel (`text`/`voice`), `status`, `token` unique,
  `clerk_user_id` nullable, `consent_given_at` nullable.
- `text_interview_submissions` — the interview answers, saved as the contractor goes.
- `voice_observability_events` — sanitized events (no raw audio/secrets/WS headers).
- `research_sessions` → `research_runs` → `research_events` → `research_sources` (findings with
  `kind`, `external_id`, where it came from, `raw`, `normalized`, `confidence`).
- `google_places_cache` — `place_id` → payload.
- `business_profiles` + `business_profile_versions` + `business_profile_services` +
  `business_profile_service_areas` + `business_profile_opening_hours`.

## Flow

`created → interviewing → profile_draft → generating → previewing → claimed/expired`. Research
runs in the background alongside the interview; generation reads the live profile.

## API surface

- `POST /api/v1/onboarding-sessions` (+ `.../from-google-place`)
- company-registry search, google-places autocomplete
- profile (`/profile`, `/profile/checklist`, `/profile/confirmations`, `/profile/facts`)
- interview (draft + submissions)
- research runs (list/get), generation runs (list/get/cancel)
- artifacts (list/get/apply/approve/reject/versions/rollback)
- preview packages (under onboarding — see the claim/activation note)

## Research pipeline

1. Provider call (behind interface) returns raw payload.
2. Turn it into a typed `research_sources` row: kind, external id, where it came from, raw +
   normalized payload, confidence.
3. Photo classification tags assets (hero/project/service/founder/logo) for the media/slot mapping.
4. Every run is idempotent (explicit key).

## Profile building

1. Merge interview answers + research into a `business_profile_versions` row (details + where
   each came from + who changed it).
2. Surface conflicting answers for owner/operator review.
3. On approval, the profile advances to the current version; generation reads it.

## Validation & testing

- Tenant isolation for sessions, research, and profile rows.
- Provider fakes force deterministic tests; CI never spends provider quota (see `ci-cd.md`).
- One E2E: start → interview → research → profile → generate (providers mocked, core logic
  unmocked).

## Frontend

- `frontend-2/src/features/setup/**` is the existing onboarding surface (sources, interview,
  research progress, preview). It is refactored against the regenerated types; the `/setup-*`
  route naming it consumes maps to `/onboarding-*` on the Go side.
