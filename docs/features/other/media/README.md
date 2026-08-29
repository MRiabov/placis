# Media

The photo library and image editing. One library: full screen at `/cms/media`
under **Profile**. In the website editor, attach and pick from **Content** when
an image is selected on the canvas (same rows). Crop, focal, and cleanup stay on
`/cms/media`.

## What it is

- A library of the contractor's photos: their work, logos, and documents.
- Each media item carries a media caption (alt text), a focal point, a crop,
  **supplied by** (owner, business research, or AI), and a **processing status**
  (`uploading` / `processing` / `ready` / `failed`).
- **Edits always create a copy.** The parent’s file is never replaced.
  Copy-on-write (`parent_media_asset_id`) lives **inside** those functions, not
  a helper callers reimplement. Uses (website slots, ads) keep the old item
  until they are pointed at the copy. Heavier editing stays here, not in ads.

| Intent | Function | Child `file_id` | `review_status` |
| --- | --- | --- | --- |
| Attach | attach | none (no copy) | as-is |
| Crop / focal | crop / focal (may be one function, two fields) | same as parent | stay `approved` if parent is |
| AI cleanup | AI cleanup | new | `pending_review`; inherit `supplied_by` |
| Owner replace | replace | new | `pending_review` |

## Callers (same functions)

`/cms/media`, the website editor PATCH, the assistant (`update_slot`,
`cleanup_image`), and the ads Review orb call these same functions. The
assistant does not get a second attach, crop, focal, or cleanup path. Ads
Review, when it writes a copy, POSTs `/v1/media-assets/{id}/image-edits` and
then PATCHes **that** placement — not `POST /v1/ads/…/cleanup`.

Replace and first upload take the file, so they stay on `/cms/media` / website
editor drop. The assistant has no replace or upload tool (no file on a tool).
When a later slice adds one, it still calls this replace / upload.

## Processing status

Photos have a processing status on the media item (`processing_status` —
[persistence.md](persistence.md)):

1. **Uploading…** — `uploading`: the file is uploading (`file_id` may still be
   empty). Target for Ads: the owner can use the photo in this ad within about
   **10 seconds** of starting the upload. Hover the thumb: a circle-and-cross
   button; click it to abort the upload request. No media library item is left.
   Same overlay on `/cms/media`, the website editor media library, and Ads — not
   an Ads-only control.
2. **Processing…** — `processing`: Placis is writing the media caption and
   classifying visual issues (`submit_image_visual_issues`, parallel with
   captioning). The owner is never asked to label the photo. This is **not** a
   wait-to-use overlay in Ads: a photo the owner just added to an ad does not
   need a caption to be used there. If clutter / busy background / poor lighting
   / color cast is not null, a tailored default light cleanup runs on first
   upload (high first). Blur, overlay text, subject too small, and low
   resolution are suggestions only — no auto-upres.
3. **Ready** — `ready`: the media caption is always present. This is the pool
   the ads LLM picks from (LLM reads those captions).
4. **Failed** — `failed`: the upload did not land. UI is a warning with an
   upload sign ("Couldn't upload that photo — try again"), not a caption or
   review error.

This is separate from `review_status` (pending_review / approved / rejected). A
photo already in an ad is not shown as "still in review". The live website still
requires `ready` + `approved`. Ads: the LLM gallery ad draft uses `ready` +
`approved`; an owner-added photo in this ad is usable once the photo is uploaded
(not `failed`), even if captioning is still `processing`.

Thumbs in `/cms/media` and the website editor media library may show Uploading…
/ Processing…. Ads shows **Uploading…** only while the photo is uploading — not
Processing… as a use-blocker.

## `/cms/media`

The full media library screen, under **Profile** (not a top-level left-nav
item). Caption, crop, focal point, replace, AI cleanup.

**Look.** A large **view** of the selected photo (the frame follows landscape,
square, or portrait; the photo is not forced square). That same view is where
they compare cleanup. Promptable AI cleanup sits in a prompt box **beside** the
view on a wide screen and **under** it on a narrow screen — not the Ads Review
overlay orb. Same light cleanup as ads / the assistant `cleanup_image`
(declutter, tidy background; not invent work). Required overlay prompt,
`maxLength` 500, on `POST …/image-edits`. Empty prompt is rejected. First upload
may already have run a tailored default; this prompt is a **different** cleanup.
Cleanup takes **5–10 seconds**. The large view stays on the photo with
**Cleaning up…**, a scan across the photo, and a filling bar. Then the view is
the ads **before/after sweep** (drag the divider to
clip, not resize) with **Accept** / **Reject**. Accept keeps the copy
(`pending_review`) — no Accept HTTP, not `POST …/approve`. Reject is
`POST …/reject` (archives the copy).

**Thumbs.** Twenty to forty photos is expected. Up to ten: **3** columns on a
wide screen, **2** on a narrow screen. More than ten: **4** columns on a wide
screen, **2** on a narrow screen. Tiles stay small. Landscape, square, and
portrait keep their ratio. The same thumbs are the cover overlay on
`/cms/projects/{id}` and the image pick in website editor Content.

Crop / focal stay on this screen, on the selected photo in the view. It is not a
second library. **Widget:** Crop is a rect overlay (Full vs rect). Focal is a
draggable point on the large view. Save on click-off
(`PATCH /v1/media-assets/{id}`). Ads placement crop/focal stay on
`ad_image_placements` (framing **this ad**, inherited at attach).

## Website editor

On `/cms/website` there is no media library rail item. Click an image on the
canvas and **Content** shows the same rows as `/cms/media` for attach, pick, and
upload. Crop / focal / cleanup stay on `/cms/media`. It is not a second library.

- **Upload** is the tile / file picker in Content. Drop onto that tile still
  uploads; the prompt is not drag-and-drop.
- Drag a media library item onto an image on the canvas to attach it to that
  website slot (discrete PATCH, not text click-off).
- Drop an image file onto the canvas: upload into the media library, then attach
  if the drop is over an image website slot; otherwise the new item stays in the
  media library.
- An in-flight upload is covered by the website editor leave guard
  ([editing.md](../../website/editing.md)). The circle-and-cross on the thumb ends that in-flight upload.

Screens: [website frontend](../../website/frontend.md). Port:
[frontend-debloat.md](frontend-debloat.md).

## Used by

- **The website** — images inside website sections. Pending-review AI images may
  attach on the unpublished canvas; the warning is in Content when that image is
  selected, not copy on the website. Owner approval makes them approved. Website
  publication and the live website still require `ready` + approved media.
- **Ads** — the LLM picks from `ready` + approved media captions. A photo the
  owner **adds to this ad** is usable once the photo is uploaded (about 10
  seconds); captioning is background, not a gate. Ads thumbs show Uploading…
  only while the photo is uploading.

## Review

Only `ready` + approved media can be used on the live website. Ads: LLM gallery
drafts use that same pool; an owner-added photo in an ad is usable once the
photo is uploaded. The unpublished website editor may attach pending-review AI
images; the warning is in Content, not copy on the website.

Files live in [files](../../../general-architecture/files-and-s3.md) (`media_assets.file_id`). HTTP: [api.md](api.md) (this resource
owns upload; no `/v1/files`). Tables: [persistence.md](persistence.md). Public-source imports
(Maps photos, Facebook/Instagram posts): [ETL](../etl/README.md).
