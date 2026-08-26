# Details HTTP

Conventions: [HTTP conventions](../../../general-architecture/api.md). Live business profile
the rest of the app reads. Projects: [website HTTP](../../website/api.md). Onboarding resume
is [onboarding `/profile`](../../onboarding/api.md), not this resource.

## Serve only types on HTTP

Profile history is typed `business_profile_edits` increments — never a `details` jsonb dump.
`GET`/`PATCH` fields are the columns and list tables in [persistence.md](persistence.md).
Validation errors: `string[]` with `maxLength` per item.

## Complete

### GET /v1/business-profile

- **Auth:** Clerk JWT, active tenant
- **Callers:** `/cms/details` (Business details). Website editor `*Read` may **embed** display
  name / marketing phone for website placeholders; it does not own this resource.
- **Response:** live business profile `*Read` (who they are, contact, where, services, legal,
  opening hours). No profile-history timeline.

### PATCH /v1/business-profile

- **Auth:** Clerk JWT, active tenant
- **Callers:** Business details save on click-off (no Save control).
- **Idempotency-Key:** yes.
- **Request:** dirty keys only (scalars + list-item ops), not a full-row dump. Writes
  `business_profile_edits` and the live business profile in one transaction.
- **Must not:** profile-history timeline HTTP; merge-in-memory rewrite of the whole row.

### GET /v1/business-profile/certifications / PUT /v1/business-profile/certifications

- **Auth:** Clerk JWT, active tenant
- **Callers:** `/cms/certifications-and-reviews`.
- **PUT Idempotency-Key:** yes.
- **Response:** selected accreditations plus `available[]` (definitions for that trade/country)
  in the same `*Read`. Persistence may use `website_certification_selections`; that is a table,
  not an HTTP collection.
- **Must not:** `/v1/certification-selections` or `/v1/certifications` as a peer resource.

### GET /v1/business-profile/reviews

- **Auth:** Clerk JWT, active tenant
- **Callers:** Certifications and reviews screen. Website editor picks these onto website slots
  (`website_slot_reviews`); Details owns the rows.

## Do not create

- `/v1/website/editor/business-profile`
- `/v1/certification-selections`, `/v1/certifications`
- profile-history / replay HTTP
