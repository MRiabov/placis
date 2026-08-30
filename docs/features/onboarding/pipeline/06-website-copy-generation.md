# 06 — Website copy generation

Async. After 05. Writes headlines, body, CTAs, SEO into **existing** website
slots. Same website editor tools as the CMS, **continuous + instant apply**,
no chat UI. Does not block 08. Wait teaser waits copy-done or the wait cap, not
the full 06 job if the cap hits first.

## Trigger

05 succeeded. One River job. Lock key: `tenant_id` (unactivated tenant already
exists). A second 06 start is 409 on that River key. While unactivated, 06 also
holds `assistant.runs` `running` on the onboarding-website-editor thread
([website editor](../website-editor.md)). After 08 that lock must not sit on CMS
`assistant.runs`; leftover 06 is River-only on `tenant_id`.

## Pre

- Unpublished website from 05 exists.
- Live business profile as of `accepted_edit_id` at job start.

## Must not

- `create_page` (05 already applied the website page set, including service
  pages from named services). Do not invent the service list. Unpaid owner
  prompts on the website preview **may** `create_page`.
- Block 08.
- Wait past the wait-teaser cap to “finish” before the website preview can
  exist.
- Supersede a shared preview website address (06 does not change
  `website_prefix` or replace 07’s row).
- Set website slot `approved`. Website publication is website-level, not website
  slot `published`. Publication requires approved **media library** items, not
  approved copy website slots.
- Bake raw detail values into copy that should stay a token
  (`{{business_name}}`, `{{marketing_phone}}`, …).
- Wait for pay / 08. After 08 the same job **continues** on the same
  `tenant_id` as River-only (no `assistant.runs`, no new thread items). Do not
  cancel 06 at pay. CMS PATCH / assistant HTTP are **not** 409 because this job
  is running. Same website-slot overlap after pay is last-write /
  `edit_history_conflict`.
- Run at business lookup. Not on every later 02 event.

## Do

1. Per website page, bounded parallel: `update_slot` (prose), `update_seo`, then
   image: **attach first** (`update_slot` + `media_asset_id`) when
   `media_assets[]` already has a fit; `generate_image` only when nothing fits
   (ADR 6).
2. After 06 a hero headline is **generated prose** that may still contain detail
   tokens. It is not a raw live-profile dump and not a lone `{{business_name}}`
   unless 06 left it. Remaining tokens resolve at website publication
   ([variables.md](../../website/variables.md)).
3. Validate every tool result against website component contracts.
   Whole-and-valid or the batch fails.
4. Cap steps and tool calls (**3 steps / 12 calls / 4 website pages** at a
   time). Distinct from the CMS agent’s 20 model turns.
5. Lazy-create `ai.threads` `kind=cms_assistant` `current` for the unactivated
   tenant if needed. Start `assistant.runs` `running` `channel=text` on that
   thread. Append `tool_summary` as tools apply. 06 LLM calls use a
   `kind=website_copy_generation` thread (`ai_generations.thread_id` required).
   After 08 do not append overlay thread items.

## Persist

Updates to existing `website_slots` and website page SEO columns;
`ai_generations` for tool batches (`kind=website_copy_generation` thread);
`ai.threads` (`kind=cms_assistant`) / `assistant.thread_items` /
`assistant.runs` while unactivated. No `website_publications` from this job.
Onboarding session status is `applying_website_template` until wait-end
(copy done or cap), then `previewing`. Progress events on the onboarding
session stream (complete website sections join the `/onboarding/preview`
carousel). The website preview reloads unpublished GET from those events, and
hydrates 06 `tool_summary` with `GET …/website-editor/assistant/thread`
(onboarding session token or Clerk). After they share (07), further 06 writes
do **not** live-update R2.

## Fail

Keep the unpublished website from 05. Onboarding session stays
`applying_website_template` or `previewing`. Retry is safe (River key; safe to
retry). Copy fail must not fail 05 or block 08. Share (07) still writes current
unpublished rows if they share after the cap.

## Out

Wait-end navigates to `/onboarding/preview-and-edit/`. 07 share (optional)
writes the host from unpublished rows. The contractor host is static; it does
not re-render as this job continues.

## Invariants

- Lock = `tenant_id` before and after 08. While unactivated, also
  `assistant.runs` unique running. After 08, not on CMS `assistant.runs`.
- No `create_page`.
- Detail tokens that should stay reusable stay in the prose.
- Does not set website slot `approved`.
