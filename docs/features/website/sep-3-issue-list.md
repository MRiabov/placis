# Sep 3 issue list — Website

Punch list from the 2026-09-03 unused-spec audit. Not canonical. Line
numbers are as of that audit. Fix the cited spec, then delete the item.
Delete this file when empty.

## High

1. **`website_publication_issues` has no writer that can populate it**
   Issue: persistence. Action: drop the table.
   Where:

   - [persistence.md](persistence.md) line 176 (`### website_publication_issues`)
   - [api.md](api.md) line 125 (`POST /v1/website/publications` writes it)
   - [pipeline/04-website-publication.md](pipeline/04-website-publication.md)
     line 92
   - [pipeline/testing/04-website-publication.md](pipeline/testing/04-website-publication.md)
     line 60 (pre-write blockers are **not** this table)

   Pre-publish blockers are `blockers[]` on the editor GET. The Worker
   publication response is empty, so nothing can report post-publication
   issues. No route returns the rows.

2. **`publication_id` on the four editor GETs**
   Issue: API. Action: drop the query param and the reset-to-version flow.
   Where:

   - [api.md](api.md) lines 50, 99, 101, 103, 105
   - [editing.md](editing.md) lines 106–127
   - [frontend.md](frontend.md) lines 164–166 (explicitly **not** a Website
     versions control)
   - [architecture.md](architecture.md) line 196

3. **`GET /v1/website/editor/settings` and `GET /v1/website/editor/menus`**
   Issue: API. Action: drop both GETs; keep the PATCHes.
   Where:

   - [api.md](api.md) lines 103, 105
   - [editing.md](editing.md) line 106 (page GET is the only hydrate)

   `WebsitePageRead` already embeds `website_styles` and `menus`
   ([api.md](api.md) line 52).

4. **`slot_type=json`**
   Issue: persistence. Action: drop the enum value.
   Where:

   - [persistence.md](persistence.md) lines 83–84
   - [api.md](api.md) line 29 (do not expose it)
   - [api.md](api.md) line 101 (Must-not)

5. **`website_slots.status` values nothing writes**
   Issue: persistence + DTO. Action: drop the field (or keep only
   `unpublished` if a constant is required — better to drop).
   Where:

   - [persistence.md](persistence.md) lines 81, 84–85
     (`unpublished` / `reviewed` / `approved` / `rejected`)

   Publication is website-level. Nothing produces `reviewed` /
   `approved` / `rejected`.

6. **`submit_action` is a one-value writable enum**
   Issue: DTO + persistence. Action: drop from DTOs and the tool.
   Where:

   - [persistence.md](persistence.md) lines 95–97
   - [api.md](api.md) line 57
   - [editing.md](editing.md) line 164
   - [assistant.md](assistant.md) line 95
   - [frontend.md](frontend.md) line 102

   Only legal value is `create_website_lead`.

7. **Website form field types leads cannot store**
   Issue: persistence + functionality. Action: cut `field_type` to
   `text` / `textarea` / `email` / `marketing_phone`; drop
   `website_form_field_options`.
   Where:

   - [persistence.md](persistence.md) lines 107–108 (`address` / `select` /
     `date` / `checkbox`)
   - [persistence.md](persistence.md) lines 114–119 (`website_form_field_options`)
   - Leads only store name, marketing phone, email, message:
     [../other/leads/persistence.md](../other/leads/persistence.md) lines 7–9

8. **Two R2 models: per-host trees vs one shared `latest/`**
   Issue: functionality. Action: one tree; publish purges every active
   hostname. Then `website_publications.website_address_id` is
   unnecessary.
   Where:

   - [cloudflare.md](cloudflare.md) line 35 (one `latest/` tree)
   - [cloudflare.md](cloudflare.md) lines 107, 153–154, 162, 198 (per-host
     trees)

   `WebsitePublicationRequest` has no hostname, so the Worker cannot
   write a per-host tree.

9. **Manifest root-level SEO has no source**
   Issue: DTO / persistence. Action: drop root SEO from `website.v1`;
   keep per-page SEO.
   Where:

   - [manifest.md](manifest.md) (Keep → root SEO fallback fields)
   - SEO columns exist on `website_pages`
     ([persistence.md](persistence.md) line 54), not on
     `website_settings` (lines 151–158)

10. **`seo_primary_keyword`**
    Issue: DTO + persistence. Action: drop everywhere.
    Where:

    - [persistence.md](persistence.md) line 54
    - [api.md](api.md) lines 52–54
    - [manifest.md](manifest.md) line 33
    - [editing.md](editing.md) line 92
    - [assistant.md](assistant.md) lines 81, 179

    Not a meta tag. No renderer or screen reads it.

11. **URL menu nodes / `website_urls` — 02 branch never fires**
    Issue: persistence + API. Action: delete the 02 branch now; consider
    dropping `menu_node_kind=url`, the table, and both `/urls` routes.
    Where:

    - [pipeline/02-copy-website-template-pages.md](pipeline/02-copy-website-template-pages.md)
      lines 83, 114
    - [pipeline/testing/02-copy-website-template-pages.md](pipeline/testing/02-copy-website-template-pages.md)
      line 44
    - [persistence.md](persistence.md) lines 142, 214
    - [api.md](api.md) lines 107–108

    Catalog menus are `page` and `text` only, so the `url` persist
    condition is always false.

12. **Publish blockers: site-wide in UI, per-page on HTTP**
    Issue: contradiction. Action: site-wide blockers on a read, or drop
    the pre-flight list and surface POST failure.
    Where:

    - [frontend.md](frontend.md) (Publish blocked while required slots
      cannot resolve)
    - [api.md](api.md) line 52 (`blockers[]` only on `WebsitePageRead`)

13. **`{{existing_site_url}}` as a website variable**
    Issue: functionality. Action: remove from Common variables.
    Where:

    - [variables.md](variables.md) line 51

    That is the contractor's **old** site (ETL crawl input). Catalog
    production-ready CI requires every Common variable to appear, so this
    becomes a hard template requirement.

## Medium

14. **`edit_history` as a cross-reload undo store**
    Issue: over-specified. Action: keep `edit_history_head`; drop
    `include_edit_history`, the `before`/`after` HTTP union, and seeded
    Ctrl+Z stacks.
    Where: [editing.md](editing.md) lines 106–111, 271;
    [api.md](api.md) line 50.

15. **`website_publications.rollback_of_publication_id`**
    Issue: persistence. Action: drop.
    Where: [persistence.md](persistence.md) line 164. No writer in 04;
    absent from `WebsitePublicationRead`.

16. **`website_addresses` timestamps / stored `is_primary`**
    Issue: persistence. Action: drop `dns_verified_at` and
    `activated_at`; derive the canonical host instead of storing
    `is_primary`.
    Where: [persistence.md](persistence.md) (`website_addresses`).

17. **Two conflicting website editor read models**
    Issue: DTO contradiction. Action: `api.md` is the field list; delete
    extra projection fields in [editing.md](editing.md) (`schema_version`,
    `family`, `variant`, `preview_url`, `tenant`). Decide where
    `media_assets[]` and `has_unpublished_changes` live.

18. **`WebsitePageUpdate.review_ids`** Issue: DTO. Action: carry `review_ids` on
    the website section, not the website page. Where: [api.md](api.md) line 54 vs
    [assistant.md](assistant.md) `update_reviews(section_id, …)`.

19. **Projects tools on the website editor assistant**
    Issue: functionality. Action: drop; keep inline AI assistance on
    Projects.
    Where: [assistant.md](assistant.md) (Projects tools).

20. **`update_form` tool** Issue: functionality. Action: drop if website forms
    stay a fixed lead website form (item 7). Where: [assistant.md](assistant.md).

21. **Common variable list + “every variable must appear” CI gate**
    Issue: functionality. Action: cut to variables a website component actually
    paints; relax the CI gate.
    Where: [variables.md](variables.md); [catalog.md](catalog.md)
    production-ready CI. Unbacked: `{{address}}`,
    `{{services.marquee}}`, `{{services.project_types}}`,
    `{{projects.categories}}`, `{{about.feature_paragraphs}}`.

22. **`origin=business_research` on sections/slots**
    Issue: persistence. Action: drop that enum value; make `origin`
    server-set if kept.
    Where: [persistence.md](persistence.md) lines 70, 86.

23. **`websiteRender` as a second Worker contract + per-slot screenshot**
    Issue: over-specified. Action: same `website.v1` dump as publication;
    consider cutting per-`update_slot` render from the first cut.
    Where: [api.md](api.md) (`WebsiteRenderRequest`);
    [pipeline/03-website-copy-generation.md](pipeline/03-website-copy-generation.md).

24. **Cloudflare passthrough on `WebsiteAddressRead`**
    Issue: DTO. Action: one derived `status`; drop
    `cloudflare_hostname_status` / `cloudflare_ssl_status`.
    Where: [api.md](api.md) (`WebsiteAddressRead`).

25. **Stale “07” for prefix reservation / first HTML write**
    Issue: contradiction. Action: 08-or-09 everywhere.
    Where: [cloudflare.md](cloudflare.md); [ADR.md](ADR.md) 19, 24 vs
    [persistence.md](persistence.md) (reserved at 08).

26. **`published_by` on HTTP so the browser can hide onboarding rows**
    Issue: DTO. Action: filter server-side; drop `published_by` from the
    DTO; cap the publications list.
    Where: [api.md](api.md) (`GET /v1/website/publications`).

## Keep

- Tokens staying tokens through 02/03, resolved by the Worker.
- `website.menus` as one row; `website_slot_reviews` per website section.
- `edit_history_head` + `409` (even if item 14 lands).
- Rollback, Connect website address DNS rows, `strip` on publication,
  `media_asset_urls` on Worker requests.
