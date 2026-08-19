# Media

The photo library and image editing — a standalone part of The CMS.

## What it is

- A library of the contractor's photos: their work, logos, and documents.
- Each media item carries a media caption (alt text), a focal point, a crop, and **supplied by**
  (user, research, or AI).
- **Edits always create a copy.** The parent’s file is never replaced. User replace and AI
  cleanup both insert a new media library item with `parent_media_asset_id` set; a cleanup copy
  inherits supplied by from the parent. The copy stays pending review before it can be used.
  Uses (website slots, ads) keep the old item until they are pointed at the copy. Heavier
  editing stays here, not in ads.

## Used by

- **The website** — images inside website sections.
- **Ads** — only approved media with a media caption become ad images.

## Review

Only approved media (with a media caption) can be used by the website or by ads.

Bytes live in [files](../../../general-architecture/files.md) (`media_assets.file_id`).
Tables: [data-model.md](data-model.md).
