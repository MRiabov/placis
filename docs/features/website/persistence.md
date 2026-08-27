# Website — persistence

Website pages, website sections, website slots, website forms, top menu, footer, website
publications (each row is a website version), website settings, website edit history,
and live hostnames (`website_addresses`).
Conventions: [persistence conventions](../../general-architecture/persistence.md)
(Postgres schema `website`).

Media assets are owned by [media library](../other/media/persistence.md). The business profile the
website templates fill is [details](../business-profile/details/persistence.md) (including reviews and
certifications). Projects: [projects](../business-profile/projects/persistence.md). Website forms write [leads](../other/leads/persistence.md). The dump shape of
a website publication is
[manifest.md](manifest.md). The reserved label on the tenant row is
[auth](../other/auth/persistence.md) (`tenants.website_prefix`).

- `website_addresses` — `id`, `tenant_id` fk, `hostname` unique, `type` (`subdomain`/`custom`),
  `status` (`reserved`/`pending`/`active`/`failed`), `is_primary` bool,
  `cloudflare_custom_hostname_id` (nullable, `type=custom`), `dcv_txt_name`, `dcv_txt_value`,
  `cloudflare_hostname_status`, `cloudflare_ssl_status`, `dns_verified_at`, `activated_at`,
  `created_at`.
  `type=subdomain` is the preview website address (`{website_prefix}.preview.placis.com`; R2 prefix
  is `tenants.website_prefix`). Reserved at onboarding 07. Show it as the default host (website
  preview until website activation; live website after).
  `type=custom` is the website address (the hostname they supply). `is_primary` marks
  sitemap and canonical: the subdomain host until a `type=custom` row is `active`, then that
  website address. Custom Hostnames columns are written by **Connect website address**
  (modal over the website editor), not website publication. See [cloudflare.md](cloudflare.md).
- `website_pages` — `id`, `tenant_id` fk, `path`, `title`, `page_type` (`home`/`service`/
  `contact`/`legal`), `status` (`unpublished`/`archived`), `seo_title`,
  `seo_description`, `seo_og_title`, `seo_og_description`, `seo_canonical_url`, `seo_noindex`,
  `seo_primary_keyword`, timestamps; unique `(tenant_id, path)`
- `website_sections` — `id`, `tenant_id` fk, `page_id` nullable fk, `component_id`,
  `component_version`, `position`, `status` (`visible`/`hidden`), `props` jsonb, `design` jsonb,
  `origin` (`website_template`/`website_copy_generation`/`owner`/`business_research`).
  `page_id` set: a block on that website page; unique `(page_id, position)`. `page_id` null: the
  site-wide top-menu or footer **look** section (logo, marketing phone, design). At most one
  top-menu look section and one footer look section per tenant. Structure of the bars is not
  here — it is `website.menus`.
- `website_slots` — `id`, `tenant_id` fk, `section_id` fk, `slot_key`, `slot_type` (`text`/
  `rich_text`/`image`/`link`/`list`/`json`), `value` jsonb, `status` (`unpublished`/`reviewed`/
  `approved`/`rejected`),
  `origin` (`website_template`/`website_copy_generation`/`owner`/`business_research`),
  `validation_errors` `text[]`; unique `(section_id, slot_key)`
- `website_forms` — `id`, `tenant_id` fk, `form_key`, `title`, `status` (`active`/`disabled`),
  `submit_action` (`create_website_lead`), `privacy_notice`; unique `(tenant_id, form_key)`
- `website_form_fields` — `id`, `tenant_id` fk, `form_id` fk, `position`, `field_key`,
  `field_type` (`text`/`textarea`/`email`/`marketing_phone`/`address`/`select`/`date`/`checkbox`),
  `label`, `required`, `placeholder`; unique `(form_id, field_key)`
- `website_form_field_options` — `id`, `field_id` fk, `position`, `label`, `value`
- `menus` — qualified `website.menus`. One row per tenant (`tenant_id` unique). `top_menu` jsonb
  and `footer` jsonb (closed trees, extra keys rejected), `show_phone` bool, `show_email` bool,
  `show_contact` bool,
  timestamps. Hide = omit from the tree. Bar CTA **values** are always
  `{{marketing_phone}}` / `{{marketing_email}}` ([variables.md](variables.md)); these flags are
  visibility only. Trees and flags are jsonb/bools on this row, not item tables. Node structs
  below.
- `website_settings` — `id`, `tenant_id` fk unique, `preset_id`, bounded website-style overrides
  (`primary`, `neutral`, `accent`, `radius`, `density`), `edit_history_head` uuid nullable
  (last copied-out `edit_history.batch_id`; not a server undo cursor), timestamps. One row
  per tenant. Copied into `website_manifest.website_styles` at website publication.
- `website_publications` — one row is a website version: `id`, `tenant_id` fk, `version_number`,
  `status` (`published`/`archived`/`rolled_back`), `active`, `manifest_version`,
  `website_manifest` jsonb, `published_by` (`onboarding`/`owner`),
  `rollback_of_publication_id` nullable, `published_at`; unique `(tenant_id, version_number)`.
  Website rollback lists and reactivates `published_by=owner` only. Onboarding 07/08 (and 05-retry)
  rows stay out of that list; the API refuses them by id.
- `website_publication_issues` — `id`, `publication_id` fk, `code`, `message`, `entity_type`
  nullable, `entity_id` nullable
- `website_slot_reviews` — `id`, `tenant_id` fk, `slot_id` fk, `business_profile_review_id` fk,
  `position`; unique `(slot_id, business_profile_review_id)`. One ordered array **per reviews
  website section**, from the pool, length ≤ that website component’s max (some layouts take
  3, others 6 or 8). The LLM fills it after the website template (and the website assistant
  / Content can rewrite it). Pinning **top reviews** does **not** rewrite these rows. Archive
  of a review drops that id from every section array, then compact. Empty array: keep the
  website section. Live website waits for the next website publication.
- `edit_history` — Website edit history. Append-only typed increments, same pattern as
  `business_profile_edits`. Never a full website page or unpublished-website jsonb dump. One
  row is one field or structure change (a slot value, a section reorder, an SEO column, a
  form field, a website styles preset, create/remove a section). Slot `before` / `after` as
  jsonb is allowed because it is **one** slot, same as the live `value` column.

  `id`, `tenant_id` fk, `batch_id` uuid (one successful copy-out), `edited_by` (`human`/
  `agent`), `ai_generation_id` nullable fk (`ai_generations`; set when `edited_by=agent`),
  `entity_type` (`website_page`/`website_section`/`website_slot`/`website_form`/
  `website_form_field`/`website_settings`/`website_menus`), `entity_id` uuid,
  `field` nullable (column or `slot_key`), `op` (`set`/`clear`/`add`/`remove`/`update`),
  `before` jsonb nullable, `after` jsonb nullable, `created_at`.

  **Batch** = one successful copy-out (not a server undo step): owner PATCH (click-off or
  coalesced discrete actions) = one `batch_id`; website assistant **Ask first Apply** =
  one `batch_id` for the whole Apply; **instant apply** = one validated tool = one
  `batch_id`. Pending Ask first edits are not in this table. Reject never writes a row.

  Last writer lives **only** here. Live unpublished rows have no `edited_by` /
  `ai_generation_id`. `origin` on sections/slots stays (first source, not last writer).

  Keep the last **200** batches per tenant; prune older. Do not write `audit_events` per
  slot. The editor hydrates an in-memory undo stack from this table
  ([editing.md](editing.md)). The database does not perform undo.

Reviews on the website are these rows, not a jsonb dump in `website_slots.value`. The text
lives on [business_profile_reviews](../business-profile/details/persistence.md) (the **review citation** is what the
website paints; fallback `body` if the review citation is empty). A project gallery is a
`json` / `list` website slot of project ids, not a `slot_type`.

`props`, `design`, and slot `value` stay jsonb: each website component / slot has its own
catalog-shaped dump. `menus.top_menu` / `menus.footer` are jsonb because they are closed typed
trees (extra keys rejected), same idea as `website_manifest` — not because the tree is
polymorphic. Website editor writes are in-place `UPDATE`s of those columns, on
click-off for text and rate-limited — [editing.md](editing.md). Last writer is
`edit_history` only ([assistant.md](assistant.md)). `origin` is first source, not last
writer. `website_manifest` is jsonb because it is a published website copy
(see [manifest.md](manifest.md)), not because the tree is polymorphic.

## `website.menus` trees

Each of `top_menu` and `footer` is a JSON array of nodes. Depth **2**: bar + one dropdown. No
groups inside groups. Closed keys only.

Every node has `id`, derived from its **label** (page node: website page title; text/URL node:
the `label` field). Same rules as a website page path: lowercase, hyphenate, strip junk,
length-bounded. Unique in that tree; collision → `-2`, `-3`. On label/title change, recompute
`id`. Tools match by this `id`, never by UUID. Never say slug.

Kinds:

- `page` — `page_id` (uuid). Clickable; path from the website page. May have `children`. Optional
  display `label` if the bar text should differ from the page title (default: page title).
  Assistant I/O uses `path`; storage uses `page_id`. Each `page_id` at most once per tree.
- `text` — `label` (length-bounded), `children` (may be empty in the editor; publication may omit
  empty groups). Heading only, not a link. Parent only.
- `url` — `label`, `href`. Leaf only. Schemes: `https`, `http`, `mailto`, `tel`. Reject
  `javascript:` and unbounded hrefs.

Clickable vs heading is `kind`, not a reorder flag. `reorder` sends nested `id` / `children`
only. Heading → link is remove + add.

Caps: **8** top-level nodes on the top menu, **12** on the footer (a 9th top-level node is
`409`). **8** children per parent. Hide = not in the tree.

On **create page**: append `{ id, kind: page, page_id }` as a top-level footer node (if under
cap); same on the top menu unless `legal` or cap (then omit). On **archive/delete page**: strip
that node; drop empty text groups. Duplicate page in a tree is `400`.

Human PATCH may replace a whole tree (including a wipe). Assistant `remove_entries` max 4.

There is no unpublished snapshot per edit and no per-page version table. The unpublished website is
in-place `UPDATE`. Website edit history is typed increments, like `business_profile_edits`.

## Indexes

Unique: `website_addresses.hostname`, at most one `is_primary=true` per `tenant_id`;
`(tenant_id, website_pages.path)`, `(tenant_id, website_forms.form_key)`,
`(tenant_id, website_publications.version_number)`, `website_settings.tenant_id`,
`menus.tenant_id`. Lookup:
`(tenant_id, status, created_at)` on website pages; `(tenant_id, created_at desc)` and
`(tenant_id, batch_id)` on `edit_history`.
