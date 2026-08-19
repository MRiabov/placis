# Media

The photo library and image editing — a standalone part of The CMS.

## What it is

- A library of the contractor's photos: their work, logos, and documents.
- Each media item carries a media caption (alt text), a focal point, and a crop.
- **AI image edits**: light cleanup (declutter, tidy a background) as non-destructive derived
  variants — the source photo is never changed, and the edited variant stays pending review before it
  can be used. Heavier editing stays here, not in ads.

## Used by

- **The website** — images inside website sections.
- **Ads** — only approved media with a media caption become ad images.

## Review

Only approved media (with a media caption) can be used by the website or by ads.

Bytes live in [files](../../../general-architecture/files.md) (`media_assets.file_id`).
Tables: [data-model.md](data-model.md).
