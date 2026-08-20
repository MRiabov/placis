# Website Decision Record

Status: decided (2026-08-16, product owner + engineering).

## Decisions

1. **The CMS is the umbrella** — marketing management has a website part and an ads part. This
   directory owns the website part; the ads part lives in `docs/features/ads/`. There is no separate
   "operations dashboard" or CRM surface.

2. **The unpublished website is the source of truth; the website manifest is the read model** —
   `website_manifest` is built at website publication only; it is never the editable source.

3. **Website component contracts are one typed struct each, dumped to JSON** — under `catalog/`,
   consumed by both the TypeScript renderer for the contractor website (validation) and the Go backend (save / website
   publication validation). No forked duplicate of website component schemas (kills the old TS-types
   + Python-`typed_values` duplication).

4. **Website templates are static website template catalog data, not DB rows** — trade website
   templates + website component contracts are JSON + sidecars under `catalog/`; the backend loads
   and validates them, never hand-duplicates their schemas.

5. **Website placeholders fill in at website publication** — `{{business_name}}`, `{{marketing_phone}}`,
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

10. **First-pass page types are `home` / `service` / `contact` / `legal`** — no `standard`, no
    `landing` (ads do not send people to the website for now). Blog and careers stay deferred.
    (2026-08-20)

11. **Website page status is `unpublished` / `archived`** — publication is website-level
    (`website_publications`). There is no page-level `approved` or `published`. (2026-08-20)

12. **No unpublished revision stack** — edits upsert unpublished rows. Revert restores the last
    website assistant batch from recorded before/after. Website versions are
    `website_publications` only. Do not bring back predecessor per-page version snapshots.
    (2026-08-20)

13. **Website styles live on `website_settings`** — one row per tenant, copied into the website
    manifest at website publication. Not per website page. (2026-08-20)

14. **Live website is the published website copy** — Details, Projects, certifications and reviews, and
    website styles update the website editor immediately and need website publication to change what
    website visitors see. (2026-08-20)

15. **Import the contractor website as `apps/contractor-website`** — never the predecessor package
    name. Website publication is not a Cloudflare deploy; edge (SSR vs R2, cache purge, TLS) is later.
    (2026-08-20)

16. **Certifications and reviews are one Profile screen** — `/cms/certifications-and-reviews`.
    Global `website_certification_definitions`; tenant selections. Reviews stay
    `business_profile_reviews`. No `/cms/proof`. (2026-08-20)

17. **`generate_image` may attach pending-review on the unpublished canvas** — always a warning;
    owner approval makes it approved; website publication still requires approved media assets.
    (2026-08-20)
