# Website manifest (`website.v1`)

The website manifest is the published website copy the contractor website renders. It is enough
to paint a page with no unpublished-table reads. Website placeholders are already resolved.

`manifest_version` is `website.v1` — a **contract generation**, not semver. A website publication
row is kept and never overwritten; rollback must still render that generation. Breaking change →
`website.v2`. Predecessor strings (`site_manifest.v1`, `site_page.v1`) are not the contract.
`component_version` on a website section is the website-component catalog revision, not this dump
generation.

The dump is one JSON document on `website_publications.website_manifest` because it is a
**published website copy** (typed serve document), not because the tree is polymorphic. Write a
Go struct, reject extra keys, store that JSON. `props` and `design` inside it stay jsonb-shaped:
they vary by `component_id`. Do not duplicate unpublished tables keyed by `publication_id`.

Field list inspired by the predecessor CMS manifest, closed for this rewrite.

## Keep

Root:

- `manifest_version` (`website.v1`)
- `title` (website title / display name)
- `website_styles` (preset id + bounded overrides: `primary`, `neutral`, `accent`, `radius`,
  `density` — see [styles.md](styles.md))
- website-level SEO fallback: `seo_title`, `seo_description`, `seo_og_title`, `seo_og_description`,
  `seo_canonical_url`, `seo_noindex`, `seo_primary_keyword`
- `pages[]`
- `top_menu[]` — resolved tree: `id`, `kind`, `label`, `path` or `href`, `children` (depth 2).
  Page nodes bake path/title from `website_pages`. Do not leave unpublished `page_id` in the
  dump.
- `footer[]` (same shape)
- `show_phone`, `show_email` (bar CTA visibility; values already resolved from
  `{{marketing_phone}}` / `{{marketing_email}}`)
- `website_forms[]` (`form_key`, `title`, `fields[]`, `privacy_notice`)
- slim `projects[]` (`id`, `title`, `description`, cover URL + media caption) — baked at website
  publication. Same staleness as Details. Not a live query of `/cms/projects`.
- slim selected `certifications[]` (`id`, `name`, `short_label`, badge URL)

Per website page:

- `path`, `title`, `page_type` (`home` / `service` / `contact` / `legal`)
- page SEO columns (same set as root fallback)
- `sections[]` only

Per website section:

- `component_id`, `component_version`
- `props` (resolved values, public media-library URLs, selected review author/rating/body already copied in)
- `design` (design-control values)

## Keep out

- a tenant website-address column or path aliases (the website address is the resolve key)
- dual `components` and `sections` at root or page — one list: `sections`
- root-level `sections` used as a single-page fallback
- blog / careers collections (deferred)
- predecessor project-as-blog collection (body, markdown, status, visibility)
- template keys, `created_by`, how the unpublished website was applied
- unpublished-only fields: `origin`, slot `status`, `validation_errors`, `has_unpublished_changes`
- Clerk / tenant internals, file ids, signed-URL machinery (resolved public URLs only)
- top menu / footer stuffed into each page’s `sections` — they come from root `top_menu` /
  `footer` (baked from `website.menus`), not from website sections on every website page

Reviews: bake the selected review into the website section `props` at publication
(`website_slot_reviews`). Do not dump the whole profile review list.

Changing Details, Projects, certifications and reviews, website styles, or the unpublished
website updates the website editor immediately and does **not** change the live website until the
next website publication.
