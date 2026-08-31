# 02 — Copy the website template’s pages onto the unpublished website

After [01](01-select-website-template.md). Write unpublished website pages,
website sections, and tokenized website slots from that pick. Tokens stay.
Never say instantiate, population, or generate for this. Distinct from **Copy**
(the words) and [website copy generation](03-website-copy-generation.md).
Catalog object and mapping: [catalog.md](../catalog.md).

Onboarding [05](../../onboarding/pipeline/05-select-and-copy-website-template.md) runs this in the same job as 01.

## Trigger

01 succeeded in the same 05 run.

## Pre

- Website template + website styles pick from 01
  (`website_settings.website_template_id` + `preset_id` on that
  `tenant_id`).
- Live business profile as of `accepted_edit_id`.
- Client interview complete. Named services on that confirmed profile are
  the service list for this write.

## Must not

- Wait for business research to finish.
- Resolve website placeholders. Go does not rewrite `{{…}}`.
- Call `website_reviews_picker` or insert `website_slot_reviews`.
- Bake ranked-top-4 project ids into gallery slots. `{{projects.*}}` /
  `{{reviews.1}}` stay tokens.
- Website publication.
- `create_page` (this write already has the page set, including service
  pages from named services).
- Copy a catalog top menu / footer JSON. The trees are the
  [menu constant](../catalog.md#menu-constant), not a second template blob.
- Bake raw profile strings into slots that should stay tokens.
- Invent a hotlink URL for an image website slot.
- Rewrite the privacy policy notice body (factory prose).
- Invent a different layout per named service.

## Do

1. Deterministic copy from the website template: unpublished
   `website_pages` / `website_sections` / `website_slots`. Explode each
   website section’s `editable_slots`. Non-slot layout props may stay on
   section `props` jsonb. Copy the two site-wide look website sections
   from the website template (`page_id` null — look: logo, density). Copy
   the **about** website page (`page_type=about`). Copy the **privacy
   policy** website page (`page_type=legal`). Copy the service website
   page **once per named service** on the accepted profile (same layout;
   path and title from that service name).
2. **Derive** `website.menus` (`top_menu` + `footer`) from the
   [menu constant](../catalog.md#menu-constant). Same pick + same named
   services → same website pages → same trees. Persist the row because
   that is the CMS store (`update_menus` can diverge later). 03 does not
   invent website pages, so it does not invent menu nodes.
3. Page set is then **static**. They already confirmed or disproved
   services in questioning. Later business research does not add service
   pages; owner / assistant `create_page` can (and then appends to the
   trees per [persistence.md](../persistence.md)).
4. Placeholders (`{{business_name}}`, `{{marketing_phone}}`,
   `{{reviews.1}}`, `{{projects.featured}}`, …) **stay**.
5. Image website slots are `slot_type=image` (contract image slot
   `asset_id`). Attach `media_asset_id` using ETL **media caption** and
   photo kind, or keep `{{images.*}}` / `{{logo_url}}`. Scoring is an
   [open question](../catalog.md#open-questions). Do not bake
   ranked-top-4 ids.
6. Persist `website_forms` / fields from form website sections’ contracts
   (`form_key` = the catalog form key on that website section).
7. Validate against website component contracts before the unpublished
   website is kept.
8. Same pick + same profile → same website pages (and the same derived
   menus).
9. Enqueue onboarding 06. `/onboarding/preview` (wait teaser) waits until
   the **home** website page has 03 copy, or the wait cap (~15s). Other
   website pages finish in parallel. Then wait-end:
   `preview_and_edit`.

Copy is **not** this step —
[03 automatic website copy generation](03-website-copy-generation.md).

## Persist

Unpublished website + media library rows, including a **derived**
`website.menus` row and site-wide look website sections. No
`website_slot_reviews`. No `website_publications`. Schema `jobs`: one River job
for onboarding 06 / website 03, unique key = that `tenant_id`. River job enum
value and args are [open questions](../catalog.md#open-questions). Onboarding
session stays `selecting_and_copying_website_template` until wait-end, then
`preview_and_edit`.

## Fail

Throw with 05 (`select_and_copy_website_template_failed`). No `latest/`. Retry
is a new 05 (same `website_prefix` if 08 already reserved it; new onboarding
publication on that prefix).

## Out

Onboarding 07 after the wait. 06 async automatic website copy generation.

## Invariants

- Tokens remain tokens through 02.
- `tenant_id` is the 01 unactivated tenant.
- No `website_publications` in this step (08 writes v1).
- Page set is static at client interview complete.
- Top menu and footer at 02 equal the menu constant for that page set.
