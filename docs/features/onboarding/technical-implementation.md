# Onboarding Technical Implementation

Status: proposed implementation plan.

Related: [PRD](prd.md), [ADR](ADR.md), [data model](data-model.md).

## Domain objects

See [data-model.md](data-model.md). The business profile is
[details/data-model.md](../other/details/data-model.md).

## Flow

`created → client_interviewing → applying_website_template → previewing → activated`
(`apply_website_template_failed` if applying the website template throws).
Business research runs in the background alongside review/client interview; applying the website template
starts at client interview complete; website copy generation runs after that and does not
block website preview or website activation.

## API surface

- `POST /api/v1/onboarding-sessions` (+ `.../from-google-maps-listing`)
- company-registry search, Google Maps autocomplete
- profile (`/profile`, `/profile/checklist`, `/profile/confirmations`, `/profile/details`)
- client interview (autosave + submissions)
- business research runs (list/get), apply-the-website-template runs (list/get/cancel)
- website publications (list/get/apply/approve/reject/profile history/website rollback)
- website previews (under onboarding — see the website activation note)

## Business research pipeline

1. Google Maps, the company registry, Facebook, the LLM, or a fake returns a raw fetch body.
2. Upsert typed output: a `business_research_sources` row (kind, external id, where it came from,
   lookup `status`, confidence). A Google Maps listing also upserts `google_maps_listings`
   (columns + `raw` ETL cache), hours, and reviews. Other kinds keep `raw` on the source row.
3. Photo classification tags media assets (hero/project/service/founder/logo) for the media library
   / website slot mapping.
4. Every run is safe to retry (explicit key).

## Profile building

1. Each client interview answer and each business research row becomes one or more
   `business_profile_edits` rows (only the fields/list items that writer set) applied to the live
   fold in the same transaction (`SELECT … FOR UPDATE`, then those columns only).
2. Surface research conflicts for the owner to review.
3. At client interview complete, set `accepted_edit_id`; applying the website template uses the
   profile as of that edit.

## Validation & testing

- Tenant isolation for onboarding sessions, business research, and profile rows.
- Fakes force deterministic tests; CI never spends Google / LLM / Stripe quota (see `ci-cd.md`).
- One E2E: find → review → client interview → apply the website template → website preview →
  website activation (Google / LLM / Stripe faked, core logic unmocked). The website preview can
  be activated before website copy generation finishes.

## Frontend

- The existing onboarding surface in `frontend-2` (find-the-business,
  client interview, business research progress, website preview) is refactored against the regenerated types;
  onboarding routes on the Go side use `/onboarding-*`.
