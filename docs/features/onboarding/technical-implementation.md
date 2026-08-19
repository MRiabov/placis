# Onboarding Technical Implementation

Status: proposed implementation plan.

Related: [PRD](prd.md), [ADR](ADR.md), [data model](data-model.md).

## Domain objects

See [data-model.md](data-model.md). The business profile is
[details/data-model.md](../other/details/data-model.md).

## Flow

`created → interviewing → generating → previewing → activated` (`generation_failed` if applying
the website template throws; TODO: rename these statuses off `generating` / `generation_failed`).
Business research runs in the background alongside review/client interview; applying the website
template starts at client interview complete; website copy generation runs after that and does not
block website preview or website activation.

## API surface

- `POST /api/v1/onboarding-sessions` (+ `.../from-google-place`)
- company-registry search, google-places autocomplete
- profile (`/profile`, `/profile/checklist`, `/profile/confirmations`, `/profile/details`)
- client interview (autosave + submissions)
- business research runs (list/get), generation runs (list/get/cancel)
- website publications (list/get/apply/approve/reject/profile history/website rollback)
- website previews (under onboarding — see the website activation note)

## Business research pipeline

1. Provider call (behind interface) returns raw payload.
2. Turn it into a typed `research_sources` row: kind, external id, where it came from, raw +
   normalized payload, confidence.
3. Photo classification tags media assets (hero/project/service/founder/logo) for the media
   library / website slot mapping.
4. Every run is safe to retry (explicit key).

## Profile building

1. Merge client interview answers + business research into a `business_profile_versions` row (details + where
   each came from + who changed it).
2. Surface research conflicts for the owner to review.
3. On approval, the profile advances to the current `business_profile_versions` row; applying the
   website template reads it.

## Validation & testing

- Tenant isolation for onboarding sessions, business research, and profile rows.
- Fakes force deterministic tests; CI never spends Google / LLM / Stripe quota (see `ci-cd.md`).
- One E2E: find → review → client interview → apply the website template → website preview →
  website activation (Google / LLM / Stripe faked, core logic unmocked). The website preview can
  be activated before website copy generation finishes.

## Frontend

- `frontend-2/src/features/setup/**` is the existing onboarding surface (find-the-business,
  client interview, business research progress, website preview). It is refactored against the regenerated types; the
  `/setup-*` route naming it consumes maps to `/onboarding-*` on the Go side.
