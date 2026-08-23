# public.posts.detail

## Purpose

Renders one published blog/news post. `body_markdown` is the source article body and is rendered
through the public markdown renderer with GFM enabled and raw HTML skipped. Legacy safe-rich-text
image blocks can still follow the markdown body for CMS-selected assets.

Markdown images support normal public URLs. Add title metadata such as `layout=wrap_right` or
`layout=wrap_left` when a markdown-authored image should use a side text-wrap layout. Hero images
continue to come from the typed `hero_image` field.

## Best Fit

Use this component for canonical post detail pages generated from `/api/v1/website/editor/posts`.
The typed post title renders as the page H1; duplicate leading markdown H1 text is ignored.

## Key Props

Use `post.title`, `post.excerpt`, `post.body_markdown`, `post.hero_image`, `post.published_at`, and
legacy `post.body` image blocks. Raw HTML should not be stored and is skipped during rendering.

## Style And Composition

The active public-site theme controls article spacing, markdown typography, tables, code, and image
layouts.
