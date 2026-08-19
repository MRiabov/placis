# Website Technical Implementation

Status: proposed implementation plan.

Related: [PRD](prd.md), [ADR](ADR.md), [website component contract](../../architecture.md),
[data model](data-model.md).

## Domain objects

See [data-model.md](data-model.md). Media assets are
[media/data-model.md](../other/media/data-model.md).

## Website template application

1. Load the selected website template + website component contracts from `catalog/`.
2. Validate website component ids, props, design controls, website page paths, website forms, and
   header/footer against the website component contract structs.
3. Resolve website placeholders from the live business profile (website placeholders kept in the
   unpublished website).
4. Create tenant-owned `website_*` records as an unpublished website; never write a live website
   from generation.

## Website assistant (the LLM drafts; the owner decides)

- Tool calls: `update_slot` (copy), `generate_image` (only when no approved source fits).
- Output is a reviewable diff, validated against website component contracts before apply.
- Every call records reasoning + output + tool calls via `ai_generations`.

## Website publication / renderer rules

1. Only registered website components render; props validated before save and before website
   publication.
2. Website publication creates a `website_publications` row (kept, not edited; active flag +
   website rollback chain).
3. Public website pages render only the active website publication; a website preview renders the
   unpublished website.
4. Website rollback reactivates an earlier website publication; earlier published website copies are
   never overwritten.
5. Website publication emits an audit event.

## Where things stand

- Website page: `unpublished → approved → published`.
- Website publication: `published → rolled_back/archived`.

## API surface

- `/api/v1/website/editor/...` — website pages, website sections, website slots, media assets,
  projects, website publications, business-profile, certifications.
- `/api/v1/tenants/{slug}/website/...` — website templates, website pages, website forms, website
  publications, certifications. `{slug}` is the website address.
- `/api/v1/public/site/...` — resolve, meta, sitemap, media assets (the public read model).

## Validation & testing

- Website component props validated against the website component's contract struct on save and
  website publication.
- Cross-tenant isolation for website pages / website sections / website slots / media assets /
  website forms / website publications.
- Website page versions and website publications are never overwritten; website rollback
  reactivates.
- Website template application rejects unknown website component ids / invalid props before writing.
- One E2E: generate → edit → website assistant → website publication → resolve website manifest
  (providers mocked, core logic unmocked).

## Frontend

- `frontend-2/src/features/cms/**` is the existing website editor (website pages, website sections,
  website slots, media assets, media library, inspector). It consumes the regenerated types;
  `/website/editor/*` routes map to the Go side.
