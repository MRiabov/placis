# Website Technical Implementation

Status: proposed implementation plan.

Related: [PRD](prd.md), [ADR](ADR.md), [website component contract](architecture.md),
[persistence](persistence.md), [manifest](manifest.md), [HTTP](api.md).

## Domain objects

See [persistence.md](persistence.md). Media assets are
[media library](../other/media/persistence.md).

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
  `update_website_styles`, `update_menus`, `generate_image`, …). Same attach / crop / focal /
  cleanup as `/cms/media` and the website editor PATCH.
- Output is a reviewable diff, validated against website component contracts before the website
  editor PATCHes (CMS) or the 06 job writes (headless).
- Every call records reasoning + output + tool calls via `ai_generations`.
- Apply / Reject is one-way; no revert-after-apply. CMS Apply is the website editor PATCH +
  `record-apply`.
  No unpublished snapshot per edit.
  Website edit history is increments on `edit_history`; undo is in-memory, then PATCH.
  No `/undo`, `/redo`, or `/edit-history` routes.

## Website publication / renderer rules

1. Only registered website components render; props validated before save and before website
   publication.
2. Website publication creates a `website_publications` row (kept, not edited; active flag +
   website rollback chain) holding a typed `website.v1` document.
3. Contractor website pages render only the active website publication; a website preview renders the
   unpublished website.
4. Website rollback reactivates an earlier website publication; earlier published website copies are
   never overwritten.
5. Website publication emits an audit event.
6. Website publication is not a Cloudflare deploy. River asks the contractor website Worker to
   render HTML into R2 and purge; live GET is Cache then R2. Details: [cloudflare.md](cloudflare.md).

## Where things stand

- Website page: `unpublished` / `archived`.
- Website publication: `published → rolled_back/archived`.

## HTTP

- `/api/v1/website/editor/...` — website pages, website sections, website slots, media assets,
  projects, website publications, website settings, certifications, website forms, top menu,
  footer. Same GET/PATCH page fold: optional `include_edit_history`, `base_edit_history_head`
  on PATCH/Apply. No extra undo/redo/history routes.
- `/api/v1/website/publications/...` — website publication and website rollback (if not under editor).
- `/api/v1/public/forms/...` — website form submit (the public write). Host lookup uses
  [website_addresses](persistence.md). Live GET does not call Go; it reads R2. Drop leftover
  resolve. Connect-website-address APIs live under the website editor.

Do not use `/api/v1/tenants/{website_prefix}/website/...` for the CMS.

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
