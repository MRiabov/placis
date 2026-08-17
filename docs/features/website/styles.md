# Styles (theme presets)

A **style preset** is the site's visual skin — one choice that sets colors, typography, radius,
density, spacing, and motion across every section. The `site_manifest` carries a `theme` field
(preset id + bounded overrides), and the public renderer applies it to all components.

## What a preset controls

- **Colors** — semantic roles (`primary`, `accent`, `neutral`, `background`, `surface`, `text`,
  `muted`, `border`, `focus`, `success`, `warning`, `danger`) that resolve to **Radix Colors**
  scales, not free-form palettes.
- **Typography** — heading/body font family, label tracking, heading/body weight, plus a
  display/h1/h2/body/label scale.
- **Radius** — `none`/`xs`/`sm`/`md`/`lg`/`pill` (0/2/4/8/12/9999px).
- **Density** — `compact`/`comfortable`/`spacious`.
- **Spacing** — `xs`–`2xl` (8–48px) plus section block and container inline.
- **Motion** — easing, reveal duration, hover duration.

## Presets

`navy_cream`, `dark_serif`, `red_charcoal`, `institutional_mono`, `green_gold`, `navy_grid`,
`timbermill_classic`.

## How it flows

1. The preset is selected during generation (or changed in the Styles workspace).
2. `site_manifest.theme` carries the preset id + bounded overrides (`primary`, `neutral`, `accent`,
   `radius`, `density`).
3. The renderer maps the preset tokens to CSS variables; every component reads those tokens, so
   switching the preset restyles the whole site without touching section logic.

Layout stays bounded to **layout presets**, not free-form CSS.
