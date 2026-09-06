# Website template catalog

The catalog object [01](pipeline/01-select-website-template.md) picks and
[02](pipeline/02-copy-website-template-pages.md) copies. Go parses a **typed
model** (extra keys rejected). 01 sets `website_settings.preset_id` from that
website template’s associated website style catalog preset. Style is that
column, not a field 02 reads off the website template JSON.

Predecessor `packages/website-components/src/blueprints/` page dumps are
scrap. Registry **renderers** and the idea of `contract.json` beside a
website component are the inventory. Do not port competitor page JSON.

## Website template

One id. 01 writes it to `website_settings.website_template_id`. 02 SELECTs
that row. `production_ready` is **on the website template**. Internal and
stub website templates are not 01 picks. Predecessor per-page
`production_selectable` is not this flag. Source-backed PCL / Harper /
Roof Shield files are not pickable.

The website template names:

- one **home** website page
- one **about** website page (`page_type=about`)
- one **service** website page, copied **N times** at 02 from named
  services on the accepted profile (same website sections and website
  slots; path and title from that service name /
  [persistence](persistence.md) website page path rules). N ≥ 1 (checklist
  `services` is required at complete). Do not skip those pages. Do not
  invent a generic `/services` index. 03 does not invent a different
  layout per service. Home services are **cards**, depending on that
  website component / design — 02 copies those website slots as the
  template has them.
- one **contact** website page
- one **privacy policy** website page (`page_type=legal`). **Legal** is a
  footer **heading** for pages like privacy policy — not a page type.
  Privacy policy sits under that heading. 03 does not rewrite the notice
  body (factory prose)
- two site-wide **look** website sections (`page_id` null: top-menu look,
  footer look)

Not in first pass unless an [open question](#open-questions) closes:
gallery website page, services index website page, testimonials website
page, terms of service, cookies.

Each website page in the template: default path, `page_type`, seo,
ordered website sections (`component_id`, design, website slot values as
`{{…}}` from [variables.md](variables.md) Common variables).

The website template may include site-wide `top_menu` / `footer`
(page / text / URL nodes). Copy website template pages copies those onto
`website.menus`. When omitted, the [menu constant](#menu-constant) is
the page+text default.

## Editable slots

Each website component `contract.json` lists `editable_slots[]`. Defined
once per website component. 02 explodes that list onto each website
section with that `component_id`. Website slot **values** live on
`website_slots`. Website slot **schema** stays on the contract. Go
parses a typed model (extra keys rejected).

Fields: `key`, `type`, `label`, `required`, `max_length`, optional
`omit_if_unresolved` (list of Common variable names). **Absent list =
never omit that website slot.** AND: omit paint only when every listed
var is empty. Worker / canvas pass `null` / omit the prop. Unpublished
row unchanged. Catalog:
[variables.md](variables.md#optional-omit).

Must not: persist a website slot or website section hide; infer omit
from every `{{…}}` in `value`; drop a whole website section because one
child website slot omitted. Owner eye is `website_sections.status`
only.

## Website component family

`family` is catalog metadata on the website component contract, not a
`website_sections` column. Preferred `component_id` is
`public.{family}.{variant}`. The catalog dump uses these preferred IDs
only. Contracts have no `aliases`. One `component_id` per website
component. Don't say proof: leftover predecessor IDs are not preferred
IDs.

| Family | Preferred IDs | Content |
| --- | --- | --- |
| `reviews` | `public.reviews.cards`, `public.reviews.panel` | Reviews (`website_slot_reviews`; cap from that website component) |
| `certifications` | `public.certifications.row` | Website slots (`{{certifications}}` items). Picker stays on Certifications and reviews |
| `content` | `public.content.intro_metrics`, `public.content.system_cards`, `public.content.image_tiles`, `public.content.metric_mosaic`, `public.content.intro`, `public.content.split`, `public.content.story_split`, `public.content.story_text`, `public.content.feature_grid`, `public.content.bar`, `public.content.logo_strip`, `public.content.leadership_grid`, `public.content.video_feature` | Website slots |
| `gallery` | `public.gallery.project_showcase`, `public.gallery.edge_grid`, `public.gallery.grid`, `public.gallery.poster_grid` | Projects gallery |
| `footer` | `public.footer.multi_column`, `public.footer.logo_nav`, `public.footer.standard`, `public.footer.centered_social_nav` | Footer look (`page_id` null) |
| `top_menu` | `public.top_menu.standard`, `public.top_menu.center_logo`, `public.top_menu.mega_menu`, `public.top_menu.fixed_cta` | Top-menu look (`page_id` null) |
| `hero` | `public.hero.image`, `public.hero.image_carousel`, `public.hero.scroll_story`, `public.hero.type_first`, `public.hero.type_first_trust`, `public.hero.overlay_title`, `public.hero.form` | Website slots |
| `services` | `public.services.grid`, `public.services.tabs`, `public.services.cards`, `public.services.simple_list`, `public.services.sector_tabs` | Website slots |
| `form` | `public.form.lead`, `public.form.callback_bar`, `public.form.project_planner` | Website forms |
| `contact` | `public.contact.panel`, `public.contact.cta_panel`, `public.contact.form_location` | Website slots |
| `faq` | `public.faq.accordion`, `public.faq.list` | Website slots |
| `process` | `public.process.steps` | Website slots |
| `cta` | `public.cta.band` | Website slots |
| `privacy` | `public.privacy.notice` | Website slots |
| `marquee` | `public.marquee.services` | Website slots |
| `statement` | `public.statement.words` | Website slots |
| `service_area` | `public.service_area.coverage`, `public.service_area.region_map_stats` | Website slots |

Display names: Reviews, Reviews, Certifications. Projects stay
`gallery`. Do not invent Domain terms for logo strip, leadership grid,
metric mosaic, bar, or video feature. Must not: persist `aliases` on a
website component contract; use a leftover predecessor `component_id`.

**Uniqueness** (join `component_id` to the contract; do not persist
`family`):

- Look sections (`page_id` null): at most one top-menu look (`family`
  `top_menu`) and one footer look (`family` `footer`) **per website**.
  `CopyWebsiteTemplatePages` and `create_section` must not add a second
  top-menu look or a second footer look.
- `reviews`, `certifications`, and `content` are **not** unique. A
  website page may have a certifications website section **and** a
  reviews website section. Several reviews website sections are allowed;
  each has its own `website_slot_reviews`.

Swap a website component only **within the same family** (compatible
website slots). Do not swap a reviews website component for a
certifications website component and keep slots.

## Copy onto the unpublished website (02)

1. Load the website template by `website_settings.website_template_id`.
2. Each template website page → one `website_pages` row: default path,
   `page_type`, seo. Copy the service website page **once per named
   service** (N ≥ 1). Same layout every time. Pre/Fail if the accepted
   profile has zero named services (complete should have blocked). Empty
   `business_profile_services` **during** the client interview is OK — no
   global ≥1 CHECK.
3. Explode each website section’s `editable_slots` into `website_slots`
   (`origin=website_template`). Non-slot layout props may stay on
   section `props` jsonb. Tokens stay. Go does not rewrite `{{…}}`.
   `omit_if_unresolved` stays on the website component contract (not a
   `website_slots` column). Worker / canvas join `component_id`.
4. **Image website slots:** if the contract website slot type is image,
   persist `slot_type=image`. Predecessor used a nested image object and
   dotted website slot keys — the image website slot key is `asset_id` on
   that object. Keep that dotted `slot_key`; persist a `{{images.*}}` /
   `{{logo_url}}` token. Never invent a hotlink URL. **Do not** attach
   `media_asset_id`. **Photo selection** is
   [03](pipeline/03-website-copy-generation.md). Drop extra predecessor
   hotlink URL fields (`url`, `image_url`, `generated_image_url`) on
   dump. Logo is not a 02 attach: publication emits `{{logo_url}}` from
   Details `logo_media_asset_id`.
5. `website_forms` / `website_form_fields` from form website sections’
   contracts, not a parallel root `forms[]`. `form_key` = the catalog
   form key on that website section. Ignore contract `submit_action` and
   extra field types / options. First-pass fields are the four website-lead
   columns ([ADR](ADR.md) 35).
6. Look website sections come from the website template (not empty
   synthesized rows).
7. If the website template includes site-wide `top_menu` / `footer`,
   copy those trees onto `website.menus` (`url` nodes → `website_urls`
   rows + `url_id` on the tree). Otherwise derive from the
   [menu constant](#menu-constant). Never copy a top menu onto every
   website page.
8. Validate against website component contracts before the unpublished
   website is kept.

Reviews website sections keep `{{reviews.N}}`. 02 does not insert
`website_slot_reviews`. Ranking is
[build-profile](../onboarding/pipeline/build-profile.md) (River job
`reviews_ranking_for_display`), not this catalog.

## Menu constant

Offer-first contractor IA. No services-index website page. **Legal** is a
footer heading only.

Service children: named services on the accepted profile, **list order**
(Details list / `business_profile_services` as of `accepted_edit_id`).
Same order in both trees. Cap **8 children**: first 8; extra service
website pages exist, omitted from menus until the owner adds them. At 02
there is at least one named service, so the Services heading is present.
Omit the Services heading (no empty text node) only for a **later** empty
list (owner deleted all named services).

Top menu (4 top-level, under cap 8):

1. Home (`page`)
2. Services (`text` heading) → service website pages (`page` children)
3. About (`page`)
4. Contact (`page`)

Privacy / legal-document pages are **not** on the top menu.

Footer (5 top-level, under cap 12):

1. Home (`page`)
2. About (`page`)
3. Services (`text` heading) → same children as the top menu
4. Contact (`page`)
5. Legal (`text` heading) → privacy policy (`page`)

Flags: `show_phone=true`, `show_email=false`, `show_contact=true`
(marketing phone is the contractor conversion in the bar; email stays on
the contact website page / tokens). Bar CTA **values** stay
`{{marketing_phone}}` / `{{marketing_email}}`.

Same pick + same named services → same trees. Owner / `update_menus` may
diverge later.

## Embed

Dump the same JSON under `catalog/` and `go:embed` it in the website
package (same as `prompts.yaml`). Source stays next to website
components; the dump is not a second schema. CI fails dump/source drift.
Go never reads catalog files off disk from the binary. Frontend and the
renderer keep reading the same JSON.

## Production-ready CI

A `production_ready` website template fails CI unless it has the expected
website pages and look sections, and every Common variable from
[variables.md](variables.md) appears at least once (`{{reviews.1}}`
counts as at least one `{{reviews.N}}`; `{{images.*}}` counts as at least
one `{{images.` token). No careers or blog. Do not turn this gate on
against current predecessor per-website-page JSON. Cutover after a real
website template index exists. Replace the predecessor website-template
intent checker as that gate.

## Suggested cuts vs predecessor

Inspiration only. Do not keep:

- `pages[]` wrapping one website page
- predecessor top-menu JSON array, or top menu / footer copied onto every
  website page
- root `forms[]` duplicating the form website section
- `route_variants` (baked competitor service copy)
- `modelled_after`, `companion_blueprints`, `affinity_group`,
  `multipage_reference_family`
- `default_slot_values.json` (second variable schema)
- contract `default_values` as a second overlay
- unbounded `additionalProperties: true`
- five hotlink URL fields

Tokens are [variables.md](variables.md) only. Retarget leftover
predecessor contact placeholders to `{{marketing_phone}}` /
`{{marketing_email}}`.

## Wait teaser and wait-end

The wait teaser is `/onboarding/preview`. **Wait-end** is when that screen
stops and the onboarding session becomes `preview_and_edit`
(`/onboarding/preview-and-edit/`).

Copy-done means the **home** website page has 03 copy. That is enough. Other
website pages finish **in parallel** (including after wait-end) on the same
`website_copy_generation` job. The **wait cap** (~15s) still ends the wait
teaser if home is not done yet.

## Open questions

Do **not** invent answers. Locked DAG, must-nots, tables, onboarding
status, and DB-oracle tests stay as they are.

**First pass extra pages.** Gallery website page, services index website
page, testimonials website page, terms of service, cookies.

**Website 01 picker.** Occupancy within 250 km among production-ready
website templates, then `website_id % len` tie-break. No LLM. No
`thread_kind=website_template_picker`. `website_template_id` is the
website template catalog id (string). Spec:
[01](pipeline/01-select-website-template.md).

**Worker binding name.** Unspecified: production service-binding **name**
(and whether auth is that binding vs a shared secret). DTOs, paths, both
SLO clocks, and OpenAPI ownership are locked in [website HTTP](api.md)
and [HTTP conventions](../../general-architecture/api.md). 03’s “for
example 8 pages” is an example, not a rule when the site has 4 or 12
website pages.
