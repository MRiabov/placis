# 01 — Select website template

Pick a website template. Website styles ship with that pick. Do not write
unpublished pages. Do not call an LLM. What one website template is:
[catalog.md](../catalog.md).

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

- Write unpublished `website_pages` / `website_sections` / `website_slots`
  / `website.menus` / `website_forms`.
- Write `website_publications` / `edit_history`.
- Resolve website placeholders.
- Wait for business research to finish.
- Pick reviews or bake project gallery ids.
- Website publication.
- Call an LLM. No `thread_kind=website_template_picker`. No trade → one
  website template table. No independent website styles pick.

## Do

`SelectWebsiteTemplate` picks a production-ready website template. No
LLM. No unpublished pages.

1. If this tenant already has `website_settings.website_template_id`, reuse
   that pick (retry of the same tenant). Stop.
2. Load **production-ready** website templates only
   (`production_ready=true`). Internal, stub, and predecessor source-backed
   dumps are not 01 picks. Predecessor per-page `production_selectable` is
   not this flag. Empty production-ready set → Fail.
3. Website styles for the pick = that website template’s associated website
   style catalog preset (`preset_id`). Not a second hash. Not an LLM. The
   owner may change Website styles later in the CMS; 01 does not. Live
   storage is `website_settings.preset_id`, not a field 02 reads off the
   website template JSON.
4. **Occupancy** (who counts in 250 km): other tenants who **paid** and have
   not been in nonpayment for **6 months**. Unactivated, abandoned, and
   preview-only tenants are out. Ten Dublin onboardings do not drain the
   pool.
   - In: `tenants.subscription_status=active`.
   - In: `billing.subscriptions.status=canceled` and now is **less than 6
     months** after `canceled_at` (set when status becomes `canceled`, after
     `current_period_end`).
   - Out: nonpayment **≥ 6 months**. Live website is already unpublished;
     occupancy uses this clock, not `tenants.status=active` (that stays
     `active` after cancel).
5. Coordinates: `google_maps_listings.latitude` /
   `google_maps_listings.longitude` for this tenant when Maps ran.
   Great-circle (haversine) **250 km**, not driving distance. Ireland is one
   neighbourhood (Dublin–Cork ~220 km). Planning assumption: on the order of
   200 construction companies on the island. Prefer uniqueness (more
   production-ready website templates) over shrinking the radius.
   Service-area `locality` / `radius_km` is where they work, not HQ — do not
   use it. No coords → skip geo; hash over all production-ready ids. Do not
   block 01 on ETL. Do not geocode `registered_office`.
6. Among production-ready ids, count occupying tenants within 250 km who
   already have that `website_template_id`. Pick the **lowest** count (0 =
   unused in radius). Tie-break: sort those ids, then
   `sorted[hash(tenant_id) % len]`. Hash, not a dice roll. Collision is
   least-used in radius, not “pick any.”
7. Persist the pick. Do not copy pages (that is 02).

## Loads

Production-ready website templates from the website template catalog
(`production_ready=true`).

## Reads

`tenants`, `billing.subscriptions`, `google_maps_listings` (coords when
Maps ran), existing `website_settings` on retry.

## Persist

One `website_settings` row on that `tenant_id`: `website_template_id` =
production-ready website template catalog id (string), `preset_id` = that
website template’s associated website style catalog preset. 02 SELECTs that
row. No `website_copy_generation` yet. No `ai.threads` /
`ai_generations` for this step.

## Fail

Throw with 05 (`select_and_copy_website_template_failed`). No
`website_pages` / `website_sections` / `website_slots`. No `latest/`.
Retry is a new 05 (01 then 02). Empty production-ready catalog is this
Fail.

## Out

[02 copy the website template’s pages onto the unpublished website](02-copy-website-template-pages.md).

## Invariants

- No LLM. Same tenant retry reuses `website_settings`.
- Production-ready website templates only.
- Website styles ship with the website template.
