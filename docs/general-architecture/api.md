# HTTP conventions

Canonical HTTP rules for `cmd/api`. Same role as [persistence.md](persistence.md) for tables:
conventions here, route lists in per-feature `api.md`. Feature `api.md` files
open with a pointer here and do not restate these rules.

Feature `api.md` files:

- [Auth](../features/other/auth/api.md)
- [Onboarding](../features/onboarding/api.md) (includes website activation and `/v1/onboarding/assistant/…`;
  SSE reads [ETL](../features/etl/README.md) `etl.runs` and the live business profile — ETL has no public
  `api.md`)
- [Assistant](../features/assistant/api.md) (CMS `/v1/assistant/…`; voice under
  `/v1/assistant/voice/`; text `GET /v1/assistant/thread/ws`)
- [Billing](../features/billing/api.md) (usage credit, Usage & billing)
- [Website](../features/website/api.md) (unpublished website, website publication, Connect website address)
- [Details](../features/business-profile/details/api.md) (live business profile, certifications, reviews)
- [Projects](../features/business-profile/projects/api.md)
- [Media library](../features/other/media/api.md)
- [Ads](../features/ads/api.md)
- [Leads](../features/other/leads/api.md) (website form submit)

The [Placis website](../features/placis-website/README.md) has no Go HTTP. Live contractor website HTML is Cache then
R2; it never calls Go.

This file is HTTP conventions, not Go structs. DTO **type names and fields**
are named in the feature `api.md` before code
([docs conventions](../docs-conventions.md#named-identifiers)). Do not dump
Go struct bodies or OpenAPI YAML here. Predecessor OpenAPI is not a
compatibility surface: do not alias `/api/v1/…`.

## Versioning

Every JSON route is `/v1/…`. Drop `/api`. The Go process *is* the HTTP API;
`frontend-2` and the contractor website are other origins.

There is **one** live contract. Do not build a `/v2` handler tree in the
rewrite. Additive fields stay on `/v1`. A breaking change that cannot ship
together is when `/v2` appears.

- `GET /openapi.json` — huma discovery. Unversioned.
- `GET /v1/health` — process liveness. No tenant. Auth: none.
- Stored website copy stays `website.v1` (a document generation on
  `website_manifest`, not this HTTP prefix).

## Typing

Two type layers: sqlc rows and huma DTOs ([backend stack](backend-stack.md)). Reuse one `*Read`
per entity and one `*Create` / `*Update` per write. Do not say Projection or
Summary.

Every DTO field is constrained: strings `minLength`/`maxLength`, numbers
`minimum`/`maximum`, fixed sets `enum`. Persistence-on-blur is
**save on click-off** (no Save control). Website styles use **explicit apply**,
not save on click-off.

**TODO:** Save on click-off writes the unpublished website or an ad draft. It
does not write the live website, a published website copy, or a Published ad.
The website editor already does this
([website editing](../features/website/editing.md)). Ads stay on the ad draft
until ad posting. Projects should follow the same split; today click-off
PATCHes the live `business_profile.projects` row that website publication and
ads also read
([projects HTTP](../features/business-profile/projects/api.md)). A media
library item already used on the live website is not mutated in place on
click-off
([media library](../features/other/media/persistence.md)).

Verbs: `Create` / `Update` / `Get` / `List` / `Delete`. Domain nouns in paths.
Do not say `slug` in paths or fields (website prefix / website page path).

Do not say **fold** in `api.md` or path names. Say **live business profile** and
**unpublished website**.

CMS unpublished website writes are `POST`/`PATCH` on `/v1/website/editor/…` only
([website HTTP](../features/website/api.md)).

## Serve only types on HTTP

The predecessor shipped unconstrained JSON objects.
Don't say: `JsonRecord` / `JsonObjectPayload` / `additionalProperties`.
**Forbid that on every frontend-facing field.**

Postgres may keep polymorphic dumps as `jsonb` columns ([persistence](persistence.md)). That is
storage. Huma request/response types are **not** those columns. A DTO field that
is `map[string]any`, `json.RawMessage`, `object` with
`additionalProperties: true`, or a `string` the UI `JSON.parse`s is a failed
contract.

Huma will emit unconstrained objects if a DTO uses them. That is not a Huma gap.
CI already requires minLength/maxLength/enum ([ci-cd.md](ci-cd.md)). That does **not**
catch those four shapes. When Go exists, the contract check must fail them on
huma DTOs, including SSE event structs. Persistence `jsonb` columns stay.

Each `jsonb` column is either a typed HTTP union/struct or **omit**. Feature
`api.md` files repeat only their own rows.

### Persistence `jsonb` → HTTP

| Location | Persistence | HTTP to `frontend-2` / contractor website |
| --- | --- | --- |
| Website slot `value` | jsonb | Discriminated union on `slot_type`: `text`/`rich_text` → string + `maxLength`; `image` → media library item id + crop/focal; `link` → url + label; `list` → typed array (e.g. project ids). **Do not expose `slot_type=json`.** Project galleries and reviews are ids / `website_slot_reviews`, not unconstrained JSON. |
| Website section `props` | jsonb | `oneOf` by `component_id` from the website component catalog. Extra keys 4xx. Unknown `component_id` → `unsupported_component` flag + no props object. |
| Website section `design` | jsonb | Named design-control fields (enum/bool options from the same website component catalog). Extra keys 4xx. |
| Website edit history `before`/`after` | jsonb (one website slot or field) | Same union as the live field (`entity_type` + `field` / website slot key). |
| Website manifest | jsonb `website.v1` | **Omit** from website-editor GET/PATCH. Website publication `*Read` is metadata (website version number, status, times). Live HTML does not use this HTTP. |
| Website styles overrides | columns + bounded jsonb | Named fields: `preset_id`, `primary`, `neutral`, `accent`, `radius`, `density`. Extra keys 4xx. |
| Ads `platform_refs` | jsonb | **Omit** from first-slice DTOs. When ad posting exists: named fields (`meta_ad_id`, …), not a string map. |
| Company registry / Maps search | registry parquet / Maps autocomplete (not `etl.*_fetches`) | `*Read` (id, name, address, …). **Omit** `raw`. |
| Business research / ETL fetches | `raw` jsonb | **Omit.** Checklist `*Read` is named keys + status enum. |
| Stripe event body | jsonb | **Omit** from `frontend-2`. Activation-status is a closed enum + checkout URL. |
| LLM traces (`ai_generations`) | jsonb | **Omit.** Assistant activity is named event structs. Each tool event has `summary` (`string` + `maxLength`) for owner copy. Never render tool names. |
| Audit `before`/`after` | jsonb | **Omit** from `frontend-2`. |
| Website form website visitor POST | — | Named fields matching that website form’s `fields[]`. Extra keys 4xx. |
| Upload signed URL | string | URL `maxLength`. |
| Website assistant plan | text | `string` + `maxLength`. Markdown. Do not `JSON.parse`. |
| Client interview extra notes | text | `string` + `maxLength`. |
| Validation errors | `text[]` | `string[]` with `maxLength` per item + closed `code` enum where we have codes. |

### Do not create

- Don't say: `JsonRecord`, `JsonObjectPayload`, `PublicSite*` objects,
  `props: object`, `value: object` without discriminator
- `slot_type=json` on GET/PATCH
- String fields documented as JSON
- SSE `payload` as unconstrained object
- Returning ETL fetch `raw`, Stripe raw, or `ai_generations`
  jsonb to `frontend-2`

Website component catalog structs are the only polymorphism: discriminator
`component_id` / `slot_type`, generated into OpenAPI `oneOf`. A leftover
`JsonObject` in `packages/website-components` is a contractor-website cut, not
an HTTP excuse.

## Auth modes

Named once here. Feature `api.md` files name the mode, they do not redefine it.

1. **none** — Find search + business lookup.
2. **onboarding session token** — request header or query as specified on the
   onboarding `api.md`.
3. **Clerk JWT, active tenant only** — `tenants.status=active`. Not
   `/v1/me.tenant` non-null (`/me` may return unactivated `TenantRead`).
4. **Clerk JWT, Host / `website_prefix`** — unactivated tenant allowed. Website
   activation checkout and status on the preview website address. Tenant comes
   from the contractor `Host`, not from `/me.tenant`.
5. **Stripe webhook signature**.

Clerk JWT + unactivated tenant on the **app** origin (unpublished GET/PATCH,
`/v1/onboarding/website-editor/assistant/…` send/Voice) is the same Clerk
verification as mode 3 without the active gate. Not a sixth mode. Onboarding
session token (mode 2) may GET unpublished website and GET
`/v1/onboarding/website-editor/assistant/thread`; it must not PATCH and must
not send.

Contractor website `Host` is CORS for website form POST and website activation
checkout/status. HTML GET never reaches Go, so it is not a sixth auth mode.

Clerk ids (`clerk_org_id`, `clerk_user_id`, `clerk_subject`) are Postgres
columns and JWT claims. The Clerk SDK verifies the sign-in. They are not an HTTP
union and are not on `GET /v1/me` as a dump.

## Errors

Named fields: `code`, `message`, optional `retry_after`.

- `402 usage_credit_exhausted` — billed work when usage credit is exhausted. Not
  409 (conflict). Named on billed assistant HTTP in [billing](../features/billing/api.md). CMS assistant:
  `GET /v1/assistant/thread/ws` text send,
  `POST /v1/assistant/voice/realtime-connection`, and
  `POST /v1/assistant/voice/tool-calls` when that tool is a billed LLM or image
  call. Not 403 (lifecycle) and not 409 (in-flight lock / allowed-set /
  Ask-first). Usage settlement (`POST /v1/assistant/voice/transcripts`) stays
  `200` so the debit can land.
- `402 subscription_canceled` — website publication or live website rollback
  when the subscription is not active (`subscription_status=canceled`). Not
  `usage_credit_exhausted`. Named on
  [website publication](../features/website/api.md).
- `409 edit_history_conflict` — unpublished website PATCH when
  `base_edit_history_head` is stale. `frontend-2` re-GETs with
  `include_edit_history=true`.
- `409` ads — `base_updated_at` mismatch. `frontend-2` re-GETs.
- `413` — oversize PATCH (website editor body cap 64 KB). Oversize CMS voice
  recording (`byte_size` over the cap on `POST /v1/assistant/voice/recordings`).
- `429` — onboarding ETL enqueue cap or over-chatty PATCH. `Retry-After` /
  `research_wait_until`.

## Retries

Mutating routes that are safe to retry accept `Idempotency-Key` (checked per
tenant). Named on each mutating **Routes** row in the feature `api.md`.

## Onboarding SSE

`GET /v1/onboarding-sessions/{id}/events/stream` uses Huma `sse.Register`: event
name → Go struct, so payloads are in `/openapi.json`. Do not use a raw
`net/http` handler that bypasses the spec. `frontend-2` exhaustive-matches;
unknown events are logged and dropped, never parsed as `any`.

The contractor host is **not** SSE. `/onboarding/preview` and
`/onboarding/preview-and-edit/` in `frontend-2` are.

## Go WebSocket events

`GET /v1/assistant/thread/ws` follows the same typing rule as SSE: named
event → Go struct, payloads in `/openapi.json`. Discriminator `type`.
Huma need not host the socket. Do not add AsyncAPI. Unknown events are
logged and dropped, never parsed as `any`. Voice audio is the xAI
realtime URL, not this socket.
[Assistant HTTP](../features/assistant/api.md).

## Worker internal operations

Two operations. Same Astro engine. **Not** one union with a flag. Not on
`cmd/api`. Not public OpenAPI. **Do not create** `/v1/public/site/…`. Do
not create leftover `/preview/{token}/` HTML. Do not put these on live
GET.

Go structs are the source. Worker typegens from a **separate** OpenAPI
file (not `GET /openapi.json`). Routes, DTOs, `$ref`, and the known
omission (Worker is the HTTP server; product owner chose Go as source,
not an agent; that inversion may cause issues):
[website HTTP](../features/website/api.md).
Auth: shared secret / service binding (out of the JSON body). Binding
**name** is not this file.

- **`websiteRender`** (`POST /internal/website-render`) — website 03.
  Website image render. No R2, no WebP, no purge. Batch of website pages
  on **one Worker**. SLO:
  [03](../features/website/pipeline/03-website-copy-generation.md).
- **`websitePublication`** (`POST /internal/website-publication`) —
  website 04. Website HTML render. Writes HTML to R2 and purge as 04
  already says. No website image render to the model. SLO:
  [04](../features/website/pipeline/04-website-publication.md).

Live contractor HTML GET is Cache then R2. Never Go. The leftover token
path is gone.

## Cross-cutting routes

### GET /v1/health

- **Auth:** none
- **Callers:** Railway / local process checks
- **Response:** liveness only. No tenant.

### GET /openapi.json

- **Auth:** none (or the same gate as other unauthenticated discovery; not a
  tenant resource)
- **Callers:** `openapi-typescript` typegen for `frontend-2` (CMS
  `/v1`). Not the Worker internal OpenAPI file.
- **Response:** huma OpenAPI 3.1
