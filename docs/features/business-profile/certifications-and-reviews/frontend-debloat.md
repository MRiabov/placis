# Certifications and reviews `frontend-2` port — what to reduce

Status: planning (port instructions, not shipped UI).

## Target

[frontend.md](frontend.md), [details API](../details/api.md). Shared rules:
[planning index](../../../../planning/frontend-debloat.md). Left nav:
[CMS frontend-debloat](../../../general-architecture/frontend-debloat.md).

## Code today

- Don't say proof: views include `proof`; `/cms/proof` renders
  `PlaceholderView`.
- Certifications helpers already in `cms.ts`.

## Keep

- `/cms/certifications-and-reviews` picker (ticks + Top / All / Archive).
- `GET`/`PUT /v1/business-profile/certifications` and reviews HTTP on
  [details API](../details/api.md).

## Delete

- Don't say proof: `/cms/proof` route, `proof` `CmsView`, and the Proof
  `PlaceholderView`.

## Do not port

- Restoring `/cms/proof`.
- Decorative boxed heading icon.

## Retarget

| Today | Target |
| --- | --- |
| `/cms/proof` stub | `/cms/certifications-and-reviews` |
| Certifications helpers already in `cms.ts` | `/v1/business-profile/certifications` |

## Don't say / rename

- Don't say proof: view id, route, and heading.

## Done when

- No `/cms/proof`. Certifications and reviews matches [frontend.md](frontend.md).
