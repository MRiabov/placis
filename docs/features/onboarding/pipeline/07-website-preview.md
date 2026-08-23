# 07 — Website preview

A **website preview** is a shareable **website preview link** onto the **unpublished website**,
tied to the onboarding session. It is not the website editor. The website preview token stays; the
rendered website pages are the current unpublished rows (copy from 06 shows up as those rows update).

The published default host after website publication (glossary Website preview, Distinct from)
is **live** — never call that host a website preview.

## Trigger

05 finishes. This step writes the website preview. Do **not** wait for 06.

## Pre

Unpublished website from 05 exists. `tenant_id` is the unactivated tenant.

## Must not

- Wait for 06.
- Let 06 supersede this website preview.
- Give the link a TTL / `expired` status.
- Call the published default host a website preview.

## Do

1. Issue a website preview token (HMAC). Store only `token_hash`
   (`website_previews.token_hash`). Anyone with the website preview link can open
   `/preview/{token}/` on the contractor website application (`apps/contractor-website`).
   **No TTL.** 410 only when the token is unknown, **superseded**, or already **activated**.
2. `status=active` while it is the current website preview. Applying the website template again
   **supersedes** the old one (05 retry), not 06.
3. Empty details show as website placeholders. Onboarding `/onboarding/preview` shows SSE then
   **View website** once the plaintext token is returned (once).
4. **Pay / website activation** is on that website preview (08) and does not wait for 06.

SSE is the onboarding session stream. The website preview itself is not an SSE endpoint.

## Persist

`website_previews` (`token_hash`, `status=active`); `website_preview_events`. Onboarding session →
`previewing`.

## Fail

Issue failure: onboarding session stays `applying_website_template` or `apply_website_template_failed`; no
link. Retry 05+07.

## Out

Contractor can open the unpublished website and pay (08) while 06 may still run.

## Invariants

- No TTL.
- 06 does not supersede.
- 410 only unknown / superseded / activated.
