# 06 — Website preview

A **website preview** is a shareable **website preview link** onto the **unpublished website**,
tied to the onboarding session. It is not the website editor. The website preview token stays; the
rendered website pages are the current unpublished rows (copy from 05 shows up as those rows
update).

## Token

The API issues a website preview token (HMAC, default **14 days**). Only `token_hash` is stored
(`website_previews.token_hash`). Anyone with the unexpired website preview link can open
`/preview/{token}/` on the contractor website application (`apps/public-site`). Expired or superseded → 410.

## What it holds

- `expires_at`
- `status` — `active` while it is the current website preview; applying the website template again
  **supersedes** the old one.

Empty details show as website placeholders on the unpublished website. The website preview link
is enough.

## How the contractor gets here

1. 04 finishes → this step writes the website preview; onboarding session → `previewing`. Do
   **not** wait for [05](05-website-copy-generation.md). The first website preview is the
   unpublished website structure.
2. Onboarding `/onboarding/preview` shows SSE (business research, 04, then 05 copy updates), then
   a **View website** link once `preview_token` is on the profile.
3. The website preview is a separate route. It renders the **current** unpublished website,
   so copy from 05 appears on reload / next render. **Pay / website activation** is on that
   website preview (07) and does not wait for 05.

SSE is the onboarding session stream (business research + apply-the-website-template + copy
events). The website preview itself is not an SSE endpoint. The website preview **token** stays;
05 does not supersede the website preview.

- **Persists** `website_previews` (`token_hash`, `expires_at`,
  `status=active`) and `website_preview_events`.
