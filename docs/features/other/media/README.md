# Media

The photo library and image editing. One library: a full screen at `/cms/media`, and the same
library as a selectable **workspace item** in the website editor (Wix / Webflow: pick the
media library item on the left while you edit).

## What it is

- A library of the contractor's photos: their work, logos, and documents.
- Each media item carries a media caption (alt text), a focal point, a crop, and **supplied by**
  (owner, business research, or AI).
- **Edits always create a copy.** The parent’s file is never replaced. Copy-on-write
  (`parent_media_asset_id`) lives **inside** those functions, not a helper callers reimplement.
  Uses (website slots, ads) keep the old item until they are pointed at the copy. Heavier
  editing stays here, not in ads.

| Intent | Function | Child `file_id` | `review_status` |
| --- | --- | --- | --- |
| Attach | attach | none (no copy) | as-is |
| Crop / focal | crop / focal (may be one function, two fields) | same as parent | stay `approved` if parent is |
| AI cleanup | AI cleanup | new | `pending_review`; inherit `supplied_by` |
| Owner replace | replace | new | `pending_review` |

## Callers (same functions)

`/cms/media`, the website editor PATCH, the website assistant (`update_slot`, `cleanup_image`),
and ads light cleanup call these same functions. The assistant does not get a second attach,
crop, focal, or cleanup path. Ads light cleanup, when it writes a copy, calls this **AI cleanup**
— not an ads-only cleanup.

Replace and first upload take file bytes, so they stay on `/cms/media` / website editor drop. The
assistant has no replace or upload tool (no bytes on a tool). When a later slice adds one, it
still calls this replace / upload.

## `/cms/media`

The full media library screen (left-nav). Caption, crop, focal point, replace, AI cleanup.

## Website editor workspace

On `/cms/website` the left column is the **workspace**. Items are selectable (website pages,
media library, website styles, top menu, footer). Selecting **media library** opens that
library in the workspace — the same rows as `/cms/media`, for attach and upload while
editing. It is not a second library. Not the editing panel (right).

- Drop image files onto the media library workspace item to upload. A file picker does the
  same. Ads’ “drop a photo anywhere” pattern is the same upload flow.
- Drag a media library item onto an image on the canvas to attach it to that website slot
  (discrete PATCH, not text click-off).
- Drop an image file onto the canvas: upload into the media library, then attach if the drop
  is over an image website slot; otherwise the new item stays in the media library.
- An in-flight upload is covered by the website editor leave guard
  ([editing.md](../../website/editing.md)).

Screens: [website frontend](../../website/frontend.md). Port:
[frontend-debloat.md](frontend-debloat.md).

## Used by

- **The website** — images inside website sections. Pending-review AI images may show on the
  unpublished canvas with a warning; owner approval makes them approved. Website publication
  and the live website still require approved media (with a media caption).
- **Ads** — only approved media with a media caption become ad images.

## Review

Only approved media (with a media caption) can be used on the live website or by ads. The
unpublished website editor may show pending-review AI images with a warning.

Bytes live in [files](../../../general-architecture/files-and-s3.md) (`media_assets.file_id`).
HTTP: [api.md](api.md) (this resource owns upload; no `/v1/files`). Tables:
[data-model.md](data-model.md).
