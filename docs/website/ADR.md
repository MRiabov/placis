# Website CMS Decision Record

Status: decided (2026-08-16, product owner + engineering).

## Decisions

1. **The CMS is the umbrella** — marketing management has a website part and an ads part. This
   directory owns the website part; the ads part lives in `docs/ads/`. There is no separate
   "operations dashboard" or CRM surface.

2. **CMS records are the source of truth; the manifest is the read model** — `site_manifest` is
   built at publish time only; it is never the editable source.

3. **Component contracts are one JSON Schema each** — under `catalog/`, consumed by both the TS
   public-site renderer (validation) and the Go backend (save/publish validation). No forked
   duplicate of component schemas (kills the old TS-types + Python-`typed_values` duplication).

4. **Blueprints are static catalog data, not DB rows** — trade blueprints + component contracts are
   versioned JSON + sidecars under `catalog/`; the backend loads and validates them, never
   hand-duplicates their schemas.

5. **Template placeholders fill in at publish** — `{{business_name}}`, `{{phone}}`, `{{trade}}`,
   … pull from the business profile when the site goes live; drafts keep the placeholders rather
   than inventing details.

6. **AI is propose-only** — refinement drafts copy and proposes images via governed tool calls
   (`update_slot`, `generate_image`), validated against contracts, producing reviewable diffs —
   never direct unvalidated writes. `generate_image` is used only when no approved source fits.

7. **Publish is kept and can be rolled back** — publishing creates a `website_publications` row (a
   publication); rollback reactivates an earlier publication without touching history.

8. **Deferred: blog posts + careers** — no `blog_post` page type or `website_career_*` tables in the
   first pass; re-add only when needed.
