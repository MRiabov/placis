# Website components

`@placis/website-components` is the shared website component package. The
contractor website application and the `frontend-2` website editor canvas both
render from it. It must not import `frontend-2`, shadcn CMS UI, or Kibo.

Each registry folder owns a `contract.json` sidecar beside the renderer:
identity, display name, props, website slots, design controls, and aliases. Go
embeds a dump of those sidecars under `catalog/` instead of duplicating website
component schemas. Model: [website catalog](../../docs/features/website/catalog.md).

Website templates are catalog JSON Go copies onto the unpublished website
([02](../../docs/features/website/pipeline/02-copy-website-template-pages.md)).
`src/blueprints/` is leftover predecessor page dumps, not the catalog.
Website style catalog presets live under `src/themes/`. First-pass website
page types are `home` / `about` / `service` / `contact` / `legal`. Blog and
careers are deferred and are not in this package. 01 lists
`production_ready=true` website templates only.

## Website templates

Reusable website templates are backend-readable catalog data, not a live
website and not tenant-owned content. The backend validates them against
website component `contract.json` files, then copies them onto unpublished
website pages, website sections, website slots, website forms, and derives
the top menu and footer. Website template JSON is the contract. Selection
and visual rules live in
[website architecture](../../docs/features/website/architecture.md),
[website catalog](../../docs/features/website/catalog.md), and
[website styles](../../docs/features/website/styles.md).

`home.stub` is skeletal on purpose. Source-backed files in `src/blueprints/`
are design reference only and are not 01 picks. 01 does not pick by trade
1:1. Website styles at 01 are that website template’s associated website
style catalog preset.

`pnpm --dir packages/website-components check` runs the style,
reference-boundary, and website-template intent guards. Production-ready
website template CI (pages + variables coverage) cutover is
[catalog.md](../../docs/features/website/catalog.md) and
[ci-cd.md](../../docs/general-architecture/ci-cd.md).

## Website component IDs

New website manifests should use family/variant IDs. Compatibility aliases keep
older `public.*.v1` manifests renderable.

| Preferred ID | Compatibility aliases | Purpose |
| -- | -- | -- |
| `public.hero.image` | `public.hero.v1` | First-viewport headline, CTA, proof line, and image/media area. |
| `public.navigation.standard` | None | Top menu strip, logo, optional service links, and mobile menu. |
| `public.navigation.fixed_cta` | None | Fixed top menu with brand mark, links, mobile menu, and CTA. |
| `public.marquee.services` | None | Service/category ticker for compact capability lists. |
| `public.hero.form` | None | First-viewport headline plus website form. |
| `public.hero.type_first` | None | Typography-led first viewport when imagery is weak or secondary. |
| `public.hero.type_first_trust` | None | Typography-led first viewport with background media, CTA row, and trust strip. |
| `public.hero.overlay_title` | None | Full-bleed image intro with overlay top menu spacing and centered title band. |
| `public.services.grid` | `public.services.v1`, `public.services_grid.v1` | Service cards with short copy and optional links. |
| `public.services.tabs` | None | Tabbed/featured service category section with image, copy, checklist, and CTA. |
| `public.services.cards` | None | Image-led service cards, each with its own CTA. |
| `public.services.simple_list` | None | Ruled text-only service labels. |
| `public.content.intro` | None | Centered eyebrow, heading, and short body copy. |
| `public.content.split` | None | Two-column copy and image website section. |
| `public.content.story_split` | None | Editorial story section with media, long-form copy, and optional attribution. |
| `public.content.feature_grid` | None | Feature/process/option cards. |
| `public.statement.words` | None | Editorial statement block with large emphasized words. |
| `public.service_area.coverage` | None | Areas served and local coverage messaging. |
| `public.process.steps` | None | Step-by-step project journey with detail copy. |
| `public.proof.bar` | `public.trust.v1`, `public.service_summary.v1` | Compact proof points. |
| `public.proof.accreditations` | None | Certification/logo proof row. |
| `public.proof.logo_strip` | None | Supplier, brand, and certification logos. |
| `public.proof.testimonials` | None | Review cards with optional ratings. |
| `public.proof.review_panel` | None | Featured review panel with source, controls, and supporting label. |
| `public.gallery.edge_grid` | None | Edge-to-edge project gallery grid. |
| `public.gallery.grid` | `public.gallery.v1` | Project gallery with captions, grid, or scroll-snap carousel. |
| `public.gallery.poster_grid` | None | Image poster grid with overlay captions. |
| `public.faq.accordion` | None | FAQ questions and answers. |
| `public.faq.list` | None | FAQ list as native details/summary rows. |
| `public.form.lead` | `public.lead_form.v1` | Website form. |
| `public.form.callback_bar` | None | Compact callback request strip. |
| `public.form.project_planner` | None | Project scope planner with select/range inputs. |
| `public.cta.band` | None | Full-width CTA band. |
| `public.contact.cta_panel` | None | Contact CTA panel with email, marketing phone, and messaging actions. |
| `public.contact.form_location` | None | Contact website page with location details, map slot, and website form fields. |
| `public.contact.panel` | `public.contact_panel.v1`, `public.contact.v1` | Contact details, service area, and hours. |
| `public.footer.centered_social_nav` | None | Centered footer with logo, social links, links, contact line, and legal text. |
| `public.footer.logo_nav` | None | Footer with logo, links, legal line, and registration/VAT identifiers. |
| `public.footer.standard` | None | Footer links, legal/contact line, and registration/VAT identifiers. |
| `public.privacy.notice` | `public.privacy_notice.v1` | Website form privacy notice website section. |

## Website styles

Website components consume `website_styles` through CSS variables
(`--public-primary`, `--public-accent`, `--public-background`,
`--public-border`, `--public-muted`, `--public-radius`, `--public-text`).
Renderers emit semantic class names, not source-site selectors.

Presets under `src/themes/`: `navy_cream`, `dark_serif`, `red_charcoal`,
`institutional_mono`, `green_gold`, `navy_grid`, `timbermill_classic`. Token and
override rules: [website styles](../../docs/features/website/styles.md). Each preset’s typed tokens live in that
folder’s `index.ts`.

## Loading

`loadPublicSiteComponents(sections)` loads only the website component modules
referenced by a website page. The contractor website application passes those
into the renderer. Prefer HTML first; hydrate a React island only when that
website section needs it.
