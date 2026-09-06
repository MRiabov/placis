# Website components

`@placis/website-components` is the shared website component package. The
contractor website application renders from it. It must not import
`frontend-3`, shadcn CMS UI, or Kibo.

Each registry folder owns a `contract.json` sidecar beside the renderer:
identity, display name, props, website slots, and design controls. One
`component_id` per website component. Go embeds a dump of those sidecars
under `catalog/` instead of duplicating website component schemas. Model:
[website catalog](../../docs/features/website/catalog.md).

Website templates are catalog JSON Go copies onto the unpublished website
([02](../../docs/features/website/pipeline/02-copy-website-template-pages.md)).
Don't say blueprint: leftover predecessor page dumps stay under
`src/blueprints/` and are not the catalog.
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

`home.stub` is skeletal on purpose. Don't say blueprint: source-backed files
in `src/blueprints/` are design reference only and are not 01 picks. 01 does
not pick by trade 1:1. Website styles at 01 are that website template’s
associated website style catalog preset.

`pnpm --dir packages/website-components check` runs the style,
reference-boundary, and leftover-dump intent guards. Production-ready
website template CI (pages + variables coverage) cutover is
[catalog.md](../../docs/features/website/catalog.md) and
[ci-cd.md](../../docs/general-architecture/ci-cd.md).

## Website component IDs

Preferred `component_id` is `public.{family}.{variant}`. Closed family list:
[catalog.md](../../docs/features/website/catalog.md#website-component-family).
Contracts have no `aliases`.

## Website styles

Website components consume `website_styles` through CSS variables
(`--public-primary`, `--public-accent`, `--public-background`,
`--public-border`, `--public-muted`, `--public-radius`, `--public-text`).
Renderers emit semantic class names, not source-site selectors.

Presets under `src/themes/`: `navy_cream`, `dark_serif`, `red_charcoal`,
`institutional_mono`, `green_gold`, `navy_grid`, `timbermill_classic`. Token
and override rules:
[website styles](../../docs/features/website/styles.md). Each preset’s typed
tokens live in that folder’s `index.ts`.

## Loading

`loadWebsiteComponents(sections)` loads only the website component modules
referenced by a website page. The contractor website application passes those
into `WebsiteRenderer`. Prefer HTML first; hydrate a React island only when
that website section needs it.
