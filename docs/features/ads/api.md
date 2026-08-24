# Ads HTTP

Conventions: [HTTP conventions](../../general-architecture/api.md). Ad generation service
routes. Spec authority: [ad-generation](ad-generation/ADR.md). Contractor website never calls
these. `platform_refs` is **omit** from first-slice DTOs.

## OpenAPI opacity

| Location | Persistence | HTTP |
| --- | --- | --- |
| Ads `platform_refs` | jsonb | **Omit** until ad posting. Then named fields (`meta_ad_id`, …), not a string map. |
| LLM traces | jsonb | **Omit.** |

Download signed URL: `string` + `maxLength`. Copy fields use platform character limits as
`maxLength`.

## Complete

All mutating routes: **Auth** Clerk JWT, active tenant; **Idempotency-Key** yes. PATCH /
regenerate / approve send `base_updated_at` (last-seen `ads.updated_at`). Match → bump and
return it. Mismatch → `409`; `frontend-2` re-GETs. No undo.

- `GET /v1/ads` — list
- `POST /v1/ads` — create draft
- `GET /v1/ads/{ad_id}`
- `PATCH /v1/ads/{ad_id}`
- `DELETE /v1/ads/{ad_id}` — ad draft only
- `GET /v1/ads/{ad_id}/variants`
- `PATCH /v1/ads/{ad_id}/variants/{variant_id}`
- `POST /v1/ads/{ad_id}/variants/{variant_id}/regenerate` — LLM draft for copy and/or image
  gallery on one variant
- `POST /v1/ads/{ad_id}/approve`
- `POST /v1/ads/{ad_id}/ad-set` — returns the ad set
- `POST /v1/ads/{ad_id}/download` — renders; returns a signed URL for the ad-set download

Approve / ad-set / download / archive mutations write `audit_events`. External API keys are
future work and must not change the ad set format.

## Do not create

- campaign console / budgets / targeting / scheduling HTTP
- ad posting HTTP
- undo/redo
- `package` path (the deliverable is an **ad set**)
- `platform_refs` as a string map on first-slice DTOs
