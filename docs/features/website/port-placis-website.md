# Port the contractor website

Status: planning (port process, not shipped Worker code).

How `apps/contractor-website` moves onto the Go contract. Cut list (keep / delete /
Don’t-say): [contractor-website-debloat.md](contractor-website-debloat.md).
`frontend-2` typegen: [planning/frontend-debloat.md](../../planning/frontend-debloat.md).

Product name is **contractor website**. Predecessor OpenAPI is not a compatibility
surface. No backward-compatible paths, operation ids, or `PublicSite*` types.

## Serve vs API

| Call | Talks to | Types |
| --- | --- | --- |
| Live GET | Cache then R2 `latest/`. Miss is 404. Never Go. | None. No OpenAPI. |
| Website preview | Go `GET /api/v1/public/site/resolve` ([cloudflare.md](cloudflare.md)). | `website.v1` + catalog structs ([manifest.md](manifest.md)). |
| Website form POST | Go `/api/v1/public/forms/{id}/submit` (and uploads). | Closed public form DTO. |

Do not call `GET /api/v1/preview/{token}/module/website`. Do not generate a second
full-CMS `openapi-typescript` client in this app. Preview and form types come from
`website.v1` / `catalog/` (same JSON Go writes). A public-only slice of Go
`/openapi.json` is allowed; the CMS spec is not.

## Glue

`lib/publicSiteApi.ts` (and leftover env names) retarget onto public resolve +
`website.v1` in the **same slice**. No shim that keeps `PublicSiteManifest` or
unconstrained JSON. Screens/routes with no Go public route yet stay unwired, not
typed against predecessor paths.

## Keep vs drop (API)

Keep as Go DTOs in current glossary names (fields may change): website preview
resolve, website form submit. Drop (do not alias): predecessor preview module
path, `PublicSite*` hand types, CRM/sandbox routes, unconstrained
`additionalProperties` bags.

“Genuinely good” means the **behavior** is still in the website spec. Copy Python
field lists only when [technical-implementation.md](technical-implementation.md)
already says so.

## Done when

- Live GET still never calls Go.
- Website preview uses `GET /api/v1/public/site/resolve` and `website.v1`.
- Website forms use the Go public forms route.
- No predecessor OpenAPI client, `PublicSite*` casts, or module/website path in
  this app.
