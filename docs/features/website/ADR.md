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
   via governed tool calls (`update_slot`, `generate_image`), validated against contracts. Default
   is plan + Ask first (Apply / Reject, one-way). Instant apply still uses those tools; it
   does not write freeform JSON. `generate_image` is used only when no approved source fits.
   (2026-08-20; assistant configs + Apply/Reject terminal 2026-08-23; Ask first 2026-08-23)

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

12. **No unpublished snapshot per edit** — the fold is in-place `UPDATE` of unpublished rows.
    Website edit history (`edit_history`) is typed increments, like `business_profile_edits`,
    not a full unpublished website or website page jsonb dump. Last writer is only that log
    (no `edited_by` / `ai_generation_id` on live rows). Ctrl+Z / redo are in-memory; copy-out
    is the existing PATCH (`base_edit_history_head`). No `POST /undo` or `POST /redo`. Website
    versions are `website_publications` only. Do not bring back predecessor per-page version
    snapshots.
    Text PATCH on click-off (leave the field), not while typing. Discrete actions queue a
    PATCH immediately. The frontend safety timer paces sends (one in flight, 500ms min gap,
    coalesce) so `429` is a backstop, not the normal path. Do not audit every website slot
    edit. There is no Save action and no Saving / Saved indicator; edits persist on click-off.
    If a copy-out or upload has not succeeded after 10 seconds, show a visible error; the leave
    guard still applies because the change is uncopied. The
    in-memory website editor projection is the working copy; PATCH copies out. Do not replace
    it from the PATCH response. The PATCH body is dirty keys only, typically under 10 KB; reject
    over 64 KB. Never send the whole unpublished website or file bytes. Leaving while a
    copy-out or upload is in flight or has failed uses a discard confirm (`beforeunload` + in-app). Explicit
    actions remain website publication, Connect website address, and apply website styles.
    (2026-08-20; write budget 2026-08-23; no Save 2026-08-23; local-first PATCH 2026-08-23;
    click-off 2026-08-23; send timer + leave guard 2026-08-23; PATCH delta 64 KB 2026-08-23;
    no Saving indicator + 10s copy-out error 2026-08-23; website edit history 2026-08-23)

13. **Website styles live on `website_settings`** — one row per tenant, copied into the website
    manifest at website publication. Not per website page. (2026-08-20)

14. **Live website is the published website copy** — Details, Projects, certifications and reviews, and
    website styles update the website editor immediately and need website publication to change what
    website visitors see. (2026-08-20)

15. **The contractor website is `apps/contractor-website`** — never the predecessor package
    name. The website component package is keep-and-cut; the Worker is write-thin against
    this serve path (live GET never calls Go). Remaining live-site work is R2 `latest/`,
    website publication HTML, Custom Hostnames, and Connect website address. Website
    publication is not a Cloudflare deploy. Website preview is the only per-request render.
    Custom website address uses Custom Hostnames, not Pages. See
    [cloudflare.md](cloudflare.md), [contractor-website-debloat.md](contractor-website-debloat.md),
    [port-contractor-website.md](port-contractor-website.md), and ADR 18–20.
    (2026-08-20; edge locked 2026-08-21; imported 2026-08-23; Worker write-thin 2026-08-23)

16. **Certifications and reviews are one Profile screen** — `/cms/certifications-and-reviews`.
    Global `website_certification_definitions`; tenant selections. Reviews stay
    `business_profile_reviews`. No `/cms/proof`. (2026-08-20)

17. **`generate_image` may attach pending-review on the unpublished canvas** — always a warning;
    owner approval makes it approved; website publication still requires approved media assets.
    (2026-08-20)

18. **Live GET is Cache then R2 only** — website publication prebuilds HTML into
    `sites/{website_address}/latest/`. A cache miss still reads R2. Missing object is 404, not a
    render from Postgres. `GET /api/v1/public/site/resolve` is website preview (and tests) only.
    (2026-08-21)

19. **R2 tree is keyed by the website address** — `tenants.website_address`, fixed at
    website activation. Custom website address maps `sites/hosts/{hostname}` → that label.
    Owner-facing default live host is `{website_address}.preview.placis.com` (wildcard on our
    zone). Do not advertise `{website_address}.placis.com`. One `latest/` tree; publication
    destinations share it (no Placis-host version vs custom-host version).
    (2026-08-21; `.preview.placis.com` 2026-08-23)

20. **Custom website address uses Custom Hostnames, not Pages** —
    `POST /zones/{zone_id}/custom_hostnames` with TXT domain control. CMS **Connect website
    address** is a modal over the website editor, opened from **New URL** in the website publication
    dropdown. Shows records to paste. Do not take over the contractor’s nameservers. Apex `A`
    records need Apex Proxying (later, Enterprise).
    (2026-08-21; Connect modal 2026-08-23)

21. **Website publication is a destination dropdown** — `{website_address}.preview.placis.com`,
    each connected custom website address, or New URL (Connect website address). Not a Worker
    deploy. See [frontend.md](frontend.md).
    (2026-08-23)
