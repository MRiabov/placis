# Website CMS

> The **CMS is the umbrella** for marketing management, with a website part and an ads part. This
> doc covers the **website part** — the editable content model behind the public site. The ads
> part lives in [ads.md](ads.md) and [`ads/ad-generation/`](ads/ad-generation/ADR.md).

The website part is the editable content model. A serialized `site_manifest` is only the validated
read model materialized at publish time — it is never the source of truth.

## Blueprints and component contracts

- **Blueprints** (trade templates) and **component contracts** are static, versioned catalog data
  under `catalog/`, not database rows. One JSON Schema per component is consumed by both the
  TypeScript public-site renderer and the Go backend.
- **Blueprint application** validates component IDs, props, design controls, page paths, forms, and
  navigation before creating tenant-owned `website_*` records.
- **Fact variables** (`{{business_name}}`, `{{phone}}`, `{{trade}}`, …) resolve from the business
  profile at publication; drafts preserve tokens + provenance rather than inventing copy.

## Entities

- **pages** + immutable versions — `path`, `title`, `page_type` (`standard`/`service`/`landing`/
  `legal`), SEO, publish state.
- **sections** — `component_id` (design family/variant, e.g. `public.hero.image`), position, props,
  design controls, status.
- **content slots** — text/rich-text/image/link/list/json values with review status.
- **assets / media library** — images, logos, documents, generated images, with provenance, focal
  point, crop, and review status.
- **forms** — contact forms with `submit_action=create_lead`.
- **navigation** — primary/footer/campaign items.
- **projects** — portfolio content (`website_projects`).
- **certification selections** — `website_certification_selections`.
- **publications** — immutable snapshots, active flag, rollback chain, validation report.

## LLM refinement

LLM refinement is **propose-only**: it drafts copy and proposes image gallery selections via
governed tool calls (`update_slot`, `generate_image`), validated against component contracts, and
produces reviewable diffs — never direct unvalidated writes. `generate_image` is used only when no
approved source fits; otherwise a media/slot mapping layer maps approved media to slots.

## Publish / renderer rules

1. Only registered components render; props are validated against the component schema before save
   and before publish.
2. Publishing materializes an immutable `website_publications` row (active flag, rollback chain).
3. Public pages render only the active publication; preview routes (authenticated) render draft
   versions by id.
4. Rollback restores/reactivates an earlier snapshot without mutating history.
5. Publishing emits an audit event.

## State machines

- Page: `draft → approved → published`.
- Publication: `published → rolled_back/archived`.
