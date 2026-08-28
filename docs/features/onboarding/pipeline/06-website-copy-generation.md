# 06 — Website copy generation

Async. After 05. Writes headlines, body, CTAs, SEO into **existing** website
slots. Same website assistant tools as the CMS, **continuous + instant apply**,
no chat UI. Does not block 08. 07 waits copy-done or the wait cap, not the full
06 job if the cap hits first.

## Trigger

05 succeeded. One River job. Lock key: `tenant_id` (unactivated tenant already
exists). One in-flight website-assistant run per tenant ([assistant.md](../../website/assistant.md)). A
second start is 409.

## Pre

- Unpublished website from 05 exists.
- Live business profile as of `accepted_edit_id` at job start.

## Must not

- `create_page` (05 already applied the website page set).
- Block 08.
- Wait past 07’s cap to “finish” before the host can exist.
- Supersede the website preview (06 does not change `website_prefix` or replace
  07’s row).
- Set website slot `approved`. Website publication is website-level, not website
  slot `published`. Publication requires approved **media library** items, not
  approved copy website slots.
- Bake raw detail values into copy that should stay a token
  (`{{business_name}}`, `{{marketing_phone}}`, …).
- Wait for pay / 08. After 08 the same job **continues** on the same
  `tenant_id`. CMS website assistant 409 while this run is in flight.
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
4. Cap steps and tool calls (predecessor: 3 steps / 12 calls / 4 website pages
   at a time).

## Persist

Updates to existing `website_slots` and website page SEO columns;
`ai_generations` for tool batches. No `website_publications` from this job.
Onboarding session status is `applying_website_template` until 07, then
`previewing`. Progress events on the onboarding session stream (complete website
sections join the `/onboarding/preview` carousel). After they have landed on the
host, further 06 writes do **not** live-update R2.

## Fail

Keep the unpublished website from 05. Onboarding session stays
`applying_website_template` or `previewing`. Retry is safe (River key; safe to
retry). Copy fail must not fail 05 or block 08. 07 still writes current
unpublished rows if the cap elapsed.

## Out

07 writes (or already wrote) the host from unpublished rows at wait-end. The
contractor host is static; it does not re-render as this job continues.

## Invariants

- Lock = `tenant_id` before and after 08.
- No `create_page`.
- Detail tokens that should stay reusable stay in the prose.
- Does not set website slot `approved`.
