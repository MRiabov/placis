# Website Decision Record

Status: decided (2026-08-16, product owner + engineering).

## Decisions

1. **The CMS is the umbrella** — marketing management has a website part and an ads part. This
   directory owns the website part; the ads part lives in `docs/features/ads/`. There is no separate
   "operations dashboard" or CRM surface.

2. **The unpublished website is the source of truth; the website manifest is the read model** —
   `website_manifest` is built at website publication only; it is never the editable source.

3. **Website component contracts are one typed struct each, dumped to JSON** — under `catalog/`,
   consumed by both the TS public-site renderer (validation) and the Go backend (save / website
   publication validation). No forked duplicate of website component schemas (kills the old TS-types
   + Python-`typed_values` duplication).

4. **Website templates are static website template catalog data, not DB rows** — trade website
   templates + website component contracts are JSON + sidecars under `catalog/`; the backend loads
   and validates them, never hand-duplicates their schemas.

5. **Website placeholders fill in at website publication** — `{{business_name}}`, `{{phone}}`,
   `{{trade}}`, … pull from the business profile when website publication runs; the unpublished
   website keeps the website placeholders rather than inventing details.

6. **The LLM drafts; the owner decides** — the website assistant drafts copy and proposes images
   via governed tool calls (`update_slot`, `generate_image`), validated against contracts, producing
   reviewable diffs — never direct unvalidated writes. `generate_image` is used only when no
   approved source fits.

7. **Website publication is kept and can be rolled back** — website publication creates a
   `website_publications` row (a published website copy); website rollback reactivates an earlier
   website publication without deleting profile history.

8. **Deferred: blog posts + careers** — no `blog_post` website page type or `website_career_*`
   tables in the first pass; re-add only when needed.

9. **Website templates come from decomposed reference sites** — website templates and patterns are
   acquired by taking inspiration from existing websites, decomposing them into website page /
   website section patterns, then switching the content and remixing the colors for a new business.
   They are not hand-authored from scratch.
