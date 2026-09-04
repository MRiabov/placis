# Website styles (theme presets)

A **website style catalog preset** is the website's visual skin — one choice
that sets colors, typography, radius, density, spacing, and motion across every
website section. The `website_manifest` carries a `website_styles` field (preset
id + bounded overrides), and the contractor website applies it to all website
components. Unpublished storage is `website_settings` (one row per website).

## What a preset controls

- **Colors** — semantic roles (`primary`, `accent`, `neutral`, `background`,
  `surface`, `text`, `muted`, `border`, `focus`, `success`, `warning`, `danger`)
  that resolve to **Radix Colors** scales, not free-form palettes.
- **Typography** — heading/body font family, label tracking, heading/body
  weight, plus a display/h1/h2/body/label scale.
- **Radius** — `none`/`xs`/`sm`/`md`/`lg` (0/2/4/8/12px). This is the base
  corner for surfaces (cards, photos, fields, panels). Capsule buttons and tags
  are a control shape on the preset, not `radius=pill` applied to every surface.
- **Density** — `compact`/`comfortable`/`spacious`.
- **Spacing** — `xs`–`2xl` (8–48px) plus website section block and container
  inline.
- **Motion** — easing, reveal duration, hover duration.

## Presets

`navy_cream`, `dark_serif`, `red_charcoal`, `institutional_mono`, `green_gold`,
`navy_grid`, `timbermill_classic`. Presets are **remixed colors** taken from
decomposed reference sites, not hand-picked palettes.

## How it flows

1. [01 select website template](pipeline/01-select-website-template.md) sets
   `preset_id` to that website template’s associated website style catalog
   preset. The owner may change Website styles later in the CMS.
2. `website_manifest.website_styles` carries the preset id + bounded overrides
   (`primary`, `neutral`, `accent`, `radius`, `density`). The Website styles
   workspace edits those three colors with a color picker (hex is only inside
   the picker, not on the field). Radius is a corner selector (`none` / `xs` /
   `sm` / `md` / `lg`), not a text dropdown: each option shows that corner.
   Density is a spacing selector (Compact / Comfortable / Spacious), not a text
   dropdown: each option shows that spacing.
3. The renderer maps the preset tokens to CSS variables; every website component
   reads those tokens, so switching the preset restyles the whole website
   without touching website section logic.

Layout stays bounded to **layout presets**, not free-form CSS.
