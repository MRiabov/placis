# Onboarding Technical Implementation

Status: proposed implementation plan.

Related: [PRD](prd.md), [ADR](ADR.md), [data model](data-model.md).

## Domain objects

See [data-model.md](data-model.md). The business profile is
[details/data-model.md](../other/details/data-model.md).

## Flow

`created → interviewing → generating → previewing → claimed` (`generation_failed` if generate
throws). Research runs in the background alongside review/interview; generation starts at
interview complete; copy generation runs after instantiate and does not block preview or claim.

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
- One E2E: find → review → interview → generate → preview → claim (providers mocked, core logic
  unmocked). Preview is claimable before copy generation finishes.

## Frontend

- `frontend-2/src/features/setup/**` is the existing onboarding surface (find-the-business,
  interview, research progress, preview). It is refactored against the regenerated types; the
  `/setup-*` route naming it consumes maps to `/onboarding-*` on the Go side.
