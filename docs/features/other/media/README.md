# Media

The photo library and image editing. One library: a full screen at `/cms/media`, and the same
library as a selectable **workspace item** in the website editor (Wix / Webflow: pick the
media library item on the left while you edit).

## What it is

- A library of the contractor's photos: their work, logos, and documents.
- Each media item carries a media caption (alt text), a focal point, a crop, **supplied by**
  (owner, business research, or AI), and a **processing status** (`uploading` /
  `processing` / `ready` / `failed`).
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

## Processing status

Photos have a processing status on the media item (`processing_status` —
[data-model.md](data-model.md)):

1. **Uploading…** — `uploading`: bytes are landing (`file_id` may still be empty). Target
   for Ads: the owner can use the photo in this ad within about **10 seconds** of starting
   the upload. Hover the thumb: a circle-and-cross button; click it to abort the bytes
   request. No media library item is left. Same overlay on `/cms/media`, the website editor
   media library, and Ads — not an Ads-only control.
2. **Processing…** — `processing`: Placis is writing the media caption and classifying visual
   issues (`submit_image_visual_issues`, parallel with captioning). The owner is never
   asked to label the photo. This is **not** a wait-to-use overlay in Ads: a photo the
   owner just added to an ad does not need a caption to be used there.
   If clutter / busy background / poor lighting / color cast is not null, a tailored default
   light cleanup runs on first upload (high first). Blur, overlay text, subject too small,
   and low resolution are suggestions only — no auto-upres.
3. **Ready** — `ready`: the media caption is always present. This is the pool the ads LLM
   picks from (LLM reads those captions).
4. **Failed** — `failed`: the upload did not land. UI is a warning with an upload sign
   ("Couldn't upload that photo — try again"), not a caption or review error.

This is separate from `review_status` (pending_review / approved / rejected). A photo already
in an ad is not shown as "still in review". The live website still requires `ready` +
`approved`. Ads: the LLM gallery ad draft uses `ready` + `approved`; an owner-added photo in
this ad is usable once bytes have landed (not `failed`), even if captioning is still
`processing`.

Thumbs in `/cms/media` and the website editor media library may show Uploading… /
Processing…. Ads shows **Uploading…** only while bytes land — not Processing… as a use-blocker.

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
  ([editing.md](../../website/editing.md)). The circle-and-cross on the thumb ends that in-flight upload.

Screens: [website frontend](../../website/frontend.md). Port:
[frontend-debloat.md](frontend-debloat.md).

## Used by

- **The website** — images inside website sections. Pending-review AI images may show on the
  unpublished canvas with a warning; owner approval makes them approved. Website publication
  and the live website still require `ready` + approved media.
- **Ads** — the LLM picks from `ready` + approved media captions. A photo the owner **adds
  to this ad** is usable once bytes have landed (about 10 seconds); captioning is
  background, not a gate. Ads thumbs show Uploading… only while bytes land.

## Review

Only `ready` + approved media can be used on the live website. Ads: LLM gallery drafts use
that same pool; an owner-added photo in an ad is usable once bytes have landed. The
unpublished website editor may show pending-review AI images with a warning.

Bytes live in [files](../../../general-architecture/files-and-s3.md) (`media_assets.file_id`).
HTTP: [api.md](api.md) (this resource owns upload; no `/v1/files`). Tables:
[persistence.md](persistence.md). Public-source imports (Maps photos, Facebook/Instagram
posts): [ETL](../etl/README.md).
