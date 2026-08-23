# navy_grid_home.reference

## Purpose

Source-backed home-page decomposition with editorial hero panels, metric proof, system cards, and image-led destination tiles.

## Use When

Use this home page when the tenant has the content depth, proof, imagery, navigation needs, and conversion path required by the structure. Do not infer organization scale, market category, or service category from this blueprint.

## Content Encoded

This blueprint encodes page structure, component composition, editable slots, forms, source references, review metadata, and publication blockers. Source attribution aliases belong in the nullable `modelled_after` array and section source metadata.

## Section Sequence

- `public.navigation.center_logo`
- `public.hero.scroll_story`
- `public.proof.metric_mosaic`
- `public.content.system_cards`
- `public.content.image_tiles`
- `public.footer.logo_nav`

The scroll-story section models a first-viewport hero plus three editorial scroll-stop statements without depending on source-site animation scripts. The metric mosaic uses the tenant-derived `proof.hero_stats` slot instead of source-specific office, revenue, or certification claims; if a tenant does not have proof facts, the section should stay sparse rather than invent scale.

## Style Boundary

This blueprint does not encode visual style. Pair it with any compatible theme preset; reusable IDs, docs, and selectors must stay neutral so content and style can be swapped independently.

## Runtime Selection Notes

Keep review metadata on imported or generated facts until an operator approves the tenant-specific copy, claims, assets, forms, and links.
