# 05 — Apply the website template

After client interview complete. `POST .../interview/complete` (04a submit or
04b `end_interview`) sets `applying_website_template` and enqueues this step. It
does **not** run at business lookup.

Onboarding **owns** kicking this off and waiting until an unpublished website
exists. Rows are [website](../../website/persistence.md) + [media library](../../other/media/persistence.md) unpublished tables. They use the
onboarding session’s `tenant_id` (unactivated tenant from 01).

## Trigger

`POST .../interview/complete` after the complete gate ([build-profile](build-profile.md)).

## Pre

- Complete gate passed.
- `tenant_id` unactivated tenant from 01.

## Must not

- Run at 01 business lookup.
- Wait for 06 or 02 to finish.
- `create_page` in 06 (this step already applied the website template’s website
  page set).
- Website publication.
- Resolve `{{…}}` detail tokens (publication does that).
- Bake raw profile strings into slots that should stay tokens.

## Do

1. Set `accepted_edit_id` to current `last_edit_id`. Apply from the live
   business profile as of that edit. Later 02 writes must not mutate this live
   business profile in place.
2. One bounded LLM call picks website template + website styles (heuristic
   fallback: trade → website template, else default). Not
   website-page-by-website-page copy.
3. Deterministic apply: profile + website template → unpublished `website_pages`
   / `website_sections` / `website_slots`, one `website.menus` row (top menu +
   footer trees), and the two site-wide look website sections (`page_id` null).
   Named services on the accepted profile become service pages in that write.
   Reviews sections attach `website_slot_reviews` to `business_profile_reviews`.
   Project-gallery website slots get the **ranked top 4** `active` business
   research origin Project ids at apply (empty if none). Bake already omits
   project drafts. Placeholders (`{{business_name}}`, `{{marketing_phone}}`, …)
   **stay**. Same profile + same website template → same website pages.
4. Prefer real projects / Maps photos for image website slots; do not invent
   work photos.
5. Validate against website component contracts before the unpublished website
   is kept.
6. Enqueue 06. `/onboarding/preview` starts the wait (copy done or ~15s cap).
   Wait-end is [07](07-contractor-copy-improvement.md). 08 writes the host if
   they share — not immediately.

Copy is **not** this step —
[06 automatic website copy generation](06-website-copy-generation.md).

## Persist

Unpublished website + media library rows, including `website.menus`, site-wide
look website sections, and `website_slot_reviews`; `ai_generations` for the
website template/website styles pick (`kind=website_template_picker`) and, when
the reviews pool is ready, the reviews pick (`kind=website_reviews_picker`).
Onboarding session stays
`applying_website_template` until wait-end, then `previewing`.

## Fail

Throw → `apply_website_template_failed`. No `latest/`. Retry is a new apply
(same `website_prefix` if 08 already reserved it; new onboarding publication on
that prefix).

## Out

07 contractor copy improvement (after the wait). 06 async automatic website copy
generation.

## Invariants

- Tokens remain tokens through 05.
- `tenant_id` is the 01 unactivated tenant.
- No `website_publications` in this step (08 writes v1).
