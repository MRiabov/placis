# Variables (`{{var}}`)

Website placeholders in website content that **resolve website placeholders**
from `WebsiteBusinessProfileRead` ([website HTTP](api.md)). The unpublished
website keeps the tokens. Go does not rewrite slots. The Worker fills `{{…}}`
on `websiteRender` (website image render) and on `websitePublication`
(website HTML render).
The wait teaser and CMS canvas fill them in `frontend-3` with the shared
website component package from the same `*Read` (website page GET embed).
Attached image website slots keep a media library item id in the dump; Go
sends `media_asset_urls` on both Worker requests so the Worker can GET
that file. Token `{{images.*}}` / `{{logo_url}}` URLs stay on
`WebsiteBusinessProfileRead`.

Onboarding 05 (website 01 then 02) writes `{{…}}` detail tokens and leaves
them in place. Website copy generation (03) may overwrite prose slots but
must leave reusable detail tokens. Website publication (04) resolves
remaining tokens into HTML.

## Syntax

- `{{business_name}}` — a simple variable.
- `{{services.featured}}` / `{{images.logo}}` — a dotted path into a nested
  detail.
- `{{about.intro_paragraphs}}` — a list detail.
- `{{reviews.1}}` — the nth review in the **ranked pool** (1-based).

Two forms:

- **Exact** — the whole value is `{{var}}`: resolved to the typed detail value
  (string, list, object).
- **Substring** — `{{var}}` inside a larger string ("Welcome to
  {{business_name}}"): string substitution.

## The details

Variables resolve from **`WebsiteBusinessProfileRead`**, built from the
business profile, projects, ranked reviews, and media assets: branding
(address, logo, legal name, established year, incorporation, service region,
legal disclosure), images (per website slot image details), services
(featured, marquee, footer links, project types), projects (featured, recent,
home gallery, projects website page, categories), and certifications.

## Common variables

| Variable | Meaning |
| --- | --- |
| `{{business_name}}` | display name |
| `{{trade}}` | primary trade |
| `{{description}}` | business description |
| `{{marketing_phone}}`, `{{marketing_email}}`, `{{address}}`, `{{existing_site_url}}` | marketing contact. `{{address}}` is `registered_office` |
| `{{service_area}}`, `{{service_region}}` | where they work |
| `{{opening_hours}}` | opening hours |
| `{{legal_name}}`, `{{company_registration_number}}`, `{{vat_number}}`, `{{registered_office}}` | legal. `{{registered_office}}` is the same column as `{{address}}` |
| `{{established_year}}`, `{{incorporation_date}}` | dates |
| `{{logo_url}}` | logo URL emitted at website publication **only from** `logo_media_asset_id` (our media library file). Not a hotlink and not a `website_settings` URL |
| `{{services.featured}}`, `{{services.marquee}}`, `{{services.footer_links}}`, `{{services.project_types}}` | services |
| `{{projects.featured}}`, `{{projects.recent}}`, `{{projects.home_gallery}}`, `{{projects.categories}}` | projects (**active** rows only; skip `draft`). Resolve from the live profile at publication; do not bake ranked-top-4 ids at copy-template-pages |
| `{{reviews.1}}` … | reviews from the ranked pool (not a per-section pick at copy-template-pages) |
| `{{certifications}}` | certifications. Each item may carry optional `registry_url`; the Worker wraps the image/card in `<a href>` when that URL is set |
| `{{images.*}}`, `{{about.intro_paragraphs}}`, `{{about.feature_paragraphs}}` | images / about copy |

`emergency_phone` is unpublished Details Contact (how we reach the
owner). Not a Common variable. Do not add `{{emergency_phone}}`.

## Optional-omit

Some Common variables are **optional-omit**. The website component
contract may list them on `editable_slots[].omit_if_unresolved` (bare
names, no `{{…}}`). **Absent list = never omit that website slot**
(about copy that mentions `{{vat_number}}` stays). AND: Worker / canvas
omit that website slot’s **paint** only when every listed var is empty
on `WebsiteBusinessProfileRead`. Pass `null` / omit the prop — not
`""`, not leftover `{{vat_number}}`. Unpublished `website_slots.value`
stays the token.

Closed set (exact labeled website slots only):

- `{{vat_number}}`
- `{{legal_name}}`, `{{company_registration_number}}`
- `{{address}}` / `{{registered_office}}` (same column; complete-gate
  required **if registry**; omit the labeled line when there is no
  registry row)
- `{{opening_hours}}` (drop a whole `Opening hours: {{opening_hours}}`
  website slot, including predecessor substring labels)
- `{{existing_site_url}}`
- `{{established_year}}`, `{{incorporation_date}}` (if that website slot
  is the labeled date)
- `{{logo_url}}` / `{{images.logo}}` (hide the img; do not hide the
  footer / nav)
- `{{facebook_profile_url}}` (social / contact link website slot if
  present)
- `{{certifications}}` on a certifications **items** website slot that
  is not `required` (not the whole certifications website section)

Do **not** put omit lists on: required complete-gate keys
(`{{business_name}}`, `{{trade}}`, `{{marketing_phone}}`,
`{{marketing_email}}`, `{{services.*}}`,
`{{service_area}}` / `{{service_region}}`); about / copy
(`{{description}}`, `{{about.intro_paragraphs}}`,
`{{about.feature_paragraphs}}`); empty reviews / projects website
sections (keep the website component); menu `show_phone` /
`show_email`; eyebrow / title / intro layout website slots.

`required: true` + unresolved → `required_slot_unresolved`. Listed omit
and empty → hide that website slot’s output; not a publication blocker.
Production-ready CI still requires `{{vat_number}}` once per website
template (exact footer website slot).

This pass annotates existing matching `editable_slots` on
`packages/website-components/src/registry/footer/standard/contract.json`,
`footer/logo_nav`, `contact/panel` (`opening_hours`), and logo website
slots. Do not infer omit from every `{{…}}` in `value`.

## Flow

1. `CopyWebsiteTemplatePages` **persists into** `website_pages` /
   `website_sections` / `website_slots` / `website.menus` as
   **tokenized** values (`{{business_name}}`).
2. The website editor projection keeps the tokens and shows them as
   **inline variable chips** (with the variable's label), still editable.
   Wait teaser and CMS canvas resolve for paint through frontend-3 + the
   website component package when current profile data can fill those
   placeholders.
3. `GenerateWebsiteCopy` **sends** `WebsiteRenderRequest` (`profile`
   `WebsiteBusinessProfileRead`, `pages`, `media_asset_urls`) to
   `websiteRender`. **Website publication (04)** **sends**
   `WebsitePublicationRequest` (`dump` plus `WebsiteBusinessProfileRead`,
   `hostname`)
   to `websitePublication`. The Worker
   resolves every variable — exact match → typed value, substring →
   substituted — and writes HTML to R2. Go does not fill tokens.
4. A missing variable stays as a `{{var}}` token in the unpublished website;
   a *required* website slot whose variable can't resolve becomes a
   **website publication blocker**. Listed `omit_if_unresolved` + empty
   → omit that website slot’s paint; not a blocker.
5. Live R2 is a snapshot. Later business research does not rewrite
   `latest/` until the next 04. Canvas hydrate uses the live
   `WebsiteBusinessProfileRead` on the website page GET. Live `latest/`
   waits for the next 04 Website publication (or unpaid 08 Share).
