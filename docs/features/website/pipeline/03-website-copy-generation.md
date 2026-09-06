# 03 — Automatic website copy generation

Async River job after 02. Writes headlines, body, CTAs, SEO into
**existing** website slots. Same website editor tools as the CMS,
**continuous + instant apply**. Distinct from onboarding
[07 contractor copy improvement](../../onboarding/pipeline/07-contractor-copy-improvement.md)
(the contractor’s Assistant prompts). Other website pages finish in
parallel (including after wait-end).

Onboarding [06](../../onboarding/pipeline/06-website-copy-generation.md)
owns enqueue, the `website_id` lock, wait teaser, unpaid thread, leftover
after 09, and that this job must not block 09. River unique on
`website_id`: [jobs.md](../jobs.md#website_copy_generation).

## Trigger

02 succeeded. CMS `POST /v1/websites` **inserts** this job when create
ships. Onboarding lock / wait teaser / unpaid `assistant.runs` /
leftover-after-09 / must-not-block-09:
[06](../../onboarding/pipeline/06-website-copy-generation.md).

## Pre

- Unpublished website from Copy the website template’s pages exists.
- Live business profile as of `accepted_edit_id` at job start (onboarding)
  or the live profile (CMS `POST /v1/websites`, when create ships).
  Near-duplicate copy / SEO across a business’s websites is **TBD**.

## Must not

- `create_page` (02 already copied the website page set, including service
  pages from named services). Do not invent the service list. Unpaid owner
  prompts:
  [onboarding website editor](../../onboarding/website-editor.md).
- `update_reviews`. Ranked pool order is River job kind
  `reviews_ranking_for_display` ([jobs](../../business-profile/jobs.md)), not this River job kind. Do not write
  `website_slot_reviews`. Owner Content / `update_reviews` can still override a
  section later (CMS).
- Emit HTML in Go. Go does not resolve `{{…}}`.
- Invent a hotlink URL for an image website slot.
- Put image files or expiring signed URLs on `websiteRender`
  (`media_asset_urls` is public delivery URLs only).
- `generate_image` for a logo website slot. Leave `{{logo_url}}`.
- `generate_image` a face for a portrait / About / leadership website
  slot. Leave the slot / token empty.
- Attach a `photo_kind=logo` on a home hero, service page, or home
  service-card image website slot.
- Reuse an already-attached photo on a later image website slot
  (**this page**, later slots; not site-global; parent vs cleanup child
  are two ids).
- Attach a leftover photo whose **media caption** does not match that
  website slot’s intent (a van photo on gutter cleaning).
- Persist Worker HTML onto unpublished website slots.
- Write R2, convert WebP, or purge (that is 04).
- Extra screenshot tool. First view and `update_slot` already return a
  website image render from `websiteRender`.
- Re-specify onboarding lock, wait teaser, unpaid thread, leftover after
  09, or must-not-block-09 here (that is
  [06](../../onboarding/pipeline/06-website-copy-generation.md)).
- Supersede a shared preview website address (03 does not change
  `website_prefix` or replace 08’s row).
- Set website slot `approved`. Website publication is website-level, not
  website slot `published`. Publication requires approved **media library**
  items, not approved copy website slots.
- Bake raw detail values into copy that should stay a token
  (`{{business_name}}`, `{{marketing_phone}}`, …).
- Wrap optional-omit Common variables in required prose (a required
  heading that is only `VAT {{vat_number}}`). Leave those details on
  exact labeled website slots
  ([variables.md](../variables.md#optional-omit)).
- Same website-slot overlap after pay is last-write /
  `edit_history_conflict`.
- Run at business lookup. Not on every later 02 event.

## Do

`GenerateWebsiteCopy` writes copy and photo selection into existing
unpublished website slots. River job kind `website_copy_generation`.

1. **Turn 1 `websiteRender`.** Go loads the unpublished tree (tokens) +
   `WebsiteBusinessProfileRead` (not `website_manifest`) +
   `media_asset_urls` (often `{}`) and `POST`s `websiteRender`
   ([website HTTP](../api.md)). Put that **website image render** on the
   first inference (not HTML). Complete the **home** website page first (wait
   teaser keys off that). Other website pages generate in parallel. Batch the
   first `websiteRender` (for example 8 pages) on **one Worker**, not parallel
   Workers. “8 pages” is an example, not a rule when the site has 4 or 12
   website pages. Do not call `websitePublication`.
2. Per website page, bounded parallel: `update_slot` (prose), `update_seo`,
   then **photo selection**. **Attach first** (`update_slot` +
   `media_asset_id`) when an unused `media_assets` row’s media caption
   already fits; `generate_image` only when nothing fits on a work-photo
   slot (ADR 6).
   Not filename. Do not invent a numeric
   score.
   - **Logo** image website slots: unused `photo_kind=logo`. Else leave
     `{{logo_url}}`. Do not `generate_image` a logo. Publication emits
     `{{logo_url}}` from Details `logo_media_asset_id`.
   - **Portrait** image website slots (About / leadership / a named-person
     slot): unused `photo_kind=photo` whose **media caption** is a
     portrait of a person. Two slots pick two unused matching photos.
     If nothing fits, leave the slot / token empty. Do not
     `generate_image` a face.
   - **Every other** image website slot (home hero, service page images,
     home service cards): unused `photo_kind=photo` (not `logo`). Attach
     when **media caption** matches that website slot’s intent (roof
     repairs → people working on a roof; gutter cleaning → people
     cleaning gutters). A job-site photo with crew in it is still a
     photo. If nothing fits: **`generate_image`** (`CreateGeneratedMediaAsset`;
     `supplied_by=ai`, `created_by=ai`, pending review; persists the tool
     `media_caption` as `media_asset_classifications`
     (`photo_kind=photo`, `algorithm=copy_requested_media_caption`); no
     `describe_image`; inherits this job’s `bill_usage`; unpublished
     canvas warning; website publication still requires approved media
     library items).
   - Do not reuse an already-attached photo on a later image website slot
     (**this page**, later slots; not site-global; GET hydrates one page).
3. After each `update_slot`, the same `websiteRender` for the affected
   website page (`before_pages` + `pages`). `media_asset_urls` is the
   exact set for that body (new attach included). Put `before_image` and
   `after_image` on the tool result. Do not persist a website image render
   or HTML onto unpublished website slots.
4. After 03 a hero headline is **generated prose** that may still contain
   detail tokens. It is not a raw live-profile dump and not a lone
   `{{business_name}}` unless 03 left it. Remaining tokens resolve at
   website publication ([variables.md](../variables.md)).
5. Validate every tool result against website component contracts.
   Whole-and-valid or the batch fails.
6. Cap each website page’s agent at **20** tool-using model turns — the
   same constant as the CMS assistant, **per website page**, not for the
   whole website. Other website pages generate in parallel (home first
   for wait-end). No job-level cap on how many website pages generate at
   once.
7. Lazy-create `ai.threads` `thread_kind=cms_assistant` `current` for the
   unactivated tenant if needed. Start `assistant.runs` `running`
   `channel=text` on that thread. Append `tool_summary` as tools apply. 03
   LLM calls insert a `thread_kind=website_copy_generation` thread per
   website page (`ai_generations.thread_id` required). Parallel website
   pages = parallel threads. Reuse that uuid only for schema-repair on
   that agent. After 09 do not append Assistant thread items.

### Website image render SLO (Go worker round-trip)

Clock: request leaves the Go worker → `websiteRender` → the website image
render is back at the Go worker. Not Worker-only. Not 04 R2 / WebP /
purge.

| Call | p50 | p90 | p95 |
| --- | --- | --- | --- |
| 1 page (after `update_slot`) | 500ms | 1s | 1.25s |
| Batch of 8 pages (turn 1) | 750ms | 1.5s | 2s |

One Worker handles a batch, not one Worker per page. Worker timeout
follows this table.

## Loads

Website component contracts under `catalog/`.

## Reads

Unpublished `website_pages`, `website_sections`, `website_slots`,
`website.menus`, `website_settings`; live `business_profiles`;
`media_assets`, `media_asset_classifications`.

## Sends

`WebsiteRenderRequest` to `websiteRender`. Response
`WebsiteRenderResponse`.

## Calls

`websiteRender`.

## Persist

`website_slots`; `website_pages` SEO columns; `media_assets` from
`generate_image` (`CreateGeneratedMediaAsset`; `supplied_by=ai`,
`created_by=ai`, pending review; inherits this job’s `bill_usage`)
and `media_asset_classifications`
(`algorithm=copy_requested_media_caption`); `edit_history`
agent batches; `ai_generations` for tool batches
(`thread_kind=website_copy_generation` thread per website page,
`prompt_id=website_copy_generation`); `ai.threads`
(`thread_kind=cms_assistant`) / `assistant.thread_items` /
`assistant.runs` while unactivated. `onboarding_sessions` wait-end
`preview_and_edit`. No `website_publications` from this step. After they
share (08), further 03 writes do **not** live-update R2.

## Fail

Keep the unpublished website from 02. Onboarding session stays
`selecting_and_copying_website_template` or `preview_and_edit`. Retry is safe
(River key; safe to retry). Copy fail must not fail 05 or block 09. Share (08)
still writes current unpublished rows if they share after the cap.
Billed remaining 0 on `generate_image` fails the job (not HTTP **402**).
Onboarding 06 is `unbilled`.

## Out

Wait-end navigates to `/onboarding/preview-and-edit/`
([07](../../onboarding/pipeline/07-contractor-copy-improvement.md)).
Progress events on the onboarding session stream (complete website
sections join the `/onboarding/preview` carousel). The website preview
reloads unpublished GET from those events, and hydrates 03
`tool_summary` from [assistant HTTP](../../assistant/api.md) (onboarding
session token or Clerk). 08 share (optional) writes the host from
unpublished rows. The contractor host is static; it does not re-render
as this job continues.

## Invariants

- Onboarding lock / leftover after 09:
  [06](../../onboarding/pipeline/06-website-copy-generation.md).
- No `create_page`. No `update_reviews`.
- Detail tokens that should stay reusable stay in the prose.
- Does not set website slot `approved`.
- Go does not emit HTML.
- Photo selection is this job, not 02. Attach first when media caption
  fits. Logo: unused `logo` or leave the token. Portrait: unused photo
  whose **media caption** is a person portrait; leave empty if nothing
  fits (no `generate_image`). Other image slots: `generate_image` when
  nothing fits.
