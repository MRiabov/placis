# 04 — Website publication (integration test)

Persists a website version and HTML. Integration storage is MinIO
(R2 in production). Callers are 08 (strip on), 09 (strip off), and
later CMS Publish.

- **Setup**: unpublished website from 02 (`website_pages` /
  `website_sections` / `website_slots` / `website.menus` /
  `website_forms`; `website_settings` from 01). Live
  `business_profile.business_profiles`. `media_assets` as needed for
  `media_asset_urls`. Optional 03 copy already in website slots. Record
  `website_slots.value` (still tokenized where required). For 08:
  onboarding session `preview_and_edit`,
  `websites.website_prefix` and `type=subdomain` already from 05,
  zero `website_publications`. For 09-after-08:
  v1 `active` `published_by=onboarding` already exists (strip on). For
  CMS: tenant `status=active`, an owner host `website_addresses` row.
- **Exercise**: the publication write (real Worker `websitePublication`;
  MinIO real; `purge_cache` faked). Call 08 strip on, 09 strip off, and CMS
  Publish as separate cases. Also: required missing var. Also: empty
  optional-omit `{{vat_number}}` (footer website slot
  `omit_if_unresolved`). Also: later Details `vat_number` fill without
  another 04, then a second 04. Also: later ETL reviews/projects without
  another 04. Also: 04 must not call `websiteRender`.
- **Verify** (Postgres + Worker + fakes):
  - `website_publications`: one new row, `tenant_id` matches,
    `version_number` incremented, `status=published`, `active=true`,
    `published_by=onboarding` (08/09) or `owner` (CMS),
    `website_address_id` set on 08/09 (preview host) and required on
    CMS, `published_at` set. Prior active onboarding row is
    `archived` / `active=false` when 09 writes v2 or 05-retry writes
    again.
  - `website_manifest` jsonb on that row is still **tokenized** (Go
    dump): website slots still contain `{{…}}`. HTML is not stored in
    this jsonb as the resolved website page.
  - `website_manifest.website_styles` copies `website_settings`
    (`preset_id` + bounded overrides).
  - Onboarding 08/09 rows are not website-rollback targets (list /
    GET by id refuses `published_by=onboarding`).
  - **Unpublished tree unchanged as HTML:** `website_slots.value`
    still tokens (Worker resolve did not write back). No new
    `website_pages`.
  - Go sent the tokenized dump + `WebsiteBusinessProfileRead` +
    `media_asset_urls`, `hostname` to `websitePublication` (not a live GET, not
    `websiteRender`). MinIO has `{version_number}/` then `latest/`
    under `sites/hosts/{hostname}/` for CMS Publish (unpaid Preview
    website address / Website activation still use
    `sites/{website_prefix}/` until that preview host’s first owner
    publication). Fake `purge_cache` includes live website page URLs,
    sitemap, robots, WebP on **that** host. Response has no website image
    render.
  - 08 strip on / 09 strip off / CMS Publish are the same write with
    the caller flag (strip present in 08 HTML, absent in 09/CMS).
  - Later ETL without 04: no new `website_publications` row;
    MinIO `latest/` objects unchanged.
  - Empty `vat_number` with footer `omit_if_unresolved`: HTML omits the
    VAT line (no leftover `{{vat_number}}`, no labeled empty row);
    unpublished `website_slots.value` still `{{vat_number}}`; no
    `required_slot_unresolved`. Later Details fill of `vat_number`
    without 04: canvas GET paints; MinIO `latest/` unchanged. Next 04
    HTML includes the VAT line.
  - Live GET of the host does not call Go.
  - `media_assets.review_status=approved` for `pending_review` items
    on that dump (`ApproveMediaAsset`).
- **Handoff**: live path is MinIO `latest/` + this
  `website_publications` row. Next owner Publish is another 04 on the
  same unpublished tree. Onboarding 09 after 08 archives v1 and writes
  v2 in this table.
- **Fail**: required missing var → no new `website_publications` row
  (or none `active`); previous `latest/` kept; unpublished website
  slots unchanged; empty optional-omit VAT is **not** this Fail;
  pre-write blockers are
  `WebsitePublicationBlockers` (editor `blockers[]` / throw),
  not a publication-issues table. Retry the same
  caller.
- **Mocked**: `purge_cache`. MinIO is real (Testcontainers). Not the
  Worker. No live Cloudflare.
