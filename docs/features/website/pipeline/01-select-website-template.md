# 01 — Select website template

Pick a website template and website styles. Do not write unpublished pages.

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

## Do

1. One bounded LLM call picks website template + website styles
   (`thread_kind=website_template_picker`). Not website-page-by-website-page
   copy.
2. Heuristic fallback remains the existing pointer only: trade → website
   template, else default. What one website template is (catalog family) is
   out of this step.
3. Persist the pick. Do not copy pages (that is 02).

## Persist

`ai.threads` (`thread_kind=website_template_picker`) and `ai_generations`
for the pick (`input`, `internal_reasoning`, `output`, `tool_calls`). One
`website_settings` row on that `tenant_id`: `website_template_id` = catalog
id, `preset_id` = website styles. 02 SELECTs that row. No unpublished
website rows. No River 06 job yet.

## Fail

Throw with 05 (`select_and_copy_website_template_failed`). No unpublished
website. No `latest/`. Retry is a new 05 (01 then 02).

## Out

[02 copy the website template’s pages onto the unpublished website](02-copy-website-template-pages.md).

## Invariants

- One LLM call (or the heuristic fallback). Not a write of pages.
- Same profile + same catalog → same pick is 02’s concern, not this file’s
  write.
