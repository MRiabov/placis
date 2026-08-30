# 08 — Preview website address

Optional. A **share** from `/onboarding/preview-and-edit/` writes the
**preview website address** (`{website_prefix}` plus the suffix in
[cloudflare.md](../../website/cloudflare.md)) with static HTML in R2 `latest/`
and a website-activation strip. It is not the website editor. It is not
contractor copy improvement ([07](07-contractor-copy-improvement.md)). It is
not `/onboarding/preview` (that route is the wait teaser). There is no leftover
token.

After website activation that same host is the **live website** — never call it
website preview then.

Wait-end does **not** run this write. The wait teaser navigates to
`/onboarding/preview-and-edit/`.

## Trigger

Owner (or signed-out contractor with the onboarding session) taps **Share** on
the website preview. Safe to retry: sharing again rewrites `latest/` from
current unpublished rows (strip still on if unpaid).

## Pre

Unpublished website from 05 exists. `tenant_id` is the unactivated tenant.
Onboarding session is `previewing` (wait-end already happened) or still
`applying_website_template` if they share during the wait (allowed; rare).

## Must not

- Run `astro build` (that is CI compile of the shared website component catalog,
  once per app deploy).
- Issue a leftover token / `website_previews` / `/preview/{token}/`.
- Auto-run at wait-end.
- Let 06 supersede this write (later 06 does not live-update R2).
- Rename `website_prefix` after it is reserved.
- SSE the contractor host.
- Call this a third serve path of full website pages on `/onboarding/preview`.
- Require website activation.

## Do

1. **Reserve** `tenants.website_prefix` from `display_name` (`{{business_name}}`
   — Maps / public name, required at client interview complete). Not
   `legal_name`. Skip reserve if already set.
   - Lowercase; keep `[a-z0-9]`; hyphens for the rest; collapse/trim hyphens.
   - Cap length so a locality suffix and a later `-2` still fit a DNS label
     (63).
   - Collision: append locality once (`acme-roofing-dublin`) — Maps `locality`,
     else the first service area. Skip if that locality is already in the label.
     Still taken, or no locality: sequential `-2`, then `-3` on that result, not
     random.
   - Empty/too short: trade + locality, else `site-{id}`.
   - 05 retry: **keep** the existing label (same host). A new 01 business lookup
     is a new unactivated tenant → new label.
2. Write `website_addresses` (`type=subdomain`, `status=reserved`,
   `is_primary=true`) if missing. Wildcard on **our** `placis.com` zone already
   points at the Worker. FQDN: [cloudflare.md](../../website/cloudflare.md).
3. Build `website.v1` from current unpublished rows and insert
   **`website_publications` v1**: `published_by=onboarding`, HTML **with** the
   website-activation strip (Clerk/Stripe island, sticky to the bottom of the
   viewport while the website scrolls; Placis orb lockup on the strip),
   `active`. Same write as CMS website publication
   ([cloudflare.md](../../website/cloudflare.md)): run the already-built website
   component catalog on the JSON, PUT `{version_number}/` then copy onto
   `latest/`, purge. Not per-request Astro. On 05 retry, archive the previous
   onboarding website version and write a new row on the same prefix (strip
   still on if unpaid).
4. Onboarding session stays `previewing` (or becomes `previewing` if they
   shared during the wait). Empty details show as website placeholders.

HTTP: `POST /v1/onboarding-sessions/{id}/preview-website-address`
([api.md](../api.md)). Auth: onboarding session token or Clerk unactivated.

SSE is the onboarding session stream. The contractor host is not an SSE
endpoint.

## Persist

`tenants.website_prefix`; `website_addresses`; `website_publications` (v1, strip
on); R2 `latest/`. No `website_previews`.

## Fail

Issue failure: no `latest/` (or previous `latest/` kept). Retry the share (same
`website_prefix` if already reserved).

## Out

Anyone with the host URL can open the site and pay (09) while 06 may still run.
Later 06 completion and Assistant PATCHes do **not** live-update the host until
they share again (or 09).

## Invariants

- No token, no TTL, no 410-for-unknown-token.
- 06 does not supersede.
- `website_prefix` never renamed after this step.
- v1 is never a website-rollback target.
- 09 does not require this step.
