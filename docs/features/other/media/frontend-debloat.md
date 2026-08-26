# Media library `frontend-2` port — what to reduce

Status: planning (port instructions, not shipped UI).

## Target

[README.md](README.md), [persistence.md](persistence.md), [api.md](api.md),
[website frontend](../../website/frontend.md) (Content attach + `/cms/media`).
Shared rules: [planning index](../../../../planning/frontend-debloat.md).

## Code today

- In the website editor, the library: `frontend-2/src/features/cms/editor/media/MediaWorkspacePanel.tsx`
  (~607 lines), `mediaModel.ts`.
- Upload/attach handlers: `useEditorMediaHandlers.ts`.
- API in `cms.ts`: `listEditorAssets`, create/patch asset, file upload, signed URL,
  complete, `createEditorAssetImageEdit`, `attachEditorAssetToSlot`.
- No `/cms/media` route in `app/router/index.tsx`.
- Unused media-modal / careers-adjacent CSS in
  `frontend-2/src/styles/cms/components-04.css`.

## Keep

- One library: `/cms/media` under Profile, plus attach / pick in Content when an image is selected
  (upload, drag onto canvas, attach to a website slot as a discrete PATCH).
- Media caption, focal point, crop, replace, AI cleanup that **creates a copy**
  (`parent_media_asset_id`); parent file is never replaced. Website editor PATCH, website
  assistant tools, and ads light cleanup call these same functions ([README.md](README.md)).
- Leave guard covers an in-flight upload ([editing.md](../../website/editing.md)).
  Hover the uploading thumb: a circle-and-cross button; click it to cancel (same overlay as Ads).

## Delete

- Duplicate gallery / picker if one appears while porting Ads or Details.
- Unused media-modal CSS once nothing references it.
- Don't say asset (bare) in product copy — say photo / item in the media library
  (code may keep `media_asset` internally).

## Do not port

- A second library for ads. Ads reuse this gallery, scoped to approved photos.
- Heavier editing inside Ads (cleanup review is specified there; source of truth
  stays here).
- Blog / careers media surfaces.

## Retarget

| Today | Target |
| --- | --- |
| `GET/POST /api/v1/website/editor/assets` | `/v1/media-assets` (this resource owns upload) |
| Signed URL + complete upload | `POST /v1/media-assets` + `…/complete` |
| Workspace panel only | add `/cms/media` full-screen (same rows) with the website Go phase |

Media is **not** a fifth top-level left-nav peer in the first nav pass (details
file). Deep link `/cms/media` is still required.

## Don't say / rename

- Don't say media (bare) in other features’ UI copy: **media library**.
- Don't say caption: **media caption**.
- Don't say asset in product strings.

## Tests

- `MediaWorkspacePanel.test.tsx`, `e2e/media-upload.spec.ts` — keep; land on
  `/cms/website` → image Content (and `/cms/media`).
- Do not `reuseExistingServer` against the owner’s 5173/5174 (cross-cutting).

## Done when

- One library: Content attach on `/cms/website` + `/cms/media`.
- No second picker. No unused modal CSS.
- Uploads and website-slot attach use the constrained website-editor / files API.
