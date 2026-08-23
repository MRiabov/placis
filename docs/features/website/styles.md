# Website styles (theme presets)

A **website style catalog preset** is the website's visual skin — one choice that sets colors,
typography, radius, density, spacing, and motion across every website section. The
`website_manifest` carries a `website_styles` field (preset id + bounded overrides), and the
contractor website applies it to all website components. Unpublished storage is `website_settings`
(one row per tenant).

## What a preset controls

- **Colors** — semantic roles (`primary`, `accent`, `neutral`, `background`, `surface`, `text`,
  `muted`, `border`, `focus`, `success`, `warning`, `danger`) that resolve to **Radix Colors**
  scales, not free-form palettes.
- **Typography** — heading/body font family, label tracking, heading/body weight, plus a
  display/h1/h2/body/label scale.
- **Radius** — `none`/`xs`/`sm`/`md`/`lg` (0/2/4/8/12px). This is the base corner for
  surfaces (cards, media, fields, panels). Capsule buttons and tags are a control shape on
  the preset, not `radius=pill` applied to every surface.
- **Density** — `compact`/`comfortable`/`spacious`.
- **Spacing** — `xs`–`2xl` (8–48px) plus website section block and container inline.
- **Motion** — easing, reveal duration, hover duration.

## Presets

`navy_cream`, `dark_serif`, `red_charcoal`, `institutional_mono`, `green_gold`, `navy_grid`,
`timbermill_classic`. Presets are **remixed colors** taken from decomposed reference sites, not
hand-picked palettes.

## How it flows

1. The preset is selected during generation (or changed in the Website styles workspace).
2. `website_manifest.website_styles` carries the preset id + bounded overrides (`primary`, `neutral`, `accent`,
   `radius`, `density`).
3. The renderer maps the preset tokens to CSS variables; every website component reads those tokens,
   so switching the preset restyles the whole website without touching website section logic.

Layout stays bounded to **layout presets**, not free-form CSS.
