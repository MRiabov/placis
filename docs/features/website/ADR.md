# Website Decision Record

Status: decided (2026-08-16, product owner + engineering).

## Decisions

1. **The CMS is the umbrella** — marketing management has a website part and an
   ads part. This directory owns the website part; the ads part lives in
   `docs/features/ads/`. There is no separate "operations dashboard" or CRM
   surface.

2. **The unpublished website is the source of truth; the website manifest is the
   read model** — `website_manifest` is built at website publication only; it is
   never the editable source.

3. **Website component contracts are one typed struct each, dumped to JSON** —
   under `catalog/`, consumed by both the TypeScript renderer for the contractor
   website (validation) and the Go backend (save / website publication
   validation). No forked duplicate of website component schemas (kills the old
   TS-types
   + Python-`typed_values` duplication).

4. **Website templates are static website template catalog data, not DB rows** —
   trade website templates + website component contracts are JSON + sidecars
   under `catalog/`; the backend loads and validates them, never hand-duplicates
   their schemas.

5. **Website placeholders stay tokens until the Worker resolves them** —
   `{{business_name}}`, `{{marketing_phone}}`, `{{trade}}`, `{{reviews.1}}`, …
   stay in unpublished rows and in the dump Go sends. Go does not resolve.
   The Worker fills them for publication HTML and for copy-generation page
   renders. Wait teaser and CMS canvas resolve in frontend-2 + the website
   component package. (2026-08-16; Worker resolve, not Go, 2026-08-31)

6. **The LLM drafts; the owner decides** — the **assistant** is another caller
   of the same website-editor / media-library execution the owner already uses
   (`update_slot`, `cleanup_image`, `generate_image`, …), validated against
   contracts. Default is plan + Ask first (Apply / Reject, one-way). Instant
   apply still uses those tools; it does not write freeform JSON. Named real
   photo → attach first. AI cleanup is the `/cms/media` cleanup.
   `generate_image` is last resort when nothing in `media_assets[]` fits.
   Overlay look (always-on overlay, reduce-height left / trash right, Apply /
   Reject pills): [assistant](../assistant/README.md). Placement: [design decision record](design-decision-record.md) 18.
   (2026-08-27): one `update_details` tool ([details HTTP](../business-profile/details/api.md)). Assistant and Ads
   generator invoke that same tool (one implementation). Applied immediately;
   the shared notification Revert undoes that increment — not website Reject /
   `edit_history`. (2026-08-20; assistant configs + Apply/Reject terminal
   2026-08-23; Ask first 2026-08-23; attach-before-generate + shared
   media-library functions 2026-08-24; collapse + no dim 2026-08-26; CMS
   assistant HTTP 2026-08-28) (2026-08-31): automatic website copy generation
   (03) uses the same tools headless; no `update_reviews`; turn 1 and after each
   `update_slot` Go `POST`s `websiteRender` (website image render on the
   inference, not HTML). Go does not emit HTML. 04 is `websitePublication`
   (website HTML render, no website image render). Select website template is
   occupancy + hash at 01 (no LLM, no `website_template_picker`), not at
   copy-pages. (2026-09-01): `WebsiteBusinessProfileRead` is the Common
   variables struct on canvas hydrate and both Worker requests.

7. **Website publication is kept and can be rolled back** — website publication
   creates a `website_publications` row (a published website copy); website
   rollback reactivates an earlier **owner** website publication without
   deleting profile history. Onboarding-written rows (`published_by=onboarding`,
   including 07 v1, 08 v2, and 05-retry writes) are never website-rollback
   targets. (2026-08-16; onboarding drafts excluded 2026-08-25)

8. **Deferred: blog posts + careers** — no `blog_post` website page type or
   `website_career_*` tables in the first pass; re-add only when needed.

9. **Website templates come from decomposed reference sites** — website
   templates and patterns are acquired by taking inspiration from existing
   websites, decomposing them into website page / website section patterns, then
   switching the content and remixing the colors for a new business. They are
   not hand-authored from scratch.

10. **First-pass page types are `home` / `about` / `service` / `contact` /
    `legal`** — no `standard`, no `landing` (ads do not send people to the
    website for now). Blog and careers stay deferred.
    `{{about.intro_paragraphs}}` is a placeholder namespace, not a page type.
    About is on the top menu and the footer (menu constant). `legal` is the
    page type for legal-document website pages such as privacy policy; Legal
    is a footer heading, not a top-menu node. (2026-08-20; about added
    2026-08-31)

11. **Website page status is `unpublished` / `archived`** — publication is
    website-level (`website_publications`). There is no page-level `approved` or
    `published`. (2026-08-20)

12. **No unpublished snapshot per edit** — the unpublished website is in-place
    `UPDATE` of unpublished rows. Website edit history (`edit_history`) is typed
    increments, like `business_profile_edits`, not a full unpublished website or
    website page jsonb dump. Last writer is only that log (no `edited_by` /
    `ai_generation_id` on live rows). Ctrl+Z / redo are in-memory; copy-out is
    the existing PATCH (`base_edit_history_head`). No `POST /undo` or
    `POST /redo`. Website versions are `website_publications` only. Do not bring
    back predecessor per-page version snapshots. Text PATCH on click-off (leave
    the field), not while typing. Discrete actions queue a PATCH immediately.
    The frontend safety timer paces sends (one in flight, 500ms min gap,
    coalesce) so `429` is a backstop, not the normal path. Do not audit every
    website slot edit. There is no Save action and no Saving / Saved indicator;
    edits persist on click-off. If a copy-out or upload has not succeeded after
    10 seconds, show a visible error; the leave guard still applies because the
    change is uncopied. The in-memory website editor projection is the working
    copy; PATCH copies out. Do not replace it from the PATCH response. The PATCH
    body is dirty keys only, typically under 10 KB; reject over 64 KB. Never
    send the whole unpublished website or the file. Leaving while a copy-out or
    upload is in flight or has failed uses a discard confirm (`beforeunload` +
    in-app). Explicit actions remain website publication, Connect website
    address, and apply website styles. (2026-08-20; write budget 2026-08-23; no
    Save 2026-08-23; local-first PATCH 2026-08-23; click-off 2026-08-23; send
    timer + leave guard 2026-08-23; PATCH delta 64 KB 2026-08-23; no Saving
    indicator + 10s copy-out error 2026-08-23; website edit history 2026-08-23)

13. **Website styles live on `website_settings`** — one row per tenant, copied
    into the website manifest at website publication. Not per website page.
    (2026-08-20)

14. **Live website is the published website copy** — Details, Projects,
    certifications and reviews, and website styles update the website editor
    immediately and need website publication to change what website visitors
    see. (2026-08-20)

15. **The contractor website is `apps/contractor-website`** — never the
    predecessor package name. The website component package is keep-and-cut; the
    Worker is write-thin against this serve path (live GET never calls Go).
    Remaining live-site work is R2 `latest/`, website publication HTML, Custom
    Hostnames, and Connect website address. Website publication is not a
    Cloudflare deploy. There is no per-request unpublished render for website
    visitors. Copy generation (03) uses `websiteRender` (no R2). Website
    publication uses `websitePublication`. Website address uses Custom
    Hostnames, not Pages. See [cloudflare.md](cloudflare.md), [contractor-website-debloat.md](contractor-website-debloat.md),
    [port-contractor-website.md](port-contractor-website.md), and ADR 18–20. (2026-08-20; edge locked
    2026-08-21; imported 2026-08-23; Worker write-thin 2026-08-23; token preview
    dropped 2026-08-25)

16. **Certifications and reviews picker is a Profile screen** —
    `/cms/certifications-and-reviews`. Picker rules, top reviews, archive, and
    certification tables: moved to [certifications-and-reviews ADR](../business-profile/certifications-and-reviews/ADR.md)
    (2026-08-27). Layout: that directory’s [design decision record](../business-profile/certifications-and-reviews/design-decision-record.md).
    (2026-08-20)

    Unpin/reorder of **top reviews** used to rewrite unpublished
    `website_slot_reviews` from the current top set. (2026-08-20)

    (2026-08-26): Each **reviews website section** has its own ordered
    `website_slot_reviews` from the pool. The LLM picks that list (onboarding
    after the website template, and the assistant). Length is the website
    component’s max (some layouts take 3, others 6 or 8). A service website page
    can use a different set than Home. The same review may appear on more than
    one website section. Content edits **that** website section only (add from
    the pool, remove, reorder). Pinning **top reviews** on Certifications and
    reviews does **not** rewrite website sections. Archive still drops that
    review from every website section array and from top reviews. Empty array:
    keep the website section (no fake copy; do not hide the website component).
    Origins, archive, and create owner-written stay on the picker ADR.

    (2026-08-31): Do not pick `website_slot_reviews` when copying template
    pages. **LLM ranking** after ETL fast extract writes provisional `is_top` /
    `top_position` (not locked). After ETL finishes, rank again if additional
    review rows landed, then write persistent pins. `{{reviews.1}}` … resolve
    from that order. Website 03 must not `update_reviews`. Owner Content /
    `update_reviews` can still override a section later.

    (2026-08-31, later): Website does **not** own ranking. 02 keeps
    `{{reviews.N}}` and does not insert `website_slot_reviews`. 03 must not
    `update_reviews`. Hydrate / 04 read the ranked pool. Ranking is River job
    `reviews_ranking_for_display` ([build-profile](../onboarding/pipeline/build-profile.md), [jobs](../../general-architecture/jobs.md)). Owner Content /
    `update_reviews` can still override a section later.

    (2026-08-26): Certification definitions and selections are Details /
    business-profile tables (`certification_definitions`,
    `business_profile_certification_selections`), not `website_certification_*`.
    See [details ADR](../business-profile/details/ADR.md) 7.

17. **`generate_image` may attach pending-review on the unpublished canvas** —
    always a warning; owner approval makes it approved; website publication
    still requires approved media library items. Attach of an existing library
    photo is `update_slot`, not `generate_image`. (2026-08-20; attach vs
    generate 2026-08-24) The warning is in Content when that image is selected,
    not copy on the website. (2026-08-26)

18. **Live GET is Cache then R2 only** — website publication prebuilds HTML into
    `sites/{website_prefix}/latest/`. A cache miss still reads R2. Missing
    object is 404, not a render from Postgres. Drop leftover
    `GET /v1/public/site/resolve` (it was the token website preview). Tests
    assert R2 keys, not resolve. (2026-08-21; token preview dropped 2026-08-25)

19. **R2 tree is keyed by the website prefix** — `tenants.website_prefix`,
    **reserved at 07** from `display_name`. A website address maps
    `sites/hosts/{hostname}` → that prefix. Owner-facing default host is
    `{website_prefix}.preview.placis.com` (wildcard on our zone). While
    unactivated, that host **is** the website preview (static `latest/` +
    website-activation strip island). After 09: **v2** on the same host without
    the strip; the site stays up (not empty). Empty host = no `latest/` yet. Do
    not advertise `{website_prefix}.placis.com`. One `latest/` tree; publication
    destinations share it (no Placis-host version vs custom-host version).
    (2026-08-21; `.preview.placis.com` 2026-08-23; reserved at 07 + sales host
    2026-08-25) (2026-08-27): **Per-host trees.** Each website address has its
    own R2 tree (`sites/hosts/{hostname}/latest/` and `…/{version_number}/`).
    Hosts can diverge. The **host row** is the Publish click
    (`website_address_id` on POST). Rollback and purge are per that host. Keep
    `sites/{website_prefix}/…` as the unactivated 08/09 write until the first
    owner publication on that preview host.

20. **Website address uses Custom Hostnames, not Pages** —
    `POST /zones/{zone_id}/custom_hostnames` with TXT domain control. CMS
    **Connect website address** is a modal over the website editor, opened from
    **New URL** in the website publication dropdown. Owner copy on that control
    is **Publish**. Shows Host and Value as separate copyable fields, with
    on-screen how-to. Do not take over the contractor’s nameservers. Apex `A`
    records need Apex Proxying (later, Enterprise). (2026-08-21; Connect modal
    2026-08-23; Host/Value copy 2026-08-27)

21. **Website publication is a destination dropdown** —
    `{website_prefix}.preview.placis.com`, each connected website address, or
    New URL (Connect website address). Not a Worker deploy. Owner copy is
    **Publish**. See [frontend.md](frontend.md). (2026-08-23; owner copy Publish 2026-08-26)
    (2026-08-27): Publish is the **host row**, not a destination-less POST.
    `POST /publications` sends `website_address_id`. One tree per host.

22. **Top menu and footer trees live on one `website.menus` row** — `top_menu`
    and `footer` are closed jsonb trees (page / text / URL nodes, depth 2), plus
    `show_phone` / `show_email`. Look stays on site-wide website sections
    (`page_id` null). No `top_menu_items` / `footer_items` tables. The assistant
    uses `update_menus`, not `update_nav`. Where the owner edits the trees is in
    [design decision record](design-decision-record.md). (2026-08-23) Also `show_contact` (bar CTA to the
    Contact website page). (2026-08-26)

23. **Website publication requires an active subscription** — After they stop
    paying the subscription price, unpublish. `POST /publications` and live
    website rollback are **402** `subscription_canceled` until
    `subscription_status=active`. Not `usage_credit_exhausted`. CMS edit stays
    open. (2026-08-29)

24. **Unpublished GET/PATCH on the app for unactivated** — Onboarding session
    token or Clerk may GET unpublished website on the app origin (website
    preview). Signed-in unactivated Clerk **PATCH** on the app is allowed
    (Assistant apply). Onboarding session token must not PATCH. Preview website
    address `{website_prefix}.preview.placis.com` is Cache then R2 only: no
    website editor, no Assistant, no PATCH. Apex `preview.placis.com` is 404.
    07 HTML write is on-demand share, not wait-teaser landing. (2026-08-30)

25. **Website template select is occupancy + hash; styles ship with the
    website template** — 01 lists production-ready website templates only
    (`production_ready=true`). Among occupying tenants (paid, not in
    nonpayment ≥ 6 months) within 250 km (haversine on Maps listing lat/lng),
    pick the lowest-count production-ready id; tie-break `hash(tenant_id)`.
    No coords → hash over the production-ready set. Do not block 01 on ETL.
    Same-tenant retry reuses `website_settings`. `preset_id` is that website
    template’s associated website style catalog preset — not a second pick.
    New looks graduate another validated website template; do not hash the 7
    presets. 02 copies the catalog object
    ([catalog.md](catalog.md)). Predecessor LLM picker collapsed; this
    algorithm does not. (2026-08-31)
