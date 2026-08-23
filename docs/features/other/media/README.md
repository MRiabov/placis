# Media

The photo library and image editing — a standalone part of the CMS, and a **left-side panel**
in the website editor.

## What it is

- A library of the contractor's photos: their work, logos, and documents.
- Each media item carries a media caption (alt text), a focal point, a crop, and **supplied by**
  (owner, business research, or AI).
- **Edits always create a copy.** The parent’s file is never replaced. Owner replace and AI
  cleanup both insert a new media library item with `parent_media_asset_id` set; a cleanup copy
  inherits supplied by from the parent. The copy stays pending review before it can be used.
  Uses (website slots, ads) keep the old item until they are pointed at the copy. Heavier
  editing stays here, not in ads.

## CMS panel (website editor)

On `/cms/website` the media library is the **left workspace panel** (with website pages,
website styles, top menu and footer). Not the editing panel (right).

- Drop image files onto that panel to upload into the media library. A file picker does the
  same. Ads’ “drop a photo anywhere” pattern is the same upload flow.
- Drag a media library item onto an image on the canvas to attach it to that website slot
  (discrete PATCH, not debounced typing).
- Drop an image file onto the canvas: upload into the media library, then attach if the drop
  is over an image website slot; otherwise the new item stays in the media library.

Screens: [website frontend](../../website/frontend.md).

## Used by

- **The website** — images inside website sections. Pending-review AI images may show on the
  unpublished canvas with a warning; owner approval makes them approved. Website publication
  and the live website still require approved media (with a media caption).
- **Ads** — only approved media with a media caption become ad images.

## Review

Only approved media (with a media caption) can be used on the live website or by ads. The
unpublished website editor may show pending-review AI images with a warning.

Bytes live in [files](../../../general-architecture/files.md) (`media_assets.file_id`).
Tables: [data-model.md](data-model.md).
