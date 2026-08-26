# Port the contractor website

Status: planning (port process, not shipped Worker code).

How `apps/contractor-website` moves onto the Go contract. Cut list (keep / delete /
Don’t-say): [contractor-website-debloat.md](contractor-website-debloat.md).
`frontend-2` typegen: [planning/frontend-debloat.md](../../planning/frontend-debloat.md).
HTTP: [website HTTP](api.md), [leads HTTP](../other/leads/api.md).

Product name is **contractor website**. Predecessor OpenAPI is not a compatibility
surface. No backward-compatible paths, operation ids. Don't say: `PublicSite*` types.

## Serve vs API

| Call | Talks to | Types |
| --- | --- | --- |
| Live GET | Cache then R2 `latest/`. Miss is 404. Never Go. | None. No OpenAPI. |
| Website preview | Worker internal render (shared secret / service binding). Not public OpenAPI. | Unpublished website + catalog structs ([manifest.md](manifest.md)). |
| Website form POST | Go `POST /v1/website-forms/{form_id}/submissions` (and uploads). | Closed website-form fields. |

Do not call `GET /api/v1/preview/{token}/module/website`. Don't say: do not create
`/v1/public/site/…`. Do not generate a second full-CMS `openapi-typescript` helper
in this app. Live HTML does not use `website.v1` over HTTP.

## Glue

Don't say public site: `lib/publicSiteApi.ts` retargets onto internal
render + website form POST in the **same slice**. No shim that keeps
`PublicSiteManifest` or unconstrained JSON. Screens/routes with no Go route yet
stay unwired, not typed against predecessor paths.

## Keep vs drop (API)

Keep: website form submit (+ uploads). Drop (do not alias): predecessor preview
Don't say: module path, `GET /v1/public/site/resolve`, `PublicSite*` hand types, CRM/sandbox
routes, unconstrained `additionalProperties` bags.

“Genuinely good” means the **behavior** is still in the website spec. Copy Python
field lists only when [api.md](api.md) already says so.

## Done when

- Live GET still never calls Go.
- Website preview uses Worker internal render (tests hit `/preview/{token}/`).
- Website forms use `/v1/website-forms/{form_id}/submissions`.
- No predecessor OpenAPI helper. Don't say: `PublicSite*` casts, module/website path, or
  `public/site/resolve` in this app.
