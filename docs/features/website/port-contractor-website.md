# Port the contractor website

Status: planning (port process, not shipped Worker code).

How `apps/contractor-website` moves onto the Go contract. Cut list (keep /
delete / Don’t-say): [contractor-website-debloat.md](contractor-website-debloat.md). `frontend-2` typegen:
[planning/frontend-debloat.md](../../planning/frontend-debloat.md). HTTP: [website HTTP](api.md), [leads HTTP](../other/leads/api.md).

Product name is **contractor website**. Predecessor OpenAPI is not a
compatibility surface. No backward-compatible paths, operation ids, or leftover
predecessor types.

## Serve vs API

| Call | Talks to | Types |
| --- | --- | --- |
| Live GET | Cache then R2 `latest/`. Miss is 404. Never Go. | None. No OpenAPI. |
| Website-activation checkout | Go public checkout (CORS by `Host` / `website_prefix`). Not `/v1/website-previews/{token}/…`. | Closed checkout DTO. |
| Website form POST | Go `POST /v1/website-forms/{form_id}/submissions` (and uploads). | Closed public form DTO. |
| `websiteRender` / `websitePublication` | Go → Worker internal (shared secret / service binding). | Go-owned internal OpenAPI file. Worker `openapi-typescript` on **that** file only. |

Do not call `GET /v1/preview/{token}/module/website` or
`GET /v1/public/site/resolve`. Do not generate a second
full-CMS typegen in this app. Form types come from
`website.v1` / `catalog/` (same JSON Go writes). Worker operations typegen
from the **internal** OpenAPI file, not CMS `GET /openapi.json`.

## Glue

`lib/publicSiteApi.ts` (and leftover env names) retarget onto public forms +
`website.v1` in the **same slice**. No shim that keeps `PublicSiteManifest` or
unconstrained JSON. Screens/routes with no Go public route yet stay unwired, not
typed against predecessor paths.

## Keep vs drop (API)

Keep as Go DTOs in current glossary names (fields may change): website form
submit, activation checkout. Drop (do not alias): predecessor preview module
path, leftover resolve, predecessor hand types, CRM/sandbox routes,
unconstrained `additionalProperties` bags.

“Genuinely good” means the **behavior** is still in the website spec. Copy
Python field lists only when [api.md](api.md) already says so.

## Done when

- Live GET still never calls Go.
- No `GET /v1/public/site/resolve`.
- Website forms use `POST /v1/website-forms/{form_id}/submissions`.
- No predecessor OpenAPI typegen, leftover predecessor types, or module/website
  path in this app.
- Worker typegen matches the Go-owned internal OpenAPI file (no diff).
