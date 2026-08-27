# Website Technical Implementation

Status: proposed implementation plan.

Related: [PRD](prd.md), [ADR](ADR.md), [website component contract](architecture.md),
[persistence](persistence.md), [manifest](manifest.md), [HTTP](api.md).

## Domain objects

See [persistence.md](persistence.md). Media assets are
[media library](../other/media/persistence.md). Business profile:
[details](../business-profile/details/persistence.md). Projects:
[projects](../business-profile/projects/persistence.md).

## Website template application

Owned by onboarding [05](../onboarding/pipeline/05-apply-website-template.md). This feature owns
the tables it writes.

1. Load the selected website template + website component contracts from the first-pass
   sidecars in `packages/website-components` (later the `catalog/` dump).
2. Validate website component ids, props, design controls, website page paths, website forms, and
   top menu / footer against the website component contract structs.
3. Keep website placeholders in the unpublished website; they resolve only at website publication.
4. Create tenant-owned `website_*` records as an unpublished website; never write a live website
   from this step.

## Website assistant (the LLM drafts; the owner decides)

- Tool calls: see [assistant.md](assistant.md) (`update_slot`, `cleanup_image`, `update_form`,
  `update_website_styles`, `update_menus`, `generate_image`, `update_details`, …). Same attach / crop / focal /
  cleanup as `/cms/media` and the website editor PATCH. `update_details` is the shared Details
  tool (one implementation; Ads generator calls it too).
- Output is a reviewable diff, validated against website component contracts before the website
  editor PATCHes (CMS) or the 06 job writes (headless).
- Every call records reasoning + output + tool calls via `ai_generations`.
- Apply / Reject is one-way; no revert-after-apply **on the unpublished website**.
  `update_details` uses the shared notification Revert (`POST /v1/business-profile/edits/{id}/undo`),
  not Reject. CMS Apply is the website editor PATCH +
  `record-apply`.
  No unpublished snapshot per edit.
  Website edit history is increments on `edit_history`; undo is in-memory, then PATCH.
  No `/undo`, `/redo`, or `/edit-history` routes.

## Website publication / renderer rules

1. Only registered website components render; props validated before save and before website
   publication.
2. Website publication creates a `website_publications` row (kept, not edited; active flag +
   website rollback chain) holding a typed `website.v1` document.
3. Contractor website pages render only the active website publication (R2 `latest/`). The
   website editor canvas renders the unpublished website. The preview website address is that
   same `latest/` tree (strip on until 08), not a per-request unpublished render.
4. Website rollback reactivates an earlier website publication; earlier published website copies are
   never overwritten.
5. Website publication emits an audit event.
6. Website publication is not a Cloudflare deploy. River asks the contractor website Worker to
   render HTML into R2 and purge; live GET is Cache then R2. Details: [cloudflare.md](cloudflare.md).

## Where things stand

- Website page: `unpublished` / `archived`.
- Website publication: `published → rolled_back/archived`.

## HTTP

Routes: [api.md](api.md). Do not re-list them here. Live HTML GET never calls Go.
Website form POST is [leads HTTP](../other/leads/api.md). Connect website address is
`POST /v1/website/addresses` (`type=custom` only). Website rollback is owner rows only.
Media library, Details, Projects, and website form submit are other features' `api.md` files.
CMS unpublished writes are editor `POST`/`PATCH` only. Reset to an owner website version is
editor GET `publication_id`, then PATCH.

Do not create `/v1/public/site/…`, leftover `/preview/{token}/`, or
`/v1/tenants/{website_prefix}/website/…`.

## Validation & testing

- Website component props validated against the website component's contract struct on save and
  website publication.
- Cross-tenant isolation for website pages / website sections / website slots / media assets /
  website forms / website publications.
- Website versions (`website_publications`) are never overwritten; website rollback
  reactivates an earlier **owner** website version. Onboarding-written rows are refused.
- Website template application rejects unknown website component ids / invalid props before writing.
- One E2E: edit → website assistant → website publication → live R2 keys + fake purge → website
  rollback → website form (LLM faked, core logic unmocked). Apply the website template is the
  onboarding E2E.

## Frontend

See [frontend.md](frontend.md) and [frontend-debloat.md](frontend-debloat.md).
`frontend-2/src/features/cms/**` is the existing website editor.
It consumes the regenerated types; `/website/editor/*` routes map to the Go side.

## Implementation order (live contractor website)

`apps/contractor-website` and `packages/website-components` are in this repo.

1. R2 `latest/` serve + Cache.
2. Website publication render into R2 + purge.
3. Custom Hostnames + Connect website address in the CMS.
4. Website preview SSR on the same app.
