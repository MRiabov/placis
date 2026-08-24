# `frontend-2` port — index

Status: planning. This file is the **index** for the `frontend-2` port: shared rules and
PR order. It is not the audit source of truth. Screen and field authority stays in each
feature’s `frontend.md`. Cut lists stay in that feature’s `frontend-debloat.md`.

Debloat, not rewrite. Stack stays Vite + React + TanStack Router/Query + `openapi-fetch`.
The Go rewrite already changes the API, so the frontend switches to that smaller,
field-constrained huma contract instead of wrapping the predecessor OpenAPI.
Predecessor OpenAPI is not a compatibility surface: no old paths, operation ids,
or unconstrained JSON. Contractor website API cutover:
[port-contractor-website.md](../features/website/port-contractor-website.md).

## Instruction files

| File | Owns |
| --- | --- |
| [onboarding](../features/onboarding/frontend-debloat.md) | Find → Review → client interview → progress; website preview + website activation |
| [website](../features/website/frontend-debloat.md) | Website editor, publication dropdown, Connect website address, projects, certifications |
| [details](../features/other/details/frontend-debloat.md) | Profile disclosure, Business details, CMS left nav |
| [ads](../features/ads/ad-generation/frontend-debloat.md) | `/cms/ads` (no UI today; do not port campaign leftovers) |
| [media library](../features/other/media/frontend-debloat.md) | Media library workspace item + `/cms/media` |
| [auth](../features/other/auth/frontend-debloat.md) | Clerk gate, one Clerk organization provision, `/me` |
| [cross-cutting](../general-architecture/frontend-debloat.md) | Generated types, leftover layout names, CSS dump, parity e2e, Don’t-say `--frontend` |
| [contractor website port](../features/website/port-contractor-website.md) | Worker API cutover: public resolve + `website.v1`; no predecessor OpenAPI |
| [contractor website cuts](../features/website/contractor-website-debloat.md) | Keep the website component catalog; write a thin Worker (not a `frontend-2`-style reuse) |

No leads instruction file: website forms persist website leads; there is no CMS leads
console.

## Shared contract rules

- Go `/openapi.json` is the only typegen source for `frontend-2`. First
  frontend-from-Go PR switches typegen; the generated file shrinks to routes Go
  actually serves. Predecessor OpenAPI is human reference, not an input, not a
  second schema to generate from.
- Keep as Go DTOs in current glossary names (fields may change): `/me`, health,
  onboarding session + profile + events stream (SSE outside huma), website editor
  GET/PATCH, publication, Connect website address, website preview resolve,
  website activation / checkout / status, media library, ads when that slice
  exists. Contractor website public routes: website preview resolve, website
  form submit (see [port-contractor-website.md](../features/website/port-contractor-website.md)).
- Drop (do not alias): CRM / quotes / invoices / jobs / crew / workflows,
  `/api/v1/tenants/{website_address}/website/…`, blog, careers,
  website-template-apply leftovers, unconstrained JSON in UI-facing schemas,
  predecessor names (`setup-sessions`, public-site, shell, blueprint, claim),
  predecessor preview module path (`/api/v1/preview/{token}/module/website`)
  and `PublicSite*` hand types. “Genuinely good” means the **behavior** is still
  in the feature spec. Copy Python field lists only when that feature’s
  `technical-implementation.md` already says so.
- Unported `api/*.ts` and MSW stubs are deleted or retargeted in the **same
  slice** that adds the Go routes. No shims, no `as any`, no mapping layer.
  Screens with no Go route yet stay unwired, not typed against old paths.
- Regenerate `frontend-2/src/generated/api-types.ts` from Go `/openapi.json`. Every DTO
  field is constrained (`minLength`/`maxLength`, `minimum`/`maximum`, enums). No
  unconstrained JSON blobs in UI code. The generated file must not reintroduce
  predecessor-only paths.
- CMS calls `/api/v1/website/editor/…` only. Do not call
  `/api/v1/tenants/{website_address}/website/…`.
- Onboarding calls `/api/v1/onboarding-sessions…` and
  `GET …/onboarding-sessions/{id}/events/stream` (SSE, raw `net/http`, outside huma).
  Restore is `GET …/profile`.
- Website preview route is `/preview/{token}/…`. It is not an SSE endpoint. Website
  activation uses activate / activation-checkout / activation-status (not a browser
  success URL alone).
- Website editor: one in-memory projection; PATCH copies dirty keys; merge only
  `{ edit_history_head, batch_id }`; no GET-after-PATCH; text copies out on click-off;
  500ms coalesce; leave guard. See [editing.md](../features/website/editing.md).
- Ads (when they exist): explicit mutations + `base_updated_at` / `409` re-GET;
  `POST …/ad-set` and download. Not the website autosave loop.
- Voice is a channel now ([voice agent](../general-architecture/voice-agent.md)); `frontend-2` defaults to voice during onboarding. Text remains available.
- Enable `cmd/ci/check-dont-say --frontend` and drop the `frontend-2/` pre-commit
  exclude when the first frontend-from-Go PR lands.

## Port order (later code PRs)

Each slice is its own worktree + PR. Drive it from that feature’s instruction file.
Done = regenerated types for routes this feature calls + Don’t-say clean on touched
files + one E2E per epic (docs-only PRs excepted).

1. **This docs set** (instruction files + pointers).
2. **Contract scaffolding** — switch typegen to Go `/health` + `/me`; stop generating unused
   predecessor paths. Cross-cutting file.
3. **Onboarding** — rename the predecessor onboarding folder; drop voice; text
   client interview + SSE progress.
4. **CMS layout + details** — Profile disclosure; drop `/cms/proof`; leftover layout
   names; Business details without a Save control.
5. **Website editor** — PATCH working copy; publication dropdown; Connect website
   address; drop blog / careers / website-template-apply leftovers in the CMS API module;
   `/cms/media` + real projects / certifications with the website Go phase.
6. **Ads** — new module when `/api/v1/ads` exists.
7. **Drop parity e2e** when the old `frontend/` app is gone. Product e2e uses a fresh
   port (do not `reuseExistingServer` against 5173/5174). No Clerk testing-token CI
   unless asked.

## Out of scope

Voice WebSocket, ad posting, blog, careers, renaming Sites, rebuilding the website component
visuals. Contractor website API: [port-contractor-website.md](../features/website/port-contractor-website.md).
Remaining cuts (CSS split, typed catalog, Don’t-say):
[contractor-website-debloat.md](../features/website/contractor-website-debloat.md).
