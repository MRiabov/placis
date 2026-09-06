# Sep 3 issue list — Website

Issue audit from 2026-09-03, not a drop list. Not canonical. Line
numbers are as of that audit. Fix the cited issue, then delete the
item. Delete this file when empty. Bold numbers are original audit ids
(not compacted).

Each row’s **Action** is the auditor’s first guess, not the product
decision. Resolve by keeping and aligning, filling a missing writer or
DTO, amending the older sentence, or dropping — only when a drop is
confirmed. Later dated [ADR](ADR.md) / [design
decision](design-decision-record.md) is source of truth when this list
contradicts them. Unused in the first catalog or Copy website template
pages is not a drop.

**Specified** is what canonical docs say today. **Tension** is why a
judgment is still open. **Decide** is the closed choice. Remaining
**Action** lines stay as audit suggestions until resolved.

## Medium

- **14. `edit_history` as a cross-reload undo store**
  Issue: over-specified. Action: keep `edit_history_head`; drop
  `include_edit_history`, the `before`/`after` HTTP union, and seeded
  Ctrl+Z stacks.
  Where: [editing.md](editing.md) (open hydrate / undo);
  [api.md](api.md) `WebsiteEditorGet`.

  Specified: [ADR](ADR.md) 12 — unpublished rows update in place.
  `edit_history` is typed increments (not a full page dump). Ctrl+Z /
  redo are in-memory; copy-out is the ordinary PATCH with
  `base_edit_history_head`. No `POST /undo`. Conflict is `409
  edit_history_conflict`. PATCH ack is `{ edit_history_head, batch_id }`
  (plus page `blockers[]`), not the log.

  [editing.md](editing.md) also seeds those RAM stacks on open / full
  reload / after `409`: `GET …/pages/{page_id}?include_edit_history=true`
  returns last **200** batches per website (`edit_history[]` with
  `before` / `after` jsonb). Switching page does not re-download the
  log. ADR 12’s “in-memory” sentence does not mention that seed.

  Tension: the table + head + `409` are the last-writer lock. The open
  cut is whether Ctrl+Z after reload walks those 200 batches (needs the
  query and `before`/`after` on HTTP) or only this tab’s RAM (drop the
  query; keep the table).

  Decide: (a) keep `include_edit_history` + seed stacks from last 200
  batches, or (b) drop that query and the HTTP log union; Ctrl+Z after
  reload only undoes this tab. Do not drop `edit_history` or
  `edit_history_head`.

- **15. `website_publications.rollback_of_publication_id`**
  Issue: persistence. Action: drop.
  Where: [persistence.md](persistence.md) `website_publications`;
  [api.md](api.md) `WebsitePublicationRead`.

  Specified: each publish writes a `website_publications` row (a
  website version). Rollback POST copies an earlier **owner** row onto
  that host `latest/`; it does not rewrite unpublished rows. Onboarding
  rows (`published_by=onboarding`) are never rollback targets.
  `WebsitePublicationRead` is `version_number`, `status`, `active`,
  `published_by`, `website_address_id`, `published_at` — no rollback
  pointer. [ADR](ADR.md) 7 does not name this column. Persistence still
  lists `rollback_of_publication_id` nullable. **Written by** includes
  rollback POST, but Notes never say that POST writes the FK.

  Tension: unused-spec vs a useful audit pointer (“this row was created
  by rolling back to version N”). Absence from the DTO is not a drop by
  itself.

  Decide: (a) drop the column, or (b) keep it and name rollback POST as
  the writer (still omit from `WebsitePublicationRead` unless you also
  want it on HTTP).

- **16. `website_addresses` timestamps / stored `is_primary`**
  Issue: persistence. Action: drop `dns_verified_at` and
  `activated_at`; derive the canonical host instead of storing
  `is_primary`.
  Where: [persistence.md](persistence.md) `website_addresses`;
  [cloudflare.md](cloudflare.md); [design decision
  record](design-decision-record.md) 19.

  Specified: each website has a preview host (`type=subdomain`) and may
  add `type=custom`. Row `status` is `reserved` / `pending` / `active` /
  `failed`. Owner copy on Connect is waiting for DNS → waiting for
  certificate → active. Sitemap and canonical use the hostname with
  `is_primary=true` (preview until a custom host on that website is
  `active`). [ADR](ADR.md) 26: `is_primary` is per website. Columns
  also include `dns_verified_at` and `activated_at`. No named writer
  sets those two timestamps; Connect poll is `status` plus Cloudflare
  columns.

  Tension: `is_primary` is a real sitemap/canonical flag, not leftover.
  The two timestamps sit next to `status` with no writer. Deriving
  “which host is canonical” from “custom `active` else preview” would
  replace the flag — that fights the cloudflare write.

  Decide: keep `is_primary`. Then (a) drop `dns_verified_at` and
  `activated_at`, or (b) keep them and name the Connect poll as writer
  (when `status` becomes `active`, or on DNS vs cert separately).

- **18. `WebsitePageUpdate.review_ids`**
  Issue: DTO. Action: carry `review_ids` on the website section, not
  the website page.
  Where: [api.md](api.md) `WebsitePageUpdate` vs
  `WebsiteSectionRead`; [assistant.md](assistant.md) `update_reviews`.

  Specified: [ADR](ADR.md) 16 — each **reviews website section** has
  its own ordered `website_slot_reviews`. Content / `update_reviews`
  rewrite **that** section only (`section_id` + `review_ids[]`). A
  service page can differ from Home. Empty `[]` keeps the section.
  Copy-pages does not insert those rows. 03 must not call the tool.

  HTTP today: `review_ids` is on `WebsitePageUpdate` (the page PATCH
  body). `WebsiteSectionRead` has no `review_ids`. Overflow: over the
  website component max is `400`. A page-level array cannot say which
  reviews section on that page it applies to when there are two.

  Tension: the persistence unit is the section; the dirty PATCH field
  is on the page. That is a real DTO bug, not unused-spec. (A later PR
  may also name singleton look sections; that is not this item.)

  Decide: move `review_ids` onto the website section (`WebsiteSectionRead`
  / that section’s dirty keys). Do not keep a page-level list.

- **19. Projects tools on the website editor assistant**
  Issue: functionality. Action: drop; keep inline AI assistance on
  Projects.
  Where: [assistant.md](assistant.md) (`create_project`,
  `set_project_title`, `set_project_cover`,
  `patch_project_description`, `archive_project`, `unarchive_project`).

  Specified: [Projects ADR 4](../business-profile/projects/ADR.md) —
  owner action = assistant action. Those six tools are on the **website
  editor** registry and call the same Projects HTTP as `/cms/projects`.
  Writing on `/cms/projects/{id}` is **inline AI assistance** (orbs),
  not Voice and not the website overlay. Website ADR 6 does not forbid
  them. Website Content’s gallery pick is which **active** projects
  appear on a section; it is not the Projects write surface.

  Tension: the auditor saw Projects tools on a website assistant and
  guessed “wrong screen.” The product decision already split write
  (website overlay + `/cms/projects` HTTP) from gallery pick (Content).

  Decide: (a) keep the tools (close this item), or (b) remove them from
  the website overlay and leave Projects writes to `/cms/projects`
  inline AI assistance only. (b) would amend Projects ADR 4.

- **20. `update_form` tool**
  Issue: functionality. Action: drop if website forms stay a fixed
  lead website form.
  Where: [assistant.md](assistant.md) `update_form`.

  Specified: [ADR](ADR.md) 6 — assistant is another caller of the same
  website-editor PATCH. Design decision 12 keeps website-form Content
  (title, typed fields, privacy notice). [ADR](ADR.md) 35 — first-pass
  forms are the four website-lead columns; `update_form` **stays**.
  The tool is `website_form_id` + optional `title` / `fields[]` /
  `privacy_notice` (no `submit_action`).

  Tension: a fixed lead form still has owner-editable title, labels,
  and privacy notice. Dropping the tool would leave Content PATCH with
  no assistant caller, which fights ADR 6.

  Decide: keep `update_form` (close this item). Later free/expanded
  forms do not require dropping it now.

- **21. Common variable list + “every variable must appear” CI gate**
  Issue: functionality. Action: cut to variables a website component
  actually paints; relax the CI gate.
  Where: [variables.md](variables.md) Common variables;
  [catalog.md](catalog.md) production-ready CI.

  Specified: `WebsiteBusinessProfileRead` is the Common variables
  struct (ADR 6). Tokens stay until the Worker resolves them (ADR 5).
  Catalog CI: a `production_ready` website template **fails** unless
  every Common variable appears at least once (`{{reviews.1}}` counts
  as `{{reviews.N}}`; `{{images.*}}` counts as an `{{images.` token).
  Gate is off against predecessor per-page JSON until a real template
  index exists.

  Two lists mixed in one audit row. Cutting Common keys because the
  first templates do not paint them yet is the same false alarm as
  unused-in-catalog (ADR 5/6). `{{address}}` already resolves from
  `registered_office`. Remaining unbacked-looking keys on the Common
  table: `{{services.marquee}}`, `{{services.project_types}}`,
  `{{projects.categories}}`, `{{about.feature_paragraphs}}` — they are
  still named resolve fields.

  Tension: the **CI gate** is a real catalog cost. A production-ready
  template must mention every Common token, including legal/optional-omit
  ones, even if a given layout has no labeled VAT line.

  Decide, separately: (1) keep the Common list as the resolve struct
  (do not cut for “templates don’t paint yet”). (2) production-ready CI
  (a) keep “every Common variable once”, or (b) relax to expected pages
  and look sections only (tokens the layout actually has).

- **22. `origin=business_research` on sections/slots** Issue: persistence.
  Action: drop that enum value; make `origin` server-set if kept. Where:
  [persistence.md](persistence.md) `website_sections` / `website_slots`.

  Specified: `origin` on sections and slots is `website_template` /
  `website_copy_generation` / `owner` / `business_research`. Copy website
  template pages writes `website_template`. 03 writes `website_copy_generation`
  on the slots it fills. Owner PATCH writes `owner`. No **Written by** names a
  `business_research` writer. [ADR](ADR.md) 5: later business research does not rewrite
  live `latest/` until the next 04. It does not say business research may not
  mark unpublished rows.

  Tension: unused enum value today vs a reserved origin for a later unpublished
  rewrite (so 04 can tell template / copy / owner / `business_research` apart).
  PATCH must not let the owner set `origin` (server-set) if the column stays.

  Decide: (a) keep `business_research` and add “server-set; no writer this
  pass”, or (b) drop it until a named writer for `origin=business_research`
  exists. Do not drop `origin` entirely because 02 only writes
  `website_template`.

- **23. `websiteRender` as a second Worker contract + per-slot screenshot**
  Issue: over-specified. Action: same `website.v1` dump as publication;
  consider cutting per-`update_slot` render from the first cut.
  Where: [api.md](api.md) `WebsiteRenderRequest`;
  [03](pipeline/03-website-copy-generation.md).

  Specified: [ADR](ADR.md) 6 and 15 — two Worker ops. 03
  `POST`s `websiteRender` (website **image** render, no R2) on turn 1
  (batch of pages) and **after each** `update_slot`. Tool result is
  `before_image` / `after_image`. 04 `POST`s `websitePublication`
  (HTML to R2). Live GET is Cache then R2 and never calls Go. Must not:
  a model-invoked screenshot tool; persist a render onto slots;
  `websiteRender` from 04.

  Tension: two contracts are intentional (picture vs HTML). The cost
  question is whether first-cut 03 really `websiteRender`s after every
  `update_slot` (SLO table on 03) or only on turn 1. Unifying the ops
  would drop the picture the copy-generation model looks at.

  Decide: (a) keep both ops and per-`update_slot` render (close this
  item), or (b) keep both ops but first-cut 03 only turn-1
  `websiteRender` (amend ADR 6 / 03). Do not merge into one Worker op.

- **24. Cloudflare passthrough on `WebsiteAddressRead`**
  Issue: DTO. Action: one derived `status`; drop
  `cloudflare_hostname_status` / `cloudflare_ssl_status`.
  Where: [api.md](api.md) `WebsiteAddressRead`;
  [design decision record](design-decision-record.md) 19;
  [ADR](ADR.md) 20.

  Specified: owner copy is derived `status` (waiting for DNS → waiting
  for certificate → active). Connect poll GETs
  `WebsiteAddressRead`: `hostname`, `type`, `status`, `dcv_txt_name`,
  `dcv_txt_value`, **and** `cloudflare_hostname_status` /
  `cloudflare_ssl_status`. Persistence stores those Cloudflare columns
  for Custom Hostnames poll. DNS Host/Value stay copyable; nameservers
  stay with the registrar.

  Tension: unused-in-catalog is the wrong reason to drop. The HTTP
  question is whether the browser needs the raw Cloudflare enums or
  only the derived `status` (server still polls Cloudflare into the
  row).

  Decide: (a) keep passthrough on the DTO, or (b) DTO is derived
  `status` + copyable DNS rows only; Cloudflare statuses stay on the
  row, not HTTP.

- **25. Stale “07” for prefix reservation / first HTML write**
  Issue: contradiction. Action: Preview website address share, or
  Website activation if they never shared, everywhere.
  Where: [cloudflare.md](cloudflare.md); [ADR](ADR.md) 19, 24 vs
  [persistence.md](persistence.md) / [ADR](ADR.md) 27.

  Specified (decided names): `websites.website_prefix` is reserved in
  the same transaction as the `websites` row (Select and copy website
  template, and `POST /v1/websites`). First HTML on that host is
  **Preview website address** share (08, strip on) or **Website
  activation** if they never shared (09, strip off). Live GET is Cache
  then R2. [ADR](ADR.md) 19 still says “reserved at **07** from
  `display_name`”. ADR 24 still says “07 HTML write is on-demand
  share”. Persistence / ADR 27 already use the decided names.

  Tension: leftover pipeline-number prose, not a third reservation
  step. Product behavior is already the later ADRs.

  Decide: amend ADR 19 / 24 (and any cloudflare leftover “07”) to the
  decided names. Do not add a new reserve step. No behavior change.

- **26. `published_by` on HTTP so the browser can hide onboarding rows**
  Issue: DTO. Action: filter server-side; drop `published_by` from the
  DTO; cap the publications list.
  Where: [api.md](api.md)
  `GET /v1/websites/{website_prefix}/publications`.

  Specified: [ADR](ADR.md) 7 — `published_by` is `onboarding` /
  `owner` on the **row**. Onboarding-written versions are never
  rollback targets (`409` on that id). `WebsitePublicationRead`
  includes `published_by`. List GET behavior: “Omit onboarding rows in
  rollback UI” — UI wording, not clearly “HTTP omits those rows”. No
  cap on the list.

  Tension: the column stays (rollback eligibility). HTTP can (a) omit
  onboarding rows so the browser never sees them, (b) return them with
  `published_by` so the UI hides rollback, or (c) both cap and filter.
  Exposing `published_by` is not unused-spec; it is whether the list is
  already filtered.

  Decide: keep the column. Then HTTP list is (a) owner rows only, omit
  `published_by` from the DTO, or (b) keep `published_by` and return
  onboarding rows too (UI hides rollback). Also pick a list cap or
  leave unbounded this pass.

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
