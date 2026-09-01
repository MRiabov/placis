# Website Technical Implementation

Status: proposed implementation plan.

Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).
Services: `SelectWebsiteTemplate`, `CopyWebsiteTemplatePages`,
`GenerateWebsiteCopy` (River job kind `website_copy_generation`),
`PublishWebsite` (**calls** `websitePublication`). Tables:
[persistence.md](persistence.md). DTOs and Routes: [api.md](api.md).

Related: [PRD](prd.md), [ADR](ADR.md), [website component contract](architecture.md), [persistence](persistence.md), [manifest](manifest.md),
[HTTP](api.md).

## Domain objects

See [persistence.md](persistence.md). Media assets are
[media library](../other/media/persistence.md). Business profile:
[details](../business-profile/details/persistence.md). Projects:
[projects](../business-profile/projects/persistence.md).

## Select and copy the website template

Owned by website [01](pipeline/01-select-website-template.md) then
[02](pipeline/02-copy-website-template-pages.md). Onboarding
[05](../onboarding/pipeline/05-select-and-copy-website-template.md)
enqueues. This feature owns the tables 02 writes.

1. `SelectWebsiteTemplate` then `CopyWebsiteTemplatePages` **load** the
   selected website template + website component contracts from the
   `go:embed` dump under `catalog/` ([catalog.md](catalog.md)). Do not load
   `packages/website-components/src/blueprints/` as the catalog.
2. Validate website component ids, props, design controls, website page paths,
   and website forms against the website component contract structs. Derive
   top menu / footer from the [menu constant](catalog.md#menu-constant); do
   not copy a catalog menu JSON.
3. Keep website placeholders in the unpublished website;
   `websitePublication` is a website HTML render; `websiteRender` is a
   website image render for 03. Go does not fill tokens.
4. Create tenant-owned `website_*` records as an unpublished website; never
   write a live website from this step.

## Assistant (the LLM drafts; the owner decides)

- Tool calls: see [assistant.md](assistant.md) (`update_slot`, `cleanup_image`, `update_form`,
  `update_website_styles`, `update_menus`, `generate_image`, `update_details`,
  …). Same attach / crop / focal / cleanup as `/cms/media` and the website
  editor PATCH. `update_details` is the shared Details tool (one implementation;
  Ads generator calls it too).
- Output is a reviewable diff, validated against website component contracts
  before the website editor PATCHes (CMS) or the 06 job writes (headless).
- Every call records reasoning + output + tool calls via `ai_generations` (CMS
  assistant calls on the `cms_assistant` thread; onboarding 06 on a
  `website_copy_generation` thread).
- Apply / Reject is one-way; no revert-after-apply
  **on the unpublished website**. `update_details` uses the shared notification
  Revert (`POST /v1/business-profile/edits/{id}/undo`), not Reject. CMS Apply is
  the website editor PATCH + `record-apply`. No unpublished snapshot per edit.
  Website edit history is increments on `edit_history`; undo is in-memory, then
  PATCH. No `/undo`, `/redo`, or `/edit-history` routes.

## Website publication / renderer rules

1. Only registered website components render; props validated before save and
   before website publication.
2. Website publication creates a `website_publications` row (kept, not edited;
   active flag + website rollback chain) holding a **tokenized** `website.v1`
   document. `websitePublication` resolves placeholders into HTML.
3. Contractor website pages render only the active website publication (R2
   `latest/`). The website editor canvas renders the unpublished website. The
   preview website address is that same `latest/` tree (strip on until 09), not
   a per-request unpublished render for website visitors. `websiteRender` is
   not this serve path.
4. Website rollback reactivates an earlier website publication; earlier
   published website copies are never overwritten.
5. Website publication emits an audit event.
6. Website publication is not a Cloudflare deploy. River `POST`s
   `websitePublication`; the Worker writes HTML into R2 and purge; live GET
   is Cache then R2.
   Details: [cloudflare.md](cloudflare.md).
7. Website publication and live website rollback require an active
   subscription. Otherwise **402** `subscription_canceled`
   ([billing](../billing/architecture.md)).

## Where things stand

- Website page: `unpublished` / `archived`.
- Website publication: `published → rolled_back/archived`.

## HTTP

Routes: [api.md](api.md). Do not re-list them here. Live HTML GET never calls Go.
Website form POST is [leads HTTP](../other/leads/api.md). Connect website address is
`POST /v1/website/addresses` (`type=custom` only). Website rollback is owner
rows only. Media library, Details, Projects, and website form submit are other
features' `api.md` files. CMS unpublished writes are editor `POST`/`PATCH` only.
Reset to an owner website version is editor GET `publication_id`, then PATCH.

Do not create `/v1/public/site/…`, leftover `/preview/{token}/`, or
`/v1/tenants/{website_prefix}/website/…`.

## Validation & testing

- Website component props validated against the website component's contract
  struct on save and website publication.
- Cross-tenant isolation for website pages / website sections / website slots /
  media assets / website forms / website publications.
- Website versions (`website_publications`) are never overwritten; website
  rollback reactivates an earlier **owner** website version. Onboarding-written
  rows are refused.
- Website template application rejects unknown website component ids / invalid
  props before writing.
- One E2E: edit → assistant → website publication → live R2 keys + fake purge →
  website rollback → website form (LLM faked, core logic unmocked). Apply the
  website template is the onboarding E2E.

## Frontend

See [frontend.md](frontend.md) and [frontend-debloat.md](frontend-debloat.md). `frontend-2/src/features/cms/**` is
the existing website editor. It consumes the regenerated types;
`/website/editor/*` routes map to the Go side.

## Implementation order (live contractor website)

`apps/contractor-website` and `packages/website-components` are in this repo.

1. R2 `latest/` serve + Cache.
2. Website publication render into R2 + purge.
3. Custom Hostnames + Connect website address in the CMS.
4. Website preview SSR on the same app.
