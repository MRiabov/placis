# 07 — Website preview

A **website preview** is the **preview website address** (`{website_prefix}` plus the suffix in
[cloudflare.md](../../website/cloudflare.md)) with static
HTML in R2 `latest/` and a website-activation strip. It is not the website editor. It is not
`/onboarding/preview` (that route is the wait teaser). There is no leftover token.

After website activation that same host is the **live website** — never call it website preview
then.

## Trigger

05 succeeded, and **website copy generation has finished or the wait cap elapsed** (named
constant, ~15s), whichever first. Do **not** start this write at T=0 in parallel with 06 — those
files would miss the copy the wait is for.

## Pre

Unpublished website from 05 exists. `tenant_id` is the unactivated tenant. Wait gate passed.

## Must not

- Run `astro build` (that is CI compile of the shared website component catalog, once per app
  deploy).
- Issue a leftover token / `website_previews` / `/preview/{token}/`.
- Wait for 06 past the cap.
- Let 06 supersede this website preview.
- Rename `website_prefix` after it is reserved.
- SSE the contractor host.
- Call this a third serve path of full website pages on `/onboarding/preview`.

## Do

1. **Reserve** `tenants.website_prefix` from `display_name` (`{{business_name}}` — Maps / public
   name, required at client interview complete). Not `legal_name`.
   - Lowercase; keep `[a-z0-9]`; hyphens for the rest; collapse/trim hyphens.
   - Cap length so a locality suffix and a later `-2` still fit a DNS label (63).
   - Collision: append locality once (`acme-roofing-dublin`) — Maps `locality`, else the first
     service area. Skip if that locality is already in the label. Still taken, or no locality:
     sequential `-2`, then `-3` on that result, not random.
   - Empty/too short: trade + locality, else `site-{id}`.
   - 05 retry: **keep** the existing label (same host). A new 01 confirm is a new unactivated
     tenant → new label.
2. Write `website_addresses` (`type=subdomain`, `status=reserved`, `is_primary=true`). Wildcard on
   **our** `placis.com` zone already points at the Worker. FQDN:
   [cloudflare.md](../../website/cloudflare.md).
3. Fold current unpublished rows into `website.v1` and write **`website_publications` v1**:
   `published_by=onboarding`, HTML **with** the website-activation strip (Clerk/Stripe island),
   `active`. Same write as CMS website publication ([cloudflare.md](../../website/cloudflare.md)):
   run the already-built website component catalog on the JSON, PUT `{version_number}/` then copy
   onto `latest/`,
   purge. Not per-request Astro. On 05 retry, archive the previous onboarding website version and
   write a new row on the same prefix (strip still on if unpaid).
4. Onboarding session → `previewing`. Empty details show as website placeholders.

`/onboarding/preview` shows the SSE website-section carousel until this write exists, then
**navigates**
to the host. Pay / website activation is on that host (08).

SSE is the onboarding session stream. The contractor host is not an SSE endpoint.

## Persist

`tenants.website_prefix`; `website_addresses`; `website_publications` (v1, strip on); R2
`latest/`. Onboarding session → `previewing`. No `website_previews`.

## Fail

Issue failure: onboarding session stays `applying_website_template` or
`apply_website_template_failed`; no `latest/`. Retry 05+07 (same `website_prefix` if already
reserved).

## Out

Anyone with the host URL can open the site and pay (08) while 06 may still run. Later 06
completion does **not** live-update the host.

## Invariants

- No token, no TTL, no 410-for-unknown-token.
- 06 does not supersede.
- `website_prefix` never renamed after this step.
- v1 is never a website-rollback target.
