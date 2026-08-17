# Variables (`{{var}}`)

Template placeholders in website content that resolve from the business profile at publish time.
Drafts keep the tokens; publication substitutes the real values.

## Syntax

- `{{business_name}}` — a simple variable.
- `{{services.featured}}` / `{{images.logo}}` — a dotted path into a nested fact.
- `{{about.intro_paragraphs}}` — a list fact.

Two forms:

- **Exact** — the whole value is `{{var}}`: resolved to the typed fact value (string, list, object).
- **Substring** — `{{var}}` inside a larger string ("Welcome to {{business_name}}"): string
  substitution.

## The facts

Variables resolve from **tenant default facts** built from the business profile, research, and
assets: branding (address, logo, legal name, established year, incorporation, service region, legal
disclosure), images (per-slot image facts), services (featured, marquee, footer links, project
types), projects (featured, recent, home gallery, projects page, categories), and proof
(accreditations).

## Common variables

| Variable | Meaning |
| --- | --- |
| `{{business_name}}` | display name |
| `{{trade}}` | primary trade |
| `{{description}}` | business description |
| `{{phone}}`, `{{email}}`, `{{address}}`, `{{website_url}}` | contact |
| `{{service_area}}`, `{{service_region}}` | where they work |
| `{{opening_hours}}` | opening hours |
| `{{legal_name}}`, `{{company_registration_number}}`, `{{vat_number}}`, `{{registered_office}}` | legal |
| `{{established_year}}`, `{{incorporation_date}}` | dates |
| `{{logo_url}}` | logo |
| `{{services.featured}}`, `{{services.marquee}}`, `{{services.footer_links}}`, `{{services.project_types}}` | services |
| `{{projects.featured}}`, `{{projects.recent}}`, `{{projects.home_gallery}}`, `{{projects.categories}}` | projects |
| `{{proof.accreditations}}` | accreditations |
| `{{images.*}}`, `{{about.intro_paragraphs}}`, `{{about.feature_paragraphs}}` | images / about copy |

## Flow

1. A blueprint / section writes **tokenized** values (`{{business_name}}`) into draft records.
2. The editor projection keeps the tokens and shows them as **inline variable chips** (with the
   variable's label), still editable.
3. **Publish** resolves every variable against the tenant facts — exact match → typed value,
   substring → substituted — and materializes the resolved `site_manifest`.
4. A missing variable stays as a `{{var}}` token in the draft; a *required* slot whose variable
   can't resolve becomes a **publish blocker**.
