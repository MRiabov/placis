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

Unpublished website from 05 (website 02) exists. `tenant_id` is the unactivated
tenant. Onboarding session is `preview_and_edit` (wait-end already happened) or
still `selecting_and_copying_website_template` if they share during the wait
(allowed; rare).

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

`SharePreviewWebsiteAddress` uses the prefix already on the onboarding
website and **calls** `PublishWebsite` with the website-activation strip on.

1. **Skip reserve** if `websites.website_prefix` is already set (Select and
   copy website template reserved it). Do not rename.
2. Write `website_addresses` (`type=subdomain`, `status=reserved`,
   `is_primary=true`) if missing. Wildcard on **our** `placis.com` zone already
   points at the Worker. FQDN: [cloudflare.md](../../website/cloudflare.md).
3. Insert **`website_publications` v1**: `published_by=onboarding`,
   `active`, strip **on**. HTML write is website
   [04 website publication](../../website/pipeline/04-website-publication.md)
   (tokenized dump + profile; Worker resolves; R2 + purge; strip flag on).
   Clerk/Stripe island sticky to the bottom of the viewport; Placis orb
   lockup on the strip. On 05 retry, archive the previous onboarding
   website version and write a new row on the same prefix (strip still on
   if unpaid).
4. Onboarding session stays `preview_and_edit` (or becomes `preview_and_edit` if
   they shared during the wait). Empty details show as website placeholders.

HTTP: `POST /v1/onboarding/website/publications`
([api.md](../api.md)). Auth: onboarding session token or Clerk unactivated.

SSE is the onboarding session stream. The contractor host is not an SSE
endpoint.

## Persist

`websites.website_prefix` already set; `website_addresses`;
`website_publications` (v1, strip on); R2 `latest/`. No `website_previews`.

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
