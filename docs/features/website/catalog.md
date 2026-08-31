# Website template catalog

The catalog object [01](pipeline/01-select-website-template.md) picks and
[02](pipeline/02-copy-website-template-pages.md) copies. Go parses a **typed
model** (extra keys rejected). Style is `website_settings.preset_id`, not a
field on the website template.

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
  services on the accepted profile (same sections and slots; path and
  title from that service name / [persistence](persistence.md) website
  page path rules). 03 does not invent a different layout per service
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
ordered website sections (`component_id`, design, slot values as `{{…}}`
from [variables.md](variables.md) Common variables).

## Copy onto the unpublished website (02)

1. Load the website template by `website_settings.website_template_id`.
2. Each template website page → one `website_pages` row: default path,
   `page_type`, seo. Copy the service website page **once per named
   service**. Same layout every time.
3. Explode each website section’s `editable_slots` into `website_slots`
   (`origin=website_template`). Non-slot layout props may stay on
   section `props` jsonb. Tokens stay. Go does not rewrite `{{…}}`.
4. **Image slots:** if the contract slot type is image, persist
   `slot_type=image`. Predecessor used a nested image object and dotted
   slot keys — the image slot key is `asset_id` on that object. Keep that
   dotted `slot_key`; persist a `media_asset_id` or a `{{images.*}}` /
   `{{logo_url}}` token. Never invent a hotlink URL. Drop extra
   predecessor hotlink URL fields (`url`, `image_url`,
   `generated_image_url`) on dump.
5. **Photo pick:** use ETL **media caption** and **photo kind** (`hero` /
   `project` / `service` / `founder` / `logo`). Not filename. 02 stays
   deterministic (no LLM). Scoring is an [open question](#open-questions).
6. `website_forms` / fields from form website sections’ contracts, not a
   parallel root `forms[]`. `form_key` = the catalog form key on that
   website section.
7. Look website sections come from the website template (not empty
   synthesized rows).
8. Derive `website.menus` from the [menu constant](#menu-constant). Do
   not copy catalog menu JSON.
9. Validate against website component contracts before the unpublished
   website is kept.

## Menu constant

Offer-first contractor IA. No services-index website page. **Legal** is a
footer heading only.

Service children: named services on the accepted profile, **list order**
(Details list / `business_profile_services` as of `accepted_edit_id`).
Same order in both trees. Cap **8 children**: first 8; extra service
website pages exist, omitted from menus until the owner adds them. Zero
named services: omit the Services heading (no empty text node).

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

## Review ranking

**LLM ranking** (`thread_kind=website_reviews_ranking`), not stars or
recency. Runs parallel to client interview if the pool exists, and again
when ETL finishes. Writes **top reviews** on
`business_profile_reviews.is_top` / `top_position` (same replace as
Certifications and reviews PATCH). `{{reviews.N}}` is 1-based into that
ranked `in_pool` order at 04 and canvas/wait-teaser hydrate. 02 does not
insert `website_slot_reviews`. Ranking prompt lives in `prompts.yaml` on
that thread (not specified here).

## Open questions

Do **not** invent answers. Locked DAG, must-nots, tables, onboarding
status, and DB-oracle tests stay as they are.

**02 leftovers.** Zero named services (omit service website pages, or
one generic `/services`?). Home services grid: expand N cards at 02 vs
leave `{{services.*}}`. Photo scoring given **media caption** and photo
kind (first unused of that photo kind vs media caption similarity).
Gallery / services index / testimonials website pages. Terms of service /
cookies.

**Website 01 picker — out until the stacked rewrite.** Persist columns
are named (`website_template_id`, `preset_id`). Unspecified:
`website_template_id` type (catalog path vs uuid vs string id); picker
output schema / `prompts.yaml`; heuristic table (`trade → website
template, else default`). Do not implement the LLM picker on this
branch.

**River job.** Unique key = `tenant_id` is locked. Unspecified: closed
River job enum value for onboarding 06 / website 03; args struct
(`tenant_id` vs `onboarding_session_id`); whether 409 is River
unique-insert or an HTTP check before insert.

**Worker internal render.** Unspecified: URL or service binding name;
request body (full dump vs one website page); how a batch is encoded;
auth vs binding; timeout vs the SLO table. 03’s “for example 8 pages”
is an example, not a rule when the site has 4 or 12 website pages. Do
not invent an RPC to close 04 “don’t spec Worker RPC” vs the 03 SLO.

**Wait-end clock.** Copy-done or ~15s cap → `preview_and_edit` →
`/onboarding/preview-and-edit/`. Unspecified: who writes the status (05
job, 06 job, or preview GET); 15s server vs frontend; what “copy-done”
means (first 4 website pages? cap hit? job `completed`?).
