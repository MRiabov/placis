# 06 — Preview

A **preview package** is a signed, shareable URL onto the generated site **draft**, tied to the
onboarding session. It is not the CMS editor. The token stays; the rendered pages are the current
draft rows (copy from 05 shows up as those rows update).

## Token

The API issues a preview token (HMAC, default **14 days**). Only `token_hash` is stored
(`preview_packages.token_hash`). Anyone with the unexpired token can open the public preview
URL (`/preview/{token}/` on the public-site runtime). Expired or superseded → 410.

## What it holds

- `personas` — who the preview is for (default the business owner). Not a permission system.
- `unresolved_fields` — checklist/profile gaps still empty at package creation (the preview can
  still be shown).
- `expires_at`
- `status` — `active` while it is the current package; a newer generate **supersedes** the old
  one.

## How the contractor gets here

1. 04 finishes → this step writes the package; session → `previewing`. Do **not** wait for
   [05](05-refine.md). The first preview is the instantiated skeleton.
2. Onboarding `/onboarding/preview` shows SSE (research, 04, then 05 copy updates), then a
   **View website** link once `preview_token` is on the profile.
3. The public preview is a separate route. It renders the **current** draft, so copy from 05
   appears on reload / next render. **Pay / claim** is on that page (07) and does not wait for 05.

SSE is the onboarding session stream (research + generate + copy events). The public preview
itself is not an SSE endpoint. The preview **token** stays; 05 does not supersede the package.

- **Persists** `preview_packages` (`token_hash`, `personas`, `unresolved_fields`, `expires_at`,
  `status=active`) and `preview_events`.
