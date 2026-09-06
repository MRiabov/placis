# Certifications HTTP

Conventions: [HTTP conventions](../../../general-architecture/api.md).
Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).
One Profile **screen** with reviews:
[reviews](../reviews/README.md). [ADR](../reviews/ADR.md) 1.
Rows: [business profile persistence](../details/persistence.md).
Go: `internal/profile/certifications/`. Dos **call** `profile`
`service.go`.

**Auth default:** Clerk JWT, active tenant. Mutating Routes send
`Idempotency-Key`. Unactivated **403** on this tree.

HTTP functions (same spelling in spec, Go, and tests):
`GetBusinessProfileCertifications`, `PutBusinessProfileCertifications`.

## DTOs

| DTO | Fields | Description |
| --- | --- | --- |
| `BusinessProfileCertificationListRead` | `available: []CertificationDefinitionRead`, `selected: []BusinessProfileCertificationSelectionRead` | Certifications wrap |
| `CertificationDefinitionRead` | `id`, `name`, `short_label`, `trades`, `country`, `badge`, `registry_url` | Global definition for `available[]`. `registry_url` optional; painters link the badge/card when set |
| `BusinessProfileCertificationSelectionRead` | `id`, `certification_id`, `status` | Tenant tick. `status` → `selected` / `removed` |
| `BusinessProfileCertificationsPut` | `certification_ids[]` | PUT selected set |

## Routes

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/business-profile/certifications` | `/cms/certifications-and-reviews` | | `BusinessProfileCertificationListRead` | `certification_definitions`, `business_profile_certification_selections` | | `available[]` for that country plus selected ticks | | `/v1/certification-selections`; `/v1/certifications` as a peer |
| `PUT /v1/business-profile/certifications` | `/cms/certifications-and-reviews` | `BusinessProfileCertificationsPut` | `BusinessProfileCertificationListRead` | `certification_definitions` | `business_profile_certification_selections`, `business_profile_edits` | See overflow | | Peer certification HTTP; key `available[]` off a closed trade enum |

### PUT /v1/business-profile/certifications

Replace the selected set. Unchecking is `status=removed`, not delete.
`available[]` is definitions for that country; do not key it off a
closed trade enum. Persistence is `certification_definitions` +
`business_profile_certification_selections`; those are tables, not an
HTTP collection.

## Do not create

- `/v1/certification-selections`, `/v1/certifications`
- a second certifications Register on Details HTTP
