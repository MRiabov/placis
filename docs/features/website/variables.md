# Variables (`{{var}}`)

Website placeholders in website content that **resolve website placeholders**
from `WebsiteBusinessProfileRead` ([website HTTP](api.md)). The unpublished
website keeps the tokens. Go does not rewrite slots. The Worker fills `{{…}}`
on `websiteRender` (website image render) and on `websitePublication`
(website HTML render).
The wait teaser and CMS canvas fill them in `frontend-2` with the shared
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
| `{{marketing_phone}}`, `{{marketing_email}}`, `{{address}}`, `{{existing_site_url}}` | marketing contact |
| `{{service_area}}`, `{{service_region}}` | where they work |
| `{{opening_hours}}` | opening hours |
| `{{legal_name}}`, `{{company_registration_number}}`, `{{vat_number}}`, `{{registered_office}}` | legal |
| `{{established_year}}`, `{{incorporation_date}}` | dates |
| `{{logo_url}}` | logo URL emitted at website publication **only from** `logo_media_asset_id` (our media library file). Not a hotlink and not a `website_settings` URL |
| `{{services.featured}}`, `{{services.marquee}}`, `{{services.footer_links}}`, `{{services.project_types}}` | services |
| `{{projects.featured}}`, `{{projects.recent}}`, `{{projects.home_gallery}}`, `{{projects.categories}}` | projects (**active** rows only; skip `draft`). Resolve from the live profile at publication; do not bake ranked-top-4 ids at copy-template-pages |
| `{{reviews.1}}` … | reviews from the ranked pool (not a per-section pick at copy-template-pages) |
| `{{certifications}}` | certifications |
| `{{images.*}}`, `{{about.intro_paragraphs}}`, `{{about.feature_paragraphs}}` | images / about copy |

## Flow

1. `CopyWebsiteTemplatePages` **persists into** unpublished website
   records as **tokenized** values (`{{business_name}}`).
2. The website editor projection keeps the tokens and shows them as
   **inline variable chips** (with the variable's label), still editable.
   Wait teaser and CMS canvas resolve for paint through frontend-2 + the
   website component package when current profile data can fill those
   placeholders.
3. `GenerateWebsiteCopy` **sends** `WebsiteRenderRequest` (dump plus
   `WebsiteBusinessProfileRead`) to `websiteRender`. **Website publication
   (04)** **sends** `WebsitePublicationRequest` (tokenized dump plus
   `WebsiteBusinessProfileRead`) to `websitePublication`. The Worker
   resolves every variable — exact match → typed value, substring →
   substituted — and writes HTML to R2. Go does not fill tokens.
4. A missing variable stays as a `{{var}}` token in the unpublished website;
   a *required* website slot whose variable can't resolve becomes a
   **website publication blocker**.
5. Live R2 is a snapshot. Later business research does not rewrite
   `latest/` until the next 04.
