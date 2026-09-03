# Sep 3 issue list — Website

Issue audit from 2026-09-03, not a drop list. Not canonical. Line numbers
are as of that audit. Fix the cited issue, then delete the item. Delete
this file when empty. Rumdl compacts the remaining ordered list.

Each row’s **Action** is the auditor’s first guess, not the product
decision. Resolve by keeping and aligning, filling a missing writer or
DTO, amending the older sentence, or dropping — only when a drop is
confirmed. Later dated [ADR](ADR.md) / [design
decision](design-decision-record.md) is source of truth when this list
contradicts them. Unused in the first catalog or Copy website template
pages is not a drop.

**Comment** (and Keep) is the walkthrough so far. Remaining **Action**
lines stay as audit suggestions until resolved.

## High

6. **`submit_action` is a one-value writable enum**
   Issue: DTO + persistence. Action: drop from DTOs and the tool.
   Where:

   - [persistence.md](persistence.md) lines 95–97
   - [api.md](api.md) line 57
   - [editing.md](editing.md) line 164
   - [assistant.md](assistant.md) line 95
   - [frontend.md](frontend.md) line 102

   Only legal value is `create_website_lead`.
   Comment: likely false alarm. A closed one-value enum is the typed
   contract (this website form creates a website lead). Design
   decision 12 keeps website-form Content. No ADR drops the field.

7. **Website form field types leads cannot store**
   Issue: persistence + functionality. Action: cut `field_type` to
   `text` / `textarea` / `email` / `marketing_phone`; drop
   `website_form_field_options`.
   Where:

   - [persistence.md](persistence.md) lines 107–108 (`address` / `select` /
     `date` / `checkbox`)
   - [persistence.md](persistence.md) lines 114–119
     (`website_form_field_options`)
   - Leads only store name, marketing phone, email, message:
     [../other/leads/persistence.md](../other/leads/persistence.md) lines 7–9

   Comment: not unused-spec. Copy website template pages already persists
   `website_form_field_options` from catalog contracts. No website ADR
   cuts field types. Leads being narrower is a leads follow-up (widen
   leads, or first-pass lead-only forms) — do not drop because the first
   templates only ship text fields.

8. **Manifest root-level SEO has no source**
   Issue: DTO / persistence. Action: drop root SEO from `website.v1`;
   keep per-page SEO.
   Where:

   - [manifest.md](manifest.md) (Keep → root SEO fallback fields)
   - SEO columns exist on `website_pages`
     ([persistence.md](persistence.md) line 54), not on
     `website_settings` (lines 151–158)

   Comment: likely false alarm of “no `website_settings` column → drop”.
   ADR 2: the manifest is a publication read model. Root SEO can bake
   from the home website page at publication. Do not drop from
   `website.v1` only because styles have no SEO columns.

9. **`{{existing_site_url}}` as a website variable**
   Issue: functionality. Action: remove from Common variables.
   Where:

    - [variables.md](variables.md) line 51

   That is the contractor's **old** site (ETL crawl input). Catalog
   production-ready CI requires every Common variable to appear, so this
   becomes a hard template requirement.
   Comment: **false alarm** (same shape as URL menus). Details persist
   `existing_site_url`. ADR 6: `WebsiteBusinessProfileRead` is the
   Common variables struct. Templates may paint it. The hard template
   requirement is the catalog CI gate (item 21), not a reason to
   drop the variable.

## Medium

14. **`edit_history` as a cross-reload undo store**
    Issue: over-specified. Action: keep `edit_history_head`; drop
    `include_edit_history`, the `before`/`after` HTTP union, and seeded
    Ctrl+Z stacks.
    Where: [editing.md](editing.md) lines 106–111, 271;
    [api.md](api.md) line 50.

    Comment: ADR 12 is source of truth: typed increments, in-memory
    Ctrl+Z, copy-out is PATCH, `409` on `edit_history_head`. Do not
    drop the log. `include_edit_history` as a reload seed is extra in
    [editing.md](editing.md) vs “in-memory”; that query is the only
    open cut, not the table.

15. **`website_publications.rollback_of_publication_id`**
    Issue: persistence. Action: drop.
    Where: [persistence.md](persistence.md) line 164. No writer in
    Website publication; absent from `WebsitePublicationRead`.

    Comment: likely unused-spec. ADR 7 rollback does not require this
    column. If kept, the writer is rollback POST, not Website
    publication. Absence from `WebsitePublicationRead` is not a drop.

16. **`website_addresses` timestamps / stored `is_primary`**
    Issue: persistence. Action: drop `dns_verified_at` and
    `activated_at`; derive the canonical host instead of storing
    `is_primary`.
    Where: [persistence.md](persistence.md) (`website_addresses`).

    Comment: **`is_primary` is not unused.** [cloudflare.md](cloudflare.md)
    sitemap and canonical use that flag (preview host until a custom
    host is `active`). Do not drop it to “derive instead”.
    `dns_verified_at` / `activated_at` may still be unused next to
    `status` (design decision 19).

17. **Two conflicting website editor read models**
    Issue: DTO contradiction. Action: `api.md` is the field list; delete
    extra projection fields in [editing.md](editing.md) (`schema_version`,
    `family`, `variant`, `preview_url`, `tenant`). Decide where
    `media_assets[]` and `has_unpublished_changes` live.

    Comment: real contradiction, not unused-spec. ADR 12: the
    in-memory projection copies out from GET `*Read`. [api.md](api.md)
    is the HTTP field list.

18. **`WebsitePageUpdate.review_ids`** Issue: DTO. Action: carry
    `review_ids` on the website section, not the website page. Where:
    [api.md](api.md) line 54 vs [assistant.md](assistant.md)
    `update_reviews(section_id, …)`.

    Comment: real DTO unit vs ADR 16 (`website_slot_reviews` per
    website section). Not unused-spec. The `review_ids` field belongs
    on the website section, not the website page.

19. **Projects tools on the website editor assistant**
    Issue: functionality. Action: drop; keep inline AI assistance on
    Projects.
    Where: [assistant.md](assistant.md) (Projects tools).

    Comment: **false alarm.**
    [Projects ADR 4](../business-profile/projects/ADR.md) decides owner
    action = assistant action and lists those tools on the website
    assistant registry. Website ADR 6 does not forbid them. Do not
    drop because website Content is the gallery pick.

20. **`update_form` tool** Issue: functionality. Action: drop if website
    forms stay a fixed lead website form (item 7). Where:
    [assistant.md](assistant.md).

    Comment: likely false alarm. ADR 6: the assistant is another caller
    of the same website-editor execution. Design decision 12 keeps
    website-form Content. `update_form` is that PATCH. Do not drop
    because first-pass catalog forms are a fixed lead form.

21. **Common variable list + “every variable must appear” CI gate**
    Issue: functionality. Action: cut to variables a website component actually
    paints; relax the CI gate.
    Where: [variables.md](variables.md); [catalog.md](catalog.md)
    production-ready CI. Unbacked: `{{address}}`,
    `{{services.marquee}}`, `{{services.project_types}}`,
    `{{projects.categories}}`, `{{about.feature_paragraphs}}`.

    Comment: cutting the Common list because templates do not paint
    them yet is a false alarm (ADR 5/6; same as item 13). Relaxing the
    catalog CI gate so a production-ready template need not mention
    every variable is a separate, real catalog question.

22. **`origin=business_research` on sections/slots**
    Issue: persistence. Action: drop that enum value; make `origin`
    server-set if kept.
    Where: [persistence.md](persistence.md) lines 70, 86.

    Comment: likely unused-spec false alarm. ADR 5: later business
    research does not rewrite live `latest/`; it does not forbid
    unpublished `origin=business_research`. Do not drop because Copy
    website template pages only writes `website_template`.

23. **`websiteRender` as a second Worker contract + per-slot screenshot**
    Issue: over-specified. Action: same `website.v1` dump as publication;
    consider cutting per-`update_slot` render from the first cut.
    Where: [api.md](api.md) (`WebsiteRenderRequest`);
    [Generate website copy](pipeline/03-website-copy-generation.md).

    Comment: **false alarm.** ADR 6 and ADR 15: Generate website copy
    `POST`s `websiteRender` (website image render, no R2) on turn 1
    and after each `update_slot`. Website publication is
    `websitePublication` (HTML). Do not unify away `websiteRender`.

24. **Cloudflare passthrough on `WebsiteAddressRead`**
    Issue: DTO. Action: one derived `status`; drop
    `cloudflare_hostname_status` / `cloudflare_ssl_status`.
    Where: [api.md](api.md) (`WebsiteAddressRead`).

    Comment: owner copy is derived `status` (design decision 19:
    waiting for DNS → waiting for certificate → active). ADR 20
    Custom Hostnames poll still needs Cloudflare statuses as the poll
    source. Do not drop because unused in catalog. Remaining question
    is HTTP: derived only vs also passthrough.

25. **Stale “07” for prefix reservation / first HTML write**
    Issue: contradiction. Action: Preview website address share, or
    Website activation if they never shared, everywhere.
    Where: [cloudflare.md](cloudflare.md); [ADR.md](ADR.md) 19, 24 vs
    [persistence.md](persistence.md) (reserved at Preview website address).

    Comment: real naming contradiction, not unused-spec. ADR 19/24
    still say 07; the decided names are Preview website address share,
    or Website activation if they never shared. Amend the ADR
    wording. Do not invent a third reservation step.

26. **`published_by` on HTTP so the browser can hide onboarding rows**
    Issue: DTO. Action: filter server-side; drop `published_by` from the
    DTO; cap the publications list.
    Where: [api.md](api.md) (`GET /v1/website/publications`).

    Comment: ADR 7 keeps `published_by` on the row (onboarding rows are
    never rollback targets). Do not drop the column. Filtering the list
    server-side is compatible; exposing `published_by` on HTTP is a
    DTO follow-up, not unused-spec.

## Keep

- Tokens staying tokens through Copy website template pages and
  Generate website copy, resolved by the Worker.
- `website.menus` as one row; `website_slot_reviews` per website section.
- `edit_history_head` + `409` (even if item 14 lands).
- Rollback, Connect website address DNS rows, `strip` on publication,
  `media_asset_urls` on Worker requests.
- Checkout: `GET` with `publication_id`, then ordinary PATCH. No
  restore-unpublished POST.
- URL menu nodes: templates may ship them; Copy website template pages
  copies site-wide catalog menus; owner `/urls` and menus PATCH stay.
- Per-host R2 trees + `website_address_id` (ADR 19/21).
- `websiteRender` vs `websitePublication` (ADR 6/15).
- Projects tools on the website assistant registry (Projects ADR 4).
- `{{existing_site_url}}` on Common variables / Details.
