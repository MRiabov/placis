# public.services.cards

## Purpose

Use this component for image-led service cards where each service needs visual
proof and its own CTA.

## Best Fit

Good for source-site decompositions like roofing, building, landscaping, or
maintenance sites with service photos.

## Avoid

Avoid it when images are generic, mismatched, or unavailable. Use
`public.services.grid` for copy-led services.

## Key Props

Use `services[]` with `name`, `description`, `image_url`, `alt_text`, `href`,
and `cta_label`.

## Style And Composition

The style preset should control image ratio, card radius, CTA shape, and grid
alignment. The component should remain reusable across contractor styles.
