# public.posts.list

## Purpose

Renders the public blog/news index from published post collection records. The component should only
be present in publication manifests when at least one post is published and public.

## Best Fit

Use this component for the generated `/news` collection index. It is a publication read model, not a
manual landing-page section.

## Key Props

Use `posts[]` for published post summaries and optional `eyebrow`, `title`, and `intro` text for
collection framing. Empty collections should omit the whole page instead of rendering an empty list.

## Style And Composition

The active public-site theme controls card spacing, text hierarchy, and image treatment.
