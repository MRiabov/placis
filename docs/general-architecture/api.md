# HTTP conventions

Canonical HTTP rules for `cmd/api`. Same role as [persistence.md](persistence.md) for tables:
conventions here, route lists in per-feature `api.md`. Feature `api.md` files open with a
pointer here and do not restate these rules.

Feature `api.md` files:

- [Auth](../features/other/auth/api.md)
- [Onboarding](../features/onboarding/api.md) (includes website activation)
- [Website](../features/website/api.md) (unpublished website, website publication, Connect
  website address, projects)
- [Details](../features/other/details/api.md) (live business profile, certifications, reviews)
- [Media library](../features/other/media/api.md)
- [Ads](../features/ads/api.md)
- [Leads](../features/other/leads/api.md) (website form submit)

The [Placis website](../features/placis-website/README.md) has no Go HTTP. Live contractor
website HTML is Cache then R2; it never calls Go.

This file is HTTP conventions, not Go structs. DTOs still fall out per slice
([development principles](../development-principles.md)). Predecessor OpenAPI is not a
compatibility surface: do not alias `/api/v1/…`.

## Versioning

Every JSON route is `/v1/…`. Drop `/api`. The Go process *is* the HTTP API; `frontend-2` and
the contractor website are other origins.

There is **one** live contract. Do not build a `/v2` handler tree in the rewrite. Additive
fields stay on `/v1`. A breaking change that cannot ship together is when `/v2` appears.

- `GET /openapi.json` — huma discovery. Unversioned.
- `GET /v1/health` — process liveness. No tenant. Auth: none.
- Stored website copy stays `website.v1` (a document generation on `website_manifest`, not
  this HTTP prefix).

## Typing

Two type layers: sqlc rows and huma DTOs ([backend stack](backend-stack.md)). Reuse one
`*Read` per entity and one `*Create` / `*Update` per write. Do not say Projection or Summary.

Every DTO field is constrained: strings `minLength`/`maxLength`, numbers `minimum`/`maximum`,
fixed sets `enum`. Persistence-on-blur is **save on click-off** (no Save control).
Website styles use **explicit apply**, not save on click-off.

Verbs: `Create` / `Update` / `Get` / `List` / `Delete`. Domain nouns in paths.
Do not say `slug` in paths or fields (website address / website page path).

Do not say **fold** in `api.md` or path names. Say **live business profile** and
**unpublished website**.

## Serve only types on HTTP

The predecessor shipped unconstrained JSON bags.
Don't say: `JsonRecord` / `JsonObjectPayload` / `additionalProperties`.
**Forbid that on every frontend-facing field.**

Postgres may keep polymorphic dumps as `jsonb` columns
([persistence](persistence.md)). That is storage. Huma request/response types are **not** those
columns. A DTO field that is `map[string]any`, `json.RawMessage`, `object` with
`additionalProperties: true`, or a `string` the UI `JSON.parse`s is a failed contract.

Huma will emit unconstrained objects if a DTO uses them. That is not a Huma gap. CI already
requires minLength/maxLength/enum ([ci-cd.md](ci-cd.md)). That does **not** catch those four
shapes. When Go exists, the contract check must fail them on huma DTOs, including SSE event
structs. Persistence `jsonb` columns stay.

Each `jsonb` column is either a typed HTTP union/struct or **omit**. Feature `api.md` files
repeat only their own rows.

### Persistence `jsonb` → HTTP

| Location | Persistence | HTTP to `frontend-2` / contractor website |
| --- | --- | --- |
| Website slot `value` | jsonb | Discriminated union on `slot_type`: `text`/`rich_text` → string + `maxLength`; `image` → media library item id + crop/focal; `link` → url + label; `list` → typed array (e.g. project ids). **Do not expose `slot_type=json`.** Project galleries and reviews are ids / `website_slot_reviews`, not a JSON bag. |
| Website section `props` | jsonb | `oneOf` by `component_id` from the website component catalog. Extra keys 4xx. Unknown `component_id` → `unsupported_component` flag + no props bag. |
| Website section `design` | jsonb | Named design-control fields (enum/bool options from the same website component catalog). Extra keys 4xx. |
| Website edit history `before`/`after` | jsonb (one website slot or field) | Same union as the live field (`entity_type` + `field` / website slot key). |
| Website manifest | jsonb `website.v1` | **Omit** from website-editor GET/PATCH. Website publication `*Read` is metadata (website version number, status, times). Live HTML does not use this HTTP. |
| Website styles overrides | columns + bounded jsonb | Named fields: `preset_id`, `primary`, `neutral`, `accent`, `radius`, `density`. Extra keys 4xx. |
| Ads `platform_refs` | jsonb | **Omit** from first-slice DTOs. When ad posting exists: named fields (`meta_ad_id`, …), not a string map. |
| Company registry / Maps search | raw ETL cache | `*Read` (id, name, address, …). **Omit** `raw`. |
| Business research fetches | `raw` jsonb | **Omit.** Checklist `*Read` is named keys + status enum. |
| Stripe event body | jsonb | **Omit** from `frontend-2`. Activation-status is a closed enum + checkout URL. |
| LLM traces (`ai_generations`) | jsonb | **Omit.** Website assistant activity cards are named event structs. |
| Audit `before`/`after` | jsonb | **Omit** from `frontend-2`. |
| Website form website visitor POST | — | Named fields matching that website form’s `fields[]`. Extra keys 4xx. |
| Upload signed URL | string | URL `maxLength`. |
| Website assistant plan | text | `string` + `maxLength`. Markdown. Do not `JSON.parse`. |
| Client interview extra notes | text | `string` + `maxLength`. |
| Validation errors | `text[]` | `string[]` with `maxLength` per item + closed `code` enum where we have codes. |

### Do not create

- Don't say: `JsonRecord`, `JsonObjectPayload`, `PublicSite*` bags, `props: object`, `value: object`
  without discriminator
- `slot_type=json` on GET/PATCH
- String fields documented as a JSON blob
- SSE `payload` as unconstrained object
- Returning `business_research_fetches.raw`, Maps `raw`, Stripe raw, or `ai_generations`
  blobs to `frontend-2`

Website component catalog structs are the only polymorphism: discriminator `component_id` /
`slot_type`, generated into OpenAPI `oneOf`. A leftover `JsonObject` in
`packages/website-components` is a contractor-website cut, not an HTTP excuse.

## Auth modes

Named once here. Feature `api.md` files name the mode, they do not redefine it.

1. **none** — Find search + Confirm.
2. **onboarding session token** — request header or query as specified on the onboarding `api.md`.
3. **Clerk JWT, active tenant only** — `/v1/me.tenant` non-null.
4. **website preview token** — website activation + Worker internal render.
5. **Stripe webhook signature**.

Contractor website `Host` is CORS for website form POST only. HTML GET never reaches Go, so
it is not a sixth auth mode.

Clerk ids (`clerk_org_id`, `clerk_user_id`, `clerk_subject`) are Postgres columns and JWT
claims. The Clerk SDK verifies the sign-in. They are not an HTTP union and are not on
`GET /v1/me` as a dump.

## Errors

Named fields: `code`, `message`, optional `retry_after`.

- `409 edit_history_conflict` — unpublished website PATCH when `base_edit_history_head` is
  stale. `frontend-2` re-GETs with `include_edit_history=true`.
- `409` ads — `base_updated_at` mismatch. `frontend-2` re-GETs.
- `413` — oversize PATCH (website editor body cap 64 KB).
- `429` — business research wave cap or over-chatty PATCH. `Retry-After` / `research_wait_until`.

## Retries

Mutating routes that are safe to retry accept `Idempotency-Key` (checked per tenant). Named
on each Complete mutation in the feature `api.md`.

## Onboarding SSE

`GET /v1/onboarding-sessions/{id}/events/stream` uses Huma `sse.Register`: event name → Go
struct, so payloads are in `/openapi.json`. Do not use a raw `net/http` handler that bypasses
the spec. `frontend-2` exhaustive-matches; unknown events are logged and dropped, never
parsed as `any`.

The website preview link is **not** SSE. Onboarding `/onboarding/preview` is.

## Worker internal render

Website publication (River) renders `website.v1` through an authenticated internal render
(shared secret / service binding) and writes R2. That is not public OpenAPI. **Do not create**
`/v1/public/site/…`. Do not create leftover `/preview/{token}/` HTML.

Live contractor HTML GET is Cache then R2. Never Go. The leftover token path is gone.

## Cross-cutting routes

### GET /v1/health

- **Auth:** none
- **Callers:** Railway / local process checks
- **Response:** liveness only. No tenant.

### GET /openapi.json

- **Auth:** none (or the same gate as other unauthenticated discovery; not a tenant resource)
- **Callers:** `openapi-typescript` typegen
- **Response:** huma OpenAPI 3.1
