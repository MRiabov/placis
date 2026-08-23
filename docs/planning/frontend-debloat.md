# `frontend-2` port — index

Status: planning. This file is the **index** for the `frontend-2` port: shared rules and
PR order. It is not the audit source of truth. Screen and field authority stays in each
feature’s `frontend.md`. Cut lists stay in that feature’s `frontend-debloat.md`.

Debloat, not rewrite. Stack stays Vite + React + TanStack Router/Query + `openapi-fetch`.
The Go rewrite already changes the API, so the frontend switches to that smaller,
field-constrained huma contract instead of wrapping the predecessor OpenAPI.

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
| [contractor website](../features/website/contractor-website-debloat.md) | Keep the website component catalog; write a thin Worker (not a `frontend-2`-style reuse) |

No leads instruction file: website forms persist website leads; there is no CMS leads
console.

## Shared contract rules

- Regenerate `frontend-2/src/generated/api-types.ts` from Go `/openapi.json`. Every DTO
  field is constrained (`minLength`/`maxLength`, `minimum`/`maximum`, enums). No
  unconstrained JSON blobs in UI code.
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
- Voice is a later milestone. First-pass onboarding is the **text** client interview.
- Enable `cmd/ci/check-dont-say --frontend` and drop the `frontend-2/` pre-commit
  exclude when the first frontend-from-Go PR lands.

## Port order (later code PRs)

Each slice is its own worktree + PR. Drive it from that feature’s instruction file.
Done = regenerated types for routes this feature calls + Don’t-say clean on touched
files + one E2E per epic (docs-only PRs excepted).

1. **This docs set** (instruction files + pointers).
2. **Contract scaffolding** — types from Go `/health` + `/me`; stop generating unused
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
visuals. Remaining contractor-website cuts (CSS split, typed website component catalog, Don’t-say):
[contractor-website-debloat.md](../features/website/contractor-website-debloat.md).
