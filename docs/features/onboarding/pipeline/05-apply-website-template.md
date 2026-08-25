# 05 — Apply the website template

After client interview complete. `POST .../interview/complete` (04a submit or 04b `end_interview`)
sets `applying_website_template` and enqueues this step. It does **not** run at business lookup.

Onboarding **owns** kicking this off and waiting until an unpublished website exists. Rows are
[website](../../website/persistence.md) + [media library](../../other/media/persistence.md)
unpublished tables. They use the onboarding session’s `tenant_id` (unactivated tenant from 01).

## Trigger

`POST .../interview/complete` after the complete gate ([build-profile](build-profile.md)).

## Pre

- Complete gate passed.
- `tenant_id` unactivated tenant from 01.

## Must not

- Run at 01 business lookup.
- Wait for 06 or 02 to finish.
- `create_page` in 06 (this step already applied the website template’s website page set).
- Website publication.
- Resolve `{{…}}` detail tokens (publication does that).
- Bake raw profile strings into slots that should stay tokens.

## Do

1. Set `accepted_edit_id` to current `last_edit_id`. Apply from the fold as of that edit. Later
   02 writes must not mutate this fold in place.
2. One bounded LLM call picks website template + website styles (heuristic fallback: trade →
   website template, else default). Not website-page-by-website-page copy.
3. Deterministic apply: profile + website template → unpublished `website_pages` /
   `website_sections` / `website_slots`, one `website.menus` row (top menu + footer trees), and
   the two site-wide look website sections (`page_id` null). Reviews sections attach
   `website_slot_reviews` to `business_profile_reviews`. Placeholders (`{{business_name}}`,
   `{{marketing_phone}}`, …)
   **stay**. Same profile + same website template → same website pages.
4. Prefer real projects / Maps photos for image website slots; do not invent work photos.
5. Validate against website component contracts before the unpublished website is kept.
6. Enqueue 06. `/onboarding/preview` starts the wait (copy done or ~15s cap). 07 writes the host
   after that gate — not immediately.

Copy is **not** this step — [06](06-website-copy-generation.md).

## Persist

Unpublished website + media library rows, including `website.menus`, site-wide look website
sections, and `website_slot_reviews`; `ai_generations` for
the website template/website styles pick only. Onboarding session stays
`applying_website_template` until 07 writes `latest/`, then `previewing`.

## Fail

Throw → `apply_website_template_failed`. No `latest/`. Retry is a new apply (same
`website_address` if 07 already reserved it; new onboarding publication on that prefix).

## Out

07 website preview (after the wait). 06 async copy.

## Invariants

- Tokens remain tokens through 05.
- `tenant_id` is the 01 unactivated tenant.
- No `website_publications` in this step (07 writes v1).
