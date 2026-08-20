# Variables (`{{var}}`)

Website placeholders in website content that resolve from the business profile at website
publication. The unpublished website keeps the tokens; website publication substitutes the real
values.

## Syntax

- `{{business_name}}` — a simple variable.
- `{{services.featured}}` / `{{images.logo}}` — a dotted path into a nested detail.
- `{{about.intro_paragraphs}}` — a list detail.

Two forms:

- **Exact** — the whole value is `{{var}}`: resolved to the typed detail value (string, list,
  object).
- **Substring** — `{{var}}` inside a larger string ("Welcome to {{business_name}}"): string
  substitution.

## The details

Variables resolve from **tenant default details** built from the business profile, business research,
and media assets: branding (address, logo, legal name, established year, incorporation,
service region, legal disclosure), images (per website slot image details), services (featured,
marquee, footer links, project types), projects (featured, recent, home gallery, projects website
page, categories), and certifications.

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
| `{{logo_url}}` | logo |
| `{{services.featured}}`, `{{services.marquee}}`, `{{services.footer_links}}`, `{{services.project_types}}` | services |
| `{{projects.featured}}`, `{{projects.recent}}`, `{{projects.home_gallery}}`, `{{projects.categories}}` | projects |
| `{{certifications}}` | certifications |
| `{{images.*}}`, `{{about.intro_paragraphs}}`, `{{about.feature_paragraphs}}` | images / about copy |

## Flow

1. A website template / website section writes **tokenized** values (`{{business_name}}`) into
   unpublished website records.
2. The website editor projection keeps the tokens and shows them as **inline variable chips** (with
   the variable's label), still editable.
3. **Website publication** resolves every variable against the tenant details — exact match → typed
   value, substring → substituted — and writes the resolved `website_manifest` (a published website
   copy).
4. A missing variable stays as a `{{var}}` token in the unpublished website; a *required* website
   slot whose variable can't resolve becomes a **website publication blocker**.
