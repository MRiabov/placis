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
   - 2026-09-03: public SEO fields are `seo_title`, `seo_description`,
     `seo_og_title`, `seo_og_description`, `seo_canonical_url`, `seo_noindex`.
     No `seo_primary_keyword`.

3. **Website component contracts are one typed struct each, dumped to JSON** —
   under `catalog/`, consumed by both the TypeScript renderer for the contractor
   website (validation) and the Go backend (save / website publication
   validation). No forked duplicate of website component schemas (kills the old
   TS-types + Python-`typed_values` duplication).

4. **Website templates are static website template catalog data, not DB rows** —
   trade website templates + website component contracts are JSON + sidecars
   under `catalog/`; the backend loads and validates them, never hand-duplicates
   their schemas.

5. **Website placeholders stay tokens until the Worker resolves them** —
   `{{business_name}}`, `{{marketing_phone}}`, `{{trade}}`, `{{reviews.1}}`, …
   stay in unpublished rows and in the dump Go sends. Go does not resolve. The
   Worker fills them for publication HTML and for copy-generation page renders.
   Wait teaser and CMS canvas resolve in frontend-3 + the website component
   package. (2026-08-16)
   - 2026-08-31: Worker resolve, not Go.

6. **The LLM drafts; the owner decides** — the **assistant** is another caller
   of the same website-editor / media-library execution the owner already uses
   (`update_slot`, `cleanup_image`, `generate_image`, …), validated against
   contracts. Default is plan + Ask first (Apply / Reject, one-way). Instant
   apply still uses those tools; it does not write freeform JSON. Named real
   photo → attach first. AI cleanup is the `/cms/media` cleanup.
   `generate_image` is last resort when nothing in `media_assets[]` fits.
   Overlay look (always-on overlay, reduce-height left / trash right, Apply /
   Reject pills): [assistant](../assistant/README.md). Placement: [design
   decision record](design-decision-record.md) 18.
   - 2026-08-27: one `update_details` tool ([details
     architecture](../business-profile/details/architecture.md)). Assistant and
     Ads generator invoke that same tool (one implementation). Applied
     immediately; the shared notification Revert undoes that increment — not
     website Reject / `edit_history`.
   - 2026-08-23: assistant configs + Apply/Reject terminal; Ask first.
   - 2026-08-24: attach-before-generate + shared media-library functions.
   - 2026-08-26: collapse + no dim.
   - 2026-08-28: CMS assistant HTTP.
   - 2026-08-31: automatic website copy generation (03) uses the same tools
     headless; no `update_reviews`; turn 1 and after each `update_slot` Go
     `POST`s `websiteRender` (website image render on the inference, not HTML).
     Go does not emit HTML. 04 is `websitePublication` (website HTML render, no
     website image render). Select website template is occupancy + hash at 01
     (no LLM, no `website_template_picker`), not at copy-pages.
   - 2026-09-01: `WebsiteBusinessProfileRead` is the Common variables struct on
     canvas hydrate and both Worker requests.
   - 2026-09-02: 03 does not `generate_image` a logo or a face. Portrait slots
     stay empty when no matching media caption.

7. **Website publication is kept and can be rolled back** — website publication
   creates a `website_publications` row (a published website copy); website
   rollback reactivates an earlier **owner** website publication without
   deleting profile history. Onboarding-written rows (`published_by=onboarding`,
   including 07 v1, 08 v2, and 05-retry writes) are never website-rollback
   targets. (2026-08-16)
   - 2026-08-25: onboarding drafts excluded.
   - 2026-09-03: no `website_publication_issues` table. The Worker publication
     response is empty. Pre-publish blockers are computed `blockers[]` on the
     editor GET.
   - 2026-09-03: `blockers[]` is per website page (`WebsitePageRead`). The
     Publish dropdown displays the aggregate.
   - 2026-09-03: one function `WebsitePublicationBlockers` (required website
     slot cannot resolve; live-path media library item not approved;
     subscription not `active`). Do not duplicate those `code` values per route.
     Editor routes return `blockers[]`: list GET per-row page-scoped, page GET
     hydrate, page PATCH ack (`WebsiteEditApplyRead`; menus / settings omit),
     `GET /v1/websites/{website_prefix}/editor/blockers` when the Publish
     dropdown opens (tenant-scoped: all website pages plus subscription and
     off-canvas unapproved media library items). `PublishWebsite` **calls** it
     as the hard gate.
   - 2026-09-04: open-Publish GET and `PublishWebsite` are **this
     `website_id`**. `subscription_canceled` stays tenant-wide.
     `media_not_approved` is live-path on **this** website (join website slots →
     `media_assets`), not off-canvas tenant-wide.
   - 2026-09-03: Previous: tenant-scoped open-Publish GET.

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
    About is on the top menu and the footer (menu constant). `legal` is the page
    type for legal-document website pages such as privacy policy; Legal is a
    footer heading, not a top-menu node. (2026-08-20)
    - 2026-08-31: about added.

11. **Website page status is `unpublished` / `archived`** — publication is
    website-level (`website_publications`). There is no page-level `approved` or
    `published`. (2026-08-20)
    - 2026-09-03: website slots have no `status` column. `slot_type` is `text` /
      `rich_text` / `image` / `link` / `list` (no `json`).

12. **No unpublished snapshot per edit** — the unpublished website is in-place
    `UPDATE` of unpublished rows. Website edit history (`edit_history`) is typed
    increments, like `business_profile_edits`, not a full unpublished website or
    website page jsonb dump. Last writer is only that log (no `edited_by` /
    `ai_generation_id` on live rows). Ctrl+Z / redo are in-memory; copy-out is
    the existing PATCH (`base_edit_history_head`). No `POST /undo` or `POST
    /redo`. Website versions are `website_publications` only. Do not bring back
    predecessor per-page version snapshots. Text PATCH on click-off (leave the
    field), not while typing. Discrete actions queue a PATCH immediately. The
    frontend safety timer paces sends (one in flight, 500ms min gap, coalesce)
    so `429` is a backstop, not the normal path. Do not audit every website slot
    edit. There is no Save action and no Saving / Saved indicator; edits persist
    on click-off. If a copy-out or upload has not succeeded after 10 seconds,
    show a visible error; the leave guard still applies because the change is
    uncopied. The in-memory website editor projection is the working copy; PATCH
    copies out. Do not replace it from the PATCH response. The PATCH body is
    dirty keys only, typically under 10 KB; reject over 64 KB. Never send the
    whole unpublished website or the file. Leaving while a copy-out or upload is
    in flight or has failed uses a discard confirm (`beforeunload` + in-app).
    Explicit actions remain website publication, Connect website address, and
    apply website styles. (2026-08-20)
    - 2026-08-23: write budget; no Save; local-first PATCH; click-off; send
      timer + leave guard; PATCH delta 64 KB; no Saving indicator + 10s
      copy-out error; website edit history.
    - 2026-09-03: checkout of an owner publication is `GET` with
      `publication_id` (page list and page hydrate), then ordinary PATCH of the
      substituted projection. No restore-unpublished POST. That copy-out may
      send a full dirty set (64 KB does not forbid it). Rollback stays live-only
      and does not rewrite unpublished rows.

13. **Website styles live on `website_settings`** — one row per tenant, copied
    into the website manifest at website publication. Not per website page.
    (2026-08-20)
    - 2026-09-03: **superseded by ADR 26** — one `website_settings` row per
      website, not per tenant. Hydrate is the website page GET `website_styles`;
      apply is `PATCH /v1/websites/{website_prefix}/editor/settings`. There is
      no `GET /settings`. Top menu and footer hydrate is the website page GET
      `menus`; apply is `PATCH /menus`. There is no `GET /menus`.

14. **Live website is the published website copy** — Details, Projects,
    certifications and reviews, and website styles update the website editor
    immediately and need website publication to change what website visitors
    see. (2026-08-20)
    - 2026-09-04: `has_unpublished_changes` is true when live HTML would change
      on republish, including those Details / Projects / certifications writes
      after `website_publications.published_at` (compare
      `business_profile_edits.created_at` / `last_edit_id`, not only
      website-slot PATCH). Do not enqueue 04 Website publication from Details
      PATCH. Canvas hydrate uses live `WebsiteBusinessProfileRead`; live
      `latest/` waits for the next 04.

15. **The contractor website is `apps/contractor-website`** — never the
    predecessor package name. The website component package is keep-and-cut; the
    Worker is write-thin against this serve path (live GET never calls Go).
    Remaining live-site work is R2 `latest/`, website publication HTML, Custom
    Hostnames, and Connect website address. Website publication is not a
    Cloudflare deploy. There is no per-request unpublished render for website
    visitors. Copy generation (03) uses `websiteRender` (no R2). Website
    publication uses `websitePublication`. Website address uses Custom
    Hostnames, not Pages. See [cloudflare.md](cloudflare.md), [contractor-website-debloat.md](contractor-website-debloat.md),
    [port-contractor-website.md](port-contractor-website.md), and ADR 18–20. (2026-08-20)
    - 2026-08-21: edge locked.
    - 2026-08-23: imported; Worker write-thin.
    - 2026-08-25: token preview dropped.

16. **Certifications and reviews picker is a Profile screen** —
    `/cms/certifications-and-reviews`. Picker rules, top reviews, archive, and
    certification tables: moved to [reviews ADR](../business-profile/reviews/ADR.md) (2026-08-27). Layout:
    [reviews design decision record](../business-profile/reviews/design-decision-record.md). (2026-08-20)
    - 2026-08-20: Unpin/reorder of **top reviews** used to rewrite unpublished
      `website_slot_reviews` from the current top set.
    - 2026-08-26: Each **reviews website section** has its own ordered
      `website_slot_reviews` from the pool. The LLM picks that list (onboarding
      after the website template, and the assistant). Length is the website
      component’s max (some layouts take 3, others 6 or 8). A service website
      page can use a different set than Home. The same review may appear on more
      than one website section. Content edits **that** website section only (add
      from the pool, remove, reorder). Pinning **top reviews** on Certifications
      and reviews does **not** rewrite website sections. Archive still drops
      that review from every website section array and from top reviews. Empty
      array: keep the website section (no fake copy; do not hide the website
      component). Origins, archive, and create owner-written stay on the picker
      ADR.
    - 2026-08-31: Do not pick `website_slot_reviews` when copying template
      pages. **LLM ranking** after ETL fast extract writes provisional `is_top`
      / `top_position` (not locked). After ETL finishes, rank again if
      additional review rows landed, then write persistent pins. `{{reviews.1}}`
      … resolve from that order. Website 03 must not `update_reviews`. Owner
      Content / `update_reviews` can still override a section later.
    - 2026-08-31, later: Website does **not** own ranking. 02 keeps
      `{{reviews.N}}` and does not insert `website_slot_reviews`. 03 must not
      `update_reviews`. Hydrate / 04 read the ranked pool. Ranking is River job
      `reviews_ranking_for_display`
      ([build-profile](../onboarding/pipeline/build-profile.md),
      [jobs](../business-profile/jobs.md)). Owner Content / `update_reviews` can
      still override a section later.
    - 2026-09-02: Ranking inserts `business_profile_review_rankings`. Website
      still hydrates `{{reviews.N}}` from that join. It does not own ranking.
    - 2026-09-04: v1 stays this Profile picker and one tenant pool. Ads use
      **top reviews**; a reviews website section may already order a subset
      (`website_slot_reviews`). Whether certifications, the pool, and **top
      reviews** later become per website and per ads (different sets per
      application) is **TBD**.
    - 2026-08-26: Certification definitions and selections are Details /
      business-profile tables (`certification_definitions`,
      `business_profile_certification_selections`), not
      `website_certification_*`. See [details
      ADR](../business-profile/details/ADR.md) 7.

17. **`generate_image` may attach pending-review on the unpublished canvas** —
    always a warning; owner approval makes it approved; website publication
    still requires approved media library items. Attach of an existing library
    photo is `update_slot`, not `generate_image`. (2026-08-20)
    - 2026-08-24: attach vs generate.
    - 2026-08-26: The warning is in Content when that image is selected, not
      copy on the website.

18. **Live GET is Cache then R2 only** — website publication prebuilds HTML into
    `sites/{website_prefix}/latest/`. A cache miss still reads R2. Missing
    object is 404, not a render from Postgres. Drop leftover `GET
    /v1/public/site/resolve` (it was the token website preview). Tests assert R2
    keys, not resolve. (2026-08-21)
    - 2026-08-25: token preview dropped.
    - 2026-09-03: live GET is that host’s tree
      (`sites/hosts/{hostname}/latest/`). The prefix tree is unpaid Preview
      website address / Website activation until the first owner publication on
      that preview host.

19. **R2 tree is keyed by the website prefix** — `tenants.website_prefix`,
    **reserved at 07** from `display_name`. A website address maps
    `sites/hosts/{hostname}` → that prefix. Owner-facing default host is
    `{website_prefix}.preview.placis.com` (wildcard on our zone). While
    unactivated, that host **is** the website preview (static `latest/` +
    website-activation strip island). After 09: **v2** on the same host without
    the strip; the site stays up (not empty). Empty host = no `latest/` yet. Do
    not advertise `{website_prefix}.placis.com`. One `latest/` tree; publication
    destinations share it (no Placis-host version vs custom-host version).
    (2026-08-21)
    - 2026-08-23: `.preview.placis.com`.
    - 2026-08-25: reserved at 07 + sales host.
    - 2026-08-27: **Per-host trees.** Each website address has its own R2 tree
      (`sites/hosts/{hostname}/latest/` and `…/{version_number}/`). Hosts can
      diverge. The **host row** is the Publish click (`website_address_id` on
      POST). Rollback and purge are per that host. Keep
      `sites/{website_prefix}/…` as the unactivated Preview website address /
      Website activation write until the first owner publication on that preview
      host.
    - 2026-09-03: prefix lives on `websites.website_prefix`, not `tenants`.
      Reserved when the `websites` row is inserted (ADR 27). R2 key is still
      that label. Locks and the live serve path match this: one `latest/` per
      host; leftover “one shared tree” is superseded.

20. **Website address uses Custom Hostnames, not Pages** — `POST
    /zones/{zone_id}/custom_hostnames` with TXT domain control. CMS **Connect
    website address** is a modal over the website editor, opened from **New
    URL** in the website publication dropdown. Owner copy on that control is
    **Publish**. Shows Host and Value as separate copyable fields, with
    on-screen how-to. Do not take over the contractor’s nameservers. Apex `A`
    records need Apex Proxying (later, Enterprise). (2026-08-21)
    - 2026-08-23: Connect modal.
    - 2026-08-27: Host/Value copy.

21. **Website publication destination is selectable** —
    `{website_prefix}.preview.placis.com`, each connected website address, or
    New URL (Connect website address). Not a Worker deploy. Owner copy is
    **Publish**. See [frontend.md](frontend.md). (2026-08-23)
    - 2026-08-26: owner copy Publish.
    - 2026-08-27: Publish is the **host row**, not a destination-less POST.
      `POST /publications` sends `website_address_id`. One tree per host.

22. **Top menu and footer trees live on one `website.menus` row** — `top_menu`
    and `footer` are closed jsonb trees (page / text / URL nodes, depth 2), plus
    `show_phone` / `show_email`. Look stays on site-wide website sections
    (`page_id` null). No `top_menu_items` / `footer_items` tables. The assistant
    uses `update_menus`, not `update_nav`. Where the owner edits the trees is in
    [design decision record](design-decision-record.md). (2026-08-23)
    - 2026-08-23: Also `show_contact` (bar CTA to the Contact website page).
    - 2026-09-03: **superseded by ADR 26** for uniqueness — one `website.menus`
      row per website, not per tenant. Tree shape is unchanged. Copy website
      template pages copies **site-wide** catalog `top_menu` / `footer` when the
      website template includes them (`url` nodes → `website_urls` rows). The
      [menu constant](catalog.md#menu-constant) is the page+text default when
      the template omits menus. Do not copy a top menu onto every website page.
      Owner `POST /v1/websites/{website_prefix}/editor/urls` and menus PATCH
      stay.

23. **Website publication requires an active subscription** — After they stop
    paying the subscription price, unpublish. `POST /publications` and live
    website rollback are **402** `subscription_canceled` until
    `subscription_status=active`. Not `usage_credit_exhausted`. CMS edit stays
    open. (2026-08-29)
    - 2026-09-03, later: unpublish and that **402** start after three calendar
      months of non-payment, or when an owner-scheduled cancel reaches period
      end — not on the first failed invoice. `UnpublishWebsite` walks **every**
      website for that tenant. [Billing](../billing/architecture.md).

24. **Unpublished GET/PATCH on the app for unactivated** — Onboarding session
    token or Clerk may GET unpublished website on the app origin (website
    preview). Signed-in unactivated Clerk **PATCH** on the app is allowed
    (Assistant apply). Onboarding session token must not PATCH. Preview website
    address `{website_prefix}.preview.placis.com` is Cache then R2 only: no
    website editor, no Assistant, no PATCH. Apex `preview.placis.com` is 404. 07
    HTML write is on-demand share, not wait-teaser landing. (2026-08-30)

25. **Website template select is occupancy + hash; styles ship with the website
    template** — 01 lists production-ready website templates only
    (`production_ready=true`). Among occupying tenants (paid, not in nonpayment
    ≥ 6 months) within 250 km (haversine on Maps listing lat/lng), pick the
    lowest-count production-ready id; tie-break `hash(tenant_id)`. No coords →
    hash over the production-ready set. Do not block 01 on ETL. Same-tenant
    retry reuses `website_settings`. `preset_id` is that website template’s
    associated website style catalog preset — not a second pick. New looks
    graduate another validated website template; do not hash the 7 presets. 02
    copies the catalog object ([catalog.md](catalog.md)). Predecessor LLM picker
    collapsed; this algorithm does not. (2026-08-31)
    - 2026-08-31: Occupancy **counts** every website’s `website_template_id`
      (ADR 30).
    - 2026-09-04: tie-break `hash(website_id)` so two websites of one tenant do
      not pick the same website template on a tie. Retry of the same website
      still reuses `website_settings`.
    - Previous: `hash(tenant_id)`.
    - 2026-09-04, later: tie-break `sorted[website_id % len]` (`website_id` as
      an integer). The uuid is already random; do not hash it. No coords: same
      modulo over the production-ready set. Previous that day:
      `hash(website_id)`.

26. **One business has N websites** — Parent is `websites.id` (`website_id`
    uuid). Website-owned uniques are on `website_id`, never on `tenant_id`
    alone. `tenant_id` stays on those rows for isolation only. Website styles
    (`website_settings`) and `website.menus` are one row **per website**.
    Business profile, Projects, reviews, media library, Ads, billing, Clerk
    organization, and the CMS Assistant thread stay tenant-scoped. Equal
    websites: no distinguished-website flag. `is_primary` hostname is per
    website. (2026-09-03)
    - 2026-09-04: Logo is Details `logo_media_asset_id` (tenant-shared). Whether
      a second website can have its own logo is **TBD**. Websites copy from the
      same business profile. SEO / copy duplication across a business’s websites
      is **TBD**.
    - 2026-09-04, later: Whether certifications and reviews (pool and **top
      reviews**) stay tenant-shared or ads / each website get their own set is
      **TBD**. v1 stays the Profile picker (16).

27. **Website prefix at insert; path key is prefix** — Reserve
    `websites.website_prefix` in the same transaction as the `websites` row
    (onboarding **Select and copy website template** and `POST /v1/websites`).
    Choose-rule unchanged (`{business-name}` plus optional area, then `-2` /
    `-3`). Never renamed. Globally unique. Owner URL
    `/cms/website/{website_prefix}`; nested CMS HTTP
    `/v1/websites/{website_prefix}/…`. Uuid stays internal (FKs, River,
    Assistant screen context). Preview website address / Website activation skip
    reserve if already set. (2026-09-03)
    - 2026-09-04: the same transaction inserts `website_addresses`
      `type=subdomain` for `{website_prefix}.preview.placis.com`. 08 / 09
      skip-if-set. HTML is written only to **this** prefix host and this
      website’s `type=custom` hosts — never another website’s internal Placis
      prefix.

28. **Onboarding website (Internal)** — The website with the earliest
    `websites.created_at` on that tenant. Bare `/cms/website` redirects there.
    That is not a picker. Website activation **PublishWebsite** uses this
    website only. Not a glossary term. (2026-09-03)

29. **River unique keys for copy jobs are `website_id`** — Pending/running
    `select_and_copy_website_template` and `website_copy_generation` unique on
    `website_id`. Copy-generation `ai.threads` is one thread per website
    (storage unique **TBD**). `cms_assistant` stays unique current per tenant.
    `website_activation` stays unique on `tenant_id`. (2026-09-03)
    - 2026-09-04: Copy-generation `ai.threads` follow the generate-factory rule:
      insert a uuid before the first generate for that website page’s agent;
      reuse that uuid only for schema-repair on that agent. Parallel website
      pages are parallel threads (`thread_kind=website_copy_generation`). Not
      one row per website. Do not add `website_id` on `ai.threads`. Uniques stay
      only on `cms_assistant` current and `onboarding_assistant` per
      `onboarding_session_id`. River unique stays `website_id`.
    - 2026-09-03: Previous: one copy-generation thread per website (storage
      unique TBD).

30. **Occupancy counts every website** — Select website template occupancy
    counts websites with that `website_template_id` among occupying tenants,
    including HTTP-created websites when that path exists. **HTTP create** is
    **deferred**
    - 2026-09-04: first contractors use onboarding’s one website. Everything
      about that flow is **TBD**:
      [new-website-creation-flow.md](new-website-creation-flow.md). Do not
      specify `website_template_id` on the wire this pass.
    - 2026-09-03: Previous: HTTP create does not run occupancy; the owner
      supplies `website_template_id`.

31. **Host resolves to a website** — Host → `website_addresses.hostname` or
    `{website_prefix}.preview.placis.com` → `websites` → `tenant_id`. Do not
    keep `tenants.website_prefix`. (2026-09-03)

32. **Optional-omit Common variables omit paint, not website sections** — Tokens
    stay on unpublished `website_slots`. Worker / canvas omit that website
    slot’s output when the website component
    `editable_slots[].omit_if_unresolved` lists Common variable names and every
    listed var is empty. Absent list = never omit (about copy that mentions
    `{{vat_number}}` stays). Pass `null` / omit the prop — not `""`, not
    leftover `{{vat_number}}`. Owner eye stays `website_sections.status`
    (`visible` / `hidden`) only. Do not persist a website slot hide; do not
    infer omit from every `{{…}}` in `value`. Empty VAT is not
    `required_slot_unresolved`. Live `latest/` updates on the next 04 Website
    publication (or unpaid 08 Share). No auto-`PublishWebsite` from Details
    PATCH. [variables.md](variables.md#optional-omit). (2026-09-04)

33. **Website editor canvas is not website editor workspace** — The canvas is
    only the painted unpublished page. Workspace is every editing control that
    is not that stage. Both the CMS website editor and the onboarding website
    editor (Website preview) have a workspace. Workspace is never a child of the
    canvas. Share and the page switcher may sit on canvas corners; they are
    still workspace. [frontend
    stack](../../general-architecture/frontend-stack.md). (2026-09-06)
