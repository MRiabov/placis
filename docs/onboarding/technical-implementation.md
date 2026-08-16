# Onboarding Technical Implementation

Status: proposed implementation plan.

Related: [PRD](prd.md), [ADR](ADR.md), [tenancy/auth/data model](../tenancy-auth-and-data-model.md).

## Domain objects

- `onboarding_sessions` — `tenant_id` nullable (anonymous until claim), `channel`
  (`voice`/`text`/`web`), `status`, `token` unique, `clerk_user_id` nullable.
- `consent_records` — per-purpose grants, versioned.
- `text_interview_submissions` — versioned interview payloads.
- `voice_observability_events` — sanitized events (no raw audio/secrets/WS headers).
- `research_sessions` → `research_runs` → `research_events` → `research_sources` (normalized
  findings with `kind`, `external_id`, `source_ref`, `raw`, `normalized`, `confidence`).
- `google_places_cache` — `place_id` → payload.
- `business_profiles` + `business_profile_versions` + `business_profile_services` +
  `business_profile_service_areas` + `business_profile_opening_hours`.

## State machine

`created → consenting → interviewing → researching → profile_draft → generating → previewing →
claimed/expired`. Research and generation run in parallel where possible.

## API surface

- `POST /api/v1/onboarding-sessions` (+ `.../from-google-place`)
- company-registry search, google-places autocomplete
- profile (`/profile`, `/profile/checklist`, `/profile/confirmations`, `/profile/facts`)
- consents (grant + withdraw)
- text interview (draft + submissions)
- research runs (list/get), generation runs (list/get/cancel)
- artifacts (list/get/apply/approve/reject/versions/rollback)
- preview packages (under onboarding — see the claim/activation note)

## Research pipeline

1. Provider call (behind interface) returns raw payload.
2. Normalize into a typed `research_sources` row: kind, external id, source ref, raw + normalized
   payload, confidence.
3. Photo classification tags assets (hero/project/service/founder/logo) for the media/slot mapping.
4. Every run is idempotent (explicit key) and consent-gated.

## Profile building

1. Merge transcript + research into a `business_profile_versions` snapshot (structured facts +
   `source_refs` + `created_by`).
2. Surface conflicting facts for owner/operator review.
3. On approval, `current_version_id` advances; generation reads the live version.

## Validation & testing

- Tenant isolation for sessions, research, and profile rows.
- Research/enrichment refuses to start without the matching consent grant.
- Provider fakes force deterministic tests; CI never spends provider quota (see `ci-cd.md`).
- One E2E: start → consent → interview → research → profile → generate (providers mocked, core
  logic unmocked).

## Frontend

- `frontend-2/src/features/setup/**` is the existing onboarding surface (text interview, sources,
  research progress, preview). It is refactored against the regenerated types; the `/setup-*`
  route naming it consumes maps to `/onboarding-*` on the Go side.
