# 01 — Select website template

Pick a website template and website styles. Do not write unpublished pages.

**Out until the stacked rewrite.** Persist columns stay
(`website_template_id`, `preset_id`). Do not implement the LLM picker on
this branch. Picker output schema, `website_template_id` type, and the
heuristic table are [open questions](../catalog.md#open-questions). What
one website template is: [catalog.md](../catalog.md).

Onboarding [05](../../onboarding/pipeline/05-select-and-copy-website-template.md) enqueues this, then [02](02-copy-website-template-pages.md).

## Trigger

Onboarding 05 after client interview complete
(`POST .../interview/complete`).

## Pre

- Complete gate passed ([build-profile](../../onboarding/pipeline/build-profile.md)).
- Unactivated `tenant_id` from onboarding 01.
- Live business profile as of `accepted_edit_id` (05 sets that before this
  pick).

## Must not

- Write unpublished `website_pages` / `website_sections` / `website_slots`.
- Resolve website placeholders.
- Wait for business research to finish.
- Pick reviews or bake project gallery ids.
- Website publication.
- Implement the LLM picker on this branch (stacked rewrite).

## Do

1. Persist the pick onto `website_settings`. Do not copy pages (that is
   02). How the pick is chosen is the stacked rewrite / open questions —
   not an LLM schema in this file.
2. Do not write unpublished website rows.

## Persist

One `website_settings` row on that `tenant_id`: `website_template_id` =
catalog id, `preset_id` = website styles. 02 SELECTs that row. No
unpublished website rows. No `website_copy_generation` yet. `ai.threads` /
`ai_generations` for a picker call belong to the stacked rewrite, not
this branch.

## Fail

Throw with 05 (`select_and_copy_website_template_failed`). No unpublished
website. No `latest/`. Retry is a new 05 (01 then 02).

## Out

[02 copy the website template’s pages onto the unpublished website](02-copy-website-template-pages.md).

## Invariants

- Not a write of pages.
- Same profile + same catalog → same pick is 02’s concern, not this file’s
  write.
