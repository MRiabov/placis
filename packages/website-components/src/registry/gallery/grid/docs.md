# public.gallery.grid

## Purpose

Use this component to show project or work images as a grid, packed image set,
or native scroll-snap carousel.

## Best Fit

Good for previous work, project proof, source-site static galleries, and
source-site image carousels.

## Avoid

Avoid it when images are low quality, unapproved, duplicated, or unrelated to
the service.

## Key Props

Use `items[]` with title, caption/category, image URL or generated image URL,
and alt text. Set `layout` to `grid`, `packed`, or `carousel`. Carousel mode
uses slide-count controls; packed mode is static and leaves image geometry to
the style preset.

## Style And Composition

The style preset should control image ratio, gap, captions, controls, and
responsive behavior. Swipe behavior should work naturally on mobile.
