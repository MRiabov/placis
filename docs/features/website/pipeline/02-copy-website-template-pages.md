# 02 — Copy the website template’s pages onto the unpublished website

After [01](01-select-website-template.md). Write unpublished website pages,
website sections, and tokenized website slots from that pick. Tokens stay.
Never say instantiate, population, or generate for this. Distinct from **Copy**
(the words) and [website copy generation](03-website-copy-generation.md).
Catalog object and mapping: [catalog.md](../catalog.md).

Onboarding [05](../../onboarding/pipeline/05-select-and-copy-website-template.md) runs this in the same River job kind
`select_and_copy_website_template` as 01.

## Trigger

01 succeeded in the same `select_and_copy_website_template` run.

## Pre

- Website template + website styles pick from 01
  (`website_settings.website_template_id` + `preset_id` on that
  `website_id`).
- Live business profile as of `accepted_edit_id`.
- Client interview complete. Named services on that confirmed profile are
  the service list for this write. At least one named service (checklist
  `services` is required at complete).

## Must not

- Wait for business research to finish.
- Resolve website placeholders. Go does not rewrite `{{…}}`.
- Call `website_reviews_picker` or insert `website_slot_reviews`.
- Bake ranked-top-4 project ids into gallery website slots. `{{projects.*}}` /
  `{{reviews.1}}` stay tokens.
- Website publication.
- `create_page` (this write already has the page set, including service
  pages from named services).
- Copy a predecessor per-page top menu / footer onto every website page.
  Site-wide catalog `top_menu` / `footer` (including `url` nodes) is
  the Copy website template pages write. When the template omits menus,
  trees are the [menu constant](../catalog.md#menu-constant).
- Bake raw profile strings into website slots that should stay tokens.
- Invent a hotlink URL for an image website slot.
- Attach `media_asset_id` or run photo selection (`generate_image`). That
  is [03](03-website-copy-generation.md).
- Rewrite the privacy policy notice body (factory prose).
- Invent a different layout per named service.
- Skip service website pages, or invent a generic `/services` index.
- Copy extra website pages (gallery / services index / testimonials /
  careers) as `website_pages`.
- Call an LLM.

## Do

`CopyWebsiteTemplatePages` writes the unpublished website from the 01
pick. Tokens stay.

1. Deterministic copy from the website template: unpublished
   `website_pages` / `website_sections` / `website_slots`. Explode each
   website section’s `editable_slots`. `omit_if_unresolved` stays on the
   website component contract. Non-slot layout props may stay on
   section `props` jsonb. Copy the two site-wide look website sections
   from the website template (`page_id` null — look: logo, density). Copy
   the **about** website page (`page_type=about`). Copy the **privacy
   policy** website page (`page_type=legal`). Copy the service website
   page **once per named service** on the accepted profile (same layout;
   path and title from that service name). N ≥ 1. Fail if zero named
   services at this copy. `{{about.intro_paragraphs}}` is a placeholder
   namespace, not a page type.
2. **Menus.** If the website template includes site-wide `top_menu` /
   `footer`, copy those trees onto `website.menus` (`url` nodes →
   `website_urls` + `url_id`). Otherwise **derive** `website.menus` from
   the [menu constant](../catalog.md#menu-constant) (same pick + same
   named services → same website pages → same trees). Persist the row
   because that is the CMS store (`update_menus` can diverge later).
   Generate website copy does not invent website pages, so it does not
   invent menu nodes.
3. Page set is then **static**. They already confirmed or disproved
   services in questioning. Later business research does not add service
   pages; owner / assistant `create_page` can (and then appends to the
   trees per [persistence.md](../persistence.md)).
4. Placeholders (`{{business_name}}`, `{{marketing_phone}}`,
   `{{reviews.1}}`, `{{projects.featured}}`, …) **stay**.
5. Image website slots are `slot_type=image` (contract image website slot
   `asset_id`). Keep `{{images.*}}` / `{{logo_url}}`. Do not attach
   `media_asset_id`. Photo selection is
   [03](03-website-copy-generation.md). Do not bake ranked-top-4 ids.
6. Persist `website_forms` / `website_form_fields` /
   `website_form_field_options` from form website sections’ contracts
   (`form_key` = the catalog form key on that website section). Persist
   `website_urls` iff the template menus have `url` nodes.
7. Validate against website component contracts before the unpublished
   website is kept.
8. Same pick + same profile → same website pages (and the same menus:
   catalog when the template ships them, else the menu constant).
9. **Inserts** `website_copy_generation`. `/onboarding/preview` (wait teaser)
   waits until the **home** website page has 03 copy, or the wait cap (~15s).
   Other website pages finish in parallel. Then wait-end:
   `preview_and_edit`.

Copy is **not** this step —
[03 automatic website copy generation](03-website-copy-generation.md).

## Loads

Website template catalog object for the 01 pick, plus website component
contracts under `catalog/`.

## Reads

`website_settings` (`website_template_id`, `preset_id`), live
`business_profiles` as of `accepted_edit_id`.

## Inserts

`website_copy_generation`.

## Persist

`website_pages`, `website_sections`, `website_slots`, `website.menus`,
`website_forms`, `website_form_fields`, `website_form_field_options`,
`website_urls` (iff the template has `url` nodes). Schema `jobs`: one
River job kind `website_copy_generation` (onboarding 06 / website 03), unique
key = that `tenant_id`. Args: `tenant_id` only. Second insert while
pending/running is River unique conflict → HTTP 409.
[jobs](../jobs.md). Must not write
`website_slot_reviews`, `website_publications`, `edit_history`, or
attach `media_asset_id` on image slots. Onboarding session stays
`selecting_and_copying_website_template` until wait-end, then
`preview_and_edit`.

## Fail

Throw with 05 (`select_and_copy_website_template_failed`), including when
the accepted profile has zero named services. No `latest/`. Retry
is a new 05 (same `website_prefix` if 08 already reserved it; new onboarding
publication on that prefix).

## Out

Onboarding 07 after the wait. 06 async automatic website copy generation.

## Invariants

- Tokens remain tokens through 02. Image website slots have no
  `media_asset_id` from this copy.
- `tenant_id` is the 01 unactivated tenant.
- No `website_publications` in this step (08 writes v1).
- Page set is static at client interview complete. N ≥ 1 service website
  pages. One `page_type=about` website page.
- Top menu and footer equal the catalog menus when the template ships
  them, otherwise the menu constant for that page set.
