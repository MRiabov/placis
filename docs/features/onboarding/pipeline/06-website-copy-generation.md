# 06 — Automatic website copy generation

Async River job kind `website_copy_generation` after 05. Onboarding owns the
lock, wait teaser, unpaid thread, and that this job must not block 09. The
write is website
[03 automatic website copy generation](../../website/pipeline/03-website-copy-generation.md).

## Trigger

05 succeeded. One River job kind `website_copy_generation`. Lock key:
`website_id` (the website 05 inserted; a second 06 start for that website is
**409** from River unique-insert on that key — do not HTTP-check before
insert). While
unactivated, 06 also holds `assistant.runs` `running` on the
onboarding-website-editor thread
([website editor](../website-editor.md)). After 09 that lock must not sit
on CMS `assistant.runs`; leftover 06 is River-only on `website_id`.

**Defensive check.** Before enqueue, assert the tenant has exactly one
`websites` row for this run (the onboarding website). If more than one exists
(should not happen this pass), fail the job rather than enqueue copy
generation for an ambiguous website. The `website_id` unique lock already
guards against two concurrent 06 runs for the same website; this check guards
against keying the lock on the wrong website.

## Pre

- Unpublished website from 05 (website 02) exists.
- Live business profile as of `accepted_edit_id` at job start.

## Must not

- Block 09.
- Wait past the wait-teaser cap to “finish” before the website preview can
  exist.
- Cancel leftover 06 at pay. CMS PATCH / assistant HTTP are **not** 409
  because this job is running.
- Re-specify website 03 tools, Worker website page render, or SLO here.

## Do

`GenerateWebsiteCopy` runs website 03. Complete the **home** website page
first. Other website pages finish in parallel. `/onboarding/preview` waits
until that home copy is done, or the wait cap (~15s). Wait-end is
[07](07-contractor-copy-improvement.md).

## Persist

Onboarding session `selecting_and_copying_website_template` until wait-end
(home website page copy done or wait cap), then `preview_and_edit`. Website
slot writes, `ai_generations`, unpaid thread items: website 03.

## Fail

Keep the unpublished website from 05. Onboarding session stays
`selecting_and_copying_website_template` or `preview_and_edit`. Copy fail must
not fail 05 or block 09.

## Out

Wait-end navigates to `/onboarding/preview-and-edit/`. 08 share is
optional.

## Invariants

- Lock = `website_id` before and after 09. While unactivated, also
  `assistant.runs` unique running. After 09, not on CMS `assistant.runs`.
  Before enqueue, assert exactly one `websites` row for the tenant.
