# Website CMS Technical Implementation

Status: proposed implementation plan.

Related: [PRD](prd.md), [ADR](ADR.md), [component contract](../../architecture.md),
[data model](data-model.md).

## Domain objects

See [data-model.md](data-model.md). Media assets are
[media/data-model.md](../other/media/data-model.md).

## Blueprint application

1. Load the selected blueprint + component contracts from `catalog/`.
2. Validate component ids, props, design controls, page paths, forms, and navigation against the
   component contract structs.
3. Resolve template placeholders from the live business profile (placeholders kept in drafts).
4. Create tenant-owned `website_*` records as a draft; never write published state from generation.

## LLM refinement (propose-only)

- Tool calls: `update_slot` (copy), `generate_image` (only when no approved source fits).
- Output is a reviewable diff, validated against component contracts before apply.
- Every call records reasoning + output + tool calls via `ai_generations`.

## Publish / renderer rules

1. Only registered components render; props validated before save and before publish.
2. Publish creates a `website_publications` row (kept, not edited; active flag + rollback chain).
3. Public pages render only the active publication; authenticated preview renders draft versions.
4. Rollback reactivates an earlier version; history is never touched.
5. Publish emits an audit event.

## State machines

- Page: `draft → approved → published`.
- Publication: `published → rolled_back/archived`.

## API surface

- `/api/v1/website/editor/...` — pages, sections, slots, assets, projects, publications,
  business-profile, certifications.
- `/api/v1/tenants/{slug}/website/...` — blueprints, pages, forms, publications, certifications.
- `/api/v1/public/site/...` — resolve, meta, sitemap, assets (the public read model).

## Validation & testing

- Component props validated against the component's contract struct on save and publish.
- Cross-tenant isolation for pages/sections/slots/assets/forms/publications.
- Immutability: versions/publications are never mutated; rollback reactivates.
- Blueprint application rejects unknown component ids / invalid props before writing.
- One E2E: generate → edit → refine → publish → resolve manifest (providers mocked, core logic
  unmocked).

## Frontend

- `frontend-2/src/features/cms/**` is the existing editor (pages, sections, slots, assets, media,
  inspector). It consumes the regenerated types; `/website/editor/*` routes map to the Go side.
