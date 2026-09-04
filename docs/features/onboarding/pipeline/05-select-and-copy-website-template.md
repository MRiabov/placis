# 05 — Select and copy the website template

After client interview complete. `POST /v1/onboarding/interview/complete`
sets `selecting_and_copying_website_template` and **inserts** River job
kind `select_and_copy_website_template`. It does **not** run at business
lookup.

Onboarding **owns** kicking this off and waiting until an unpublished
website exists. The writes are website pipeline
[01 select website template](../../website/pipeline/01-select-website-template.md)
then
[02 copy the website template’s pages onto the unpublished website](../../website/pipeline/02-copy-website-template-pages.md).
Rows are [website](../../website/persistence.md) +
[media library](../../other/media/persistence.md) unpublished tables. They
use the onboarding session’s `tenant_id` (unactivated tenant from Find)
and `website_id` (this step inserts `websites` before Select website
template).

Do not say apply the website template in prose.

## Trigger

`POST /v1/onboarding/interview/complete` after the complete gate
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

This step **is** River job kind `select_and_copy_website_template`.
Inserts `websites` (reserve `website_prefix` and insert
`website_addresses` `type=subdomain` in the same transaction),
sets `onboarding_sessions.website_id`, then **calls**
`SelectWebsiteTemplate` then `CopyWebsiteTemplatePages`.

1. Insert `websites` + reserve prefix + `website_addresses`
   `type=subdomain` for `{website_prefix}.preview.placis.com`
   (choose-rule unchanged). Persist `onboarding_sessions.website_id`.
2. Set `accepted_edit_id` to current `last_edit_id`. Select website
   template and copy-pages read the live business profile as of that edit.
   Later business-research writes must not mutate this live business profile
   in place.
3. Run website **Select website template** then **Copy the website
   template’s pages onto the unpublished website** on that `website_id`.
4. Copy-pages **inserts** `website_copy_generation` (`bill_usage=unbilled`).
   `/onboarding/preview` (wait teaser) waits until the **home** website page
   has Website copy generation copy, or the wait cap (~15s). Other website
   pages finish in parallel. Then wait-end. Preview website address writes
   the host if they share — not immediately.

## Inserts

`website_copy_generation`.

## Persist

Onboarding session stays `selecting_and_copying_website_template` until
wait-end, then `preview_and_edit`. `business_profiles.accepted_edit_id` at
complete. `websites` + `website_prefix` + `website_addresses`
`type=subdomain`; `website_settings` (Select website template)
and unpublished website + `website_copy_generation` (copy-pages).
No `ai_generations` for the pick (Select website template is occupancy +
hash, not an LLM).

## Fail

Throw → `select_and_copy_website_template_failed`. No `latest/`. Retry is a
new `select_and_copy_website_template` on the **same** `website_id`
(prefix already reserved).

## Out

07 contractor copy improvement (after the wait). 06 async automatic
website copy generation.

## Invariants

- `tenant_id` is the Find unactivated tenant; `website_id` is the
  onboarding website this step inserted.
- No `website_publications` in this step (Preview website address writes
  v1).
