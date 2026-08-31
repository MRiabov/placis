# 08 — Preview website address (integration test)

Reserves the prefix and calls website 04 (strip on). Next step is 09
(optional; archives this v1).

- **Setup**: unpublished website from 05 (website 02). Wait-end already
  navigated to `/onboarding/preview-and-edit/` (home website page copy
  done or wait cap). Do
  **not** require 06 to have finished. Record tokenized
  `website_slots.value`. `tenants.website_prefix` null. Zero
  `website_publications`.
- **Invoke**: `POST /v1/onboarding-sessions/{id}/preview-website-address`.
  Also: 05 retry after a first share; also: collision on
  `display_name`; also: wait-end without this POST.
- **Assert** (Postgres):
  - `tenants.website_prefix` set (collision: locality once, then
    sequential `-2`, `-3`).
  - `website_addresses`: one `type=subdomain`, `status=reserved`,
    `is_primary=true`, `tenant_id` matches, hostname uses that prefix.
  - `website_publications`: `version_number=1`,
    `published_by=onboarding`, `status=published`, `active=true`,
    `website_address_id` = that subdomain row, `website_manifest`
    still tokenized (`{{…}}` in website slots), `website_styles` from
    `website_settings`. Not a rollback target.
  - Unpublished `website_slots.value` **unchanged** (Worker did not
    write HTML back).
  - `onboarding_sessions.status=preview_and_edit`. No `website_previews` /
    `token_hash` table/row.
  - 05 retry: same `website_prefix`; prior publication `archived` /
    `active=false`; new onboarding publication `active` on that
    prefix (strip still on if unpaid).
  - 06 in flight does not insert another `website_publications` row
    and does not change fake `latest/`.
  - Wait-end without this POST: still null `website_prefix`, zero
    `website_publications`.
  - **Spy:** fake R2 `latest/` objects; fake `purge_cache` for website
    page URLs / sitemap / robots / WebP; GET of host HTML includes the
    website-activation island (strip on).
- **Handoff to 09**: 09 Pre can SELECT this `active`
  `published_by=onboarding` row and `tenants.website_prefix`. Pay
  writes v2 via website 04 (strip off) and archives this v1.
- **Fail**: website 04 required missing var → no new
  `website_publications`; `website_prefix` may already be reserved
  (keep it); unpublished tree unchanged; retry the same POST.
- **Mocked**: Worker internal render, R2, `purge_cache` (website 04).
  No live Cloudflare.
