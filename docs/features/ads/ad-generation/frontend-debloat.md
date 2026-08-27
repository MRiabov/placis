# Ads `frontend-2` port — what to reduce

Status: planning (port instructions, not shipped UI).

## Target

[frontend.md](frontend.md), [technical-implementation.md](technical-implementation.md),
[ADR.md](ADR.md), [api.md](../api.md). Shared rules: [planning index](../../../../planning/frontend-debloat.md).
Left nav Ads item: [CMS frontend-debloat](../../../general-architecture/frontend-debloat.md).
Photos: [media library](../../other/media/frontend-debloat.md).

There is **no** ads UI in `frontend-2` today. This file is mostly a do-not-port list
so the predecessor OpenAPI does not grow a campaign console.

## Code today

- No `frontend-2/src/features/ads/`.
- No `/cms/ads`, `/cms/ads/new`, `/cms/ads/{id}` in `app/router/index.tsx`.
- `frontend-2/src/generated/api-types.ts` has **no** `/v1/ads/*`.
- Predecessor leftovers that must not become Ads screens: CRM sandbox schemas
  (quotes, invoices, crew, workflows) and unconstrained JSON blobs in that
  generated file (cross-cutting file owns the typegen cut).

## Keep

Nothing to adapt in place. When backend phase 5 lands, **build** `/cms/ads` from
[frontend.md](frontend.md) inside the existing CMS frame (sidebar stays).

## Delete

Nothing in an ads module (it does not exist). Do not add ads types from the
predecessor contract.

## Do not port

- Campaign console, budgets, targeting, scheduling, live performance (stubs on
  the list/detail screens are specified; they stay disabled).
- Ad posting UI (disabled control only, until that work ships).
- Raw JSON editing.
- Don't say: ad package — the deliverable is an **ad set**
  (`POST /v1/ads/{ad_id}/ad-set`).
- Website-editor integration (ads are their own records).
- A second media picker or token palette.

## Retarget

When implementing, call only:

1. `GET/POST /v1/ads`
2. `GET/PATCH/DELETE /v1/ads/{ad_id}` (delete = draft-only)
3. variants GET/PATCH; `POST …/rewrite` (required prompt); `POST …/cleanup` (required prompt)
4. `POST …/approve`
5. `POST …/ad-set`
6. `POST …/download`

Mutating: `Idempotency-Key` + `base_updated_at`; `409` re-GETs. Prefetch the ads
list (and ad-platform connection status) into the query cache as specified.

## Don't say / rename

- Don't say: ad package → ad set (API path `ad-set`, not `package`).
- Don't say posting: the disabled control is **ad posting**.
- Don't say needs review: creation-flow label is **ad needs review**; existing-ad
  badges are Ad draft / Creative ready / Published / archived as in
  [frontend.md](frontend.md).
- Don't say description in the UI: **short label** (stored as `description`).
- Don't say ICP: **ideal customer profile**.
- Don't say client: contractor / owner.

## Tests

- None to drop (no ads e2e yet).
- One E2E when the feature ships ([testing.md](testing.md)): create → review/edit
  → approve → use the ad set (download); LLM / ad platforms faked.

## Done when

- `/cms/ads` matches [frontend.md](frontend.md) and the routes above.
- Generated types include `/v1/ads/*` and not predecessor campaign/ops paths.
- No unconstrained JSON editing in this workspace.
