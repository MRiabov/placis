---
version: alpha
name: Public Site Style Presets
description: "Google-style DESIGN.md reference for CMS style preset tokens."
colors:
  primary: "#1c2024"
  accent: "#e5484d"
  neutral: "#ffffff"
  surface: "#f8f9fa"
  muted: "#60646c"
  border: "#d9d9e0"
  focus: "#0090ff"
  success: "#30a46c"
  warning: "#f5d90a"
  danger: "#e5484d"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: 56px
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: 0
  h1:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: 44px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: 0
  h2:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.16
    letterSpacing: 0
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
rounded:
  none: 0px
  xs: 2px
  sm: 4px
  md: 8px
  lg: 12px
  pill: 9999px
spacing:
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  page-margin-mobile: 24px
  page-margin-desktop: 32px
  content-max: 1180px
  header-height-mobile: 58px
  header-height-desktop: 72px
components:
  page-shell:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: 0px
  section:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "{spacing.3xl} {spacing.lg}"
  card:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.neutral}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: 44px
    padding: "0 {spacing.lg}"
  button-secondary:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: 44px
    padding: "0 {spacing.lg}"
  divider:
    backgroundColor: "{colors.border}"
    height: 1px
    padding: 0px
---

# Public Site Style Presets DESIGN.md

## Overview

CMS style presets define the reusable visual skin for public-site components. The serialized
manifest field can still be named `theme` for compatibility, but product and editor language should
treat these files as style presets: swappable color roles, typography, radius, density, spacing,
imagery treatment, and interactive states.

Style presets are orthogonal to content and blueprints. A preset may be inspired by a source site or
brand reference, but it should still be able to render any compatible CMS content and public
component tree. Source names belong in source/provenance metadata, not reusable preset IDs, CSS
classes, package exports, public renderer selectors, or selection guidance. Use visual names such as
`red_charcoal`, `dark_serif`, `green_gold`, or `navy_grid` rather than a source brand or business
category.

Any compatible content tree should be previewable through any compatible style preset without
changing the blueprint JSON or component renderer markup. For example, content created from a
`red_charcoal_home.reference` blueprint should be previewable through `theme.navy_cream`, and
content created from a `split_trust_home.reference` blueprint should be previewable through
`theme.red_charcoal`.

The expected result of a cross-style preview is a coherent style swap, not a bespoke redesign. The
page should keep readable content, stable layout, valid images, accessible interactions, and no
horizontal overflow. It does not need to match the source site that inspired the style preset.

## Colors

All publication-ready color roles must resolve to Radix Colors-backed scales and steps. Imported
source colors can be kept as provenance, but production tokens should normalize into semantic roles:
primary, accent, neutral, surface, muted, border, focus, success, warning, and danger.

## Typography

Style presets own the visual type scale. Components should consume semantic text roles instead of
hardcoding one source site's font sizes or weights. Letter spacing should default to `0` unless a
source-backed style preset explicitly justifies another value.

## Layout

The preset defines default container width, page gutters, section padding, radius, density, and
button/card rhythm. Components own semantic structure; the style preset owns the reusable visual
treatment.

## Responsive Behavior

Mobile is the acceptance viewport. Presets should define mobile gutters and header height before
desktop values. Components can stack, scroll, or hide controls, but their color, type, and spacing
should remain governed by the preset.

## Components

Public components should map their semantic classes to these token roles. Tailwind classes, CSS
variables, and Radix theme variables should all derive from the same CMS style preset.

Style presets may target semantic public component classes and design-control hooks. They must not
depend on imported-site-specific selectors such as a single contractor's class names, and they must
not require blueprints to emit special markup only for that preset. If a visual treatment needs a
new structural affordance, add it as a reusable public component contract or governed design control
first, then style that semantic hook in the preset.

Reusable style artifacts must not encode company-size or business-type affinity. Avoid preset IDs,
CSS classes, exports, notes, and selection guidance that describe a style as for `contractor`,
`enterprise`, `commercial`, `residential`, `small`, `large`, `smb`, or `solo` sites. A style preset
is selected by visual treatment and compatibility with the current component/content tree, not by
assuming tenant size or market category.

## Do's and Don'ts

- Do normalize color roles to approved Radix Colors-backed scales.
- Do keep visual choices in style presets rather than component logic.
- Do keep source attribution in source/provenance metadata, not reusable IDs, CSS classes, exports,
  renderer selectors, or selection guidance.
- Do use stable tokens for radius, density, section spacing, focus, hover, and active states.
- Do verify new presets against at least one non-native compatible content/component tree when
  practical.
- Don't store tenant copy, proof claims, or service facts in a style preset.
- Don't encode section order, page content, or blueprint selection rules in a style preset.
- Don't promote arbitrary source hex palettes into production tokens without normalization.
- Don't require reusable public components to emit source-site-specific class names for a preset to
  work.
- Don't encode source brands, company-size labels, or business-type affinity in reusable style names,
  theme classes, package exports, or preset docs.
