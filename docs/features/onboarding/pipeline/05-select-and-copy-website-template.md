# 05 — Select and copy the website template

After client interview complete. `POST .../interview/complete` (04a submit or
04b `end_interview`) sets `selecting_and_copying_website_template` and enqueues
this step. It does **not** run at business lookup.

Onboarding **owns** kicking this off and waiting until an unpublished
website exists. The writes are website pipeline
[01 select website template](../../website/pipeline/01-select-website-template.md)
then
[02 copy the website template’s pages onto the unpublished website](../../website/pipeline/02-copy-website-template-pages.md).
Rows are [website](../../website/persistence.md) +
[media library](../../other/media/persistence.md) unpublished tables. They
use the onboarding session’s `tenant_id` (unactivated tenant from 01).

Do not say apply the website template in prose.

## Trigger

`POST .../interview/complete` after the complete gate
([build-profile](build-profile.md)).

## Pre

- Complete gate passed.
- `tenant_id` unactivated tenant from 01.

## Must not

- Run at 01 business lookup.
- Wait for 06 or 02 business research to finish.
- Website publication.
- Resolve `{{…}}` (Worker / canvas / wait teaser do that).
- Implement 01/02 here — link those files.

## Do

1. Set `accepted_edit_id` to current `last_edit_id`. 01 and 02 read the
   live business profile as of that edit. Later 02 business-research
   writes must not mutate this live business profile in place.
2. Run website **01** then **02**.
3. Enqueue 06. `/onboarding/preview` starts the wait (copy done or ~15s
   cap). Wait-end who flips status is an
   [open question](../../website/catalog.md#open-questions). 08 writes
   the host if they share — not immediately.

## Persist

Onboarding session stays `selecting_and_copying_website_template` until
wait-end, then `preview_and_edit`. `business_profiles.accepted_edit_id` at
complete. `website_settings` (01) and unpublished website + River 06 job (02).
01 picker `ai_generations` belong to the stacked rewrite
([01](../../website/pipeline/01-select-website-template.md)).

## Fail

Throw → `select_and_copy_website_template_failed`. No `latest/`. Retry is a new
05 (same `website_prefix` if 08 already reserved it; new onboarding publication
on that prefix).

## Out

07 contractor copy improvement (after the wait). 06 async automatic
website copy generation.

## Invariants

- `tenant_id` is the 01 unactivated tenant.
- No `website_publications` in this step (08 writes v1).
