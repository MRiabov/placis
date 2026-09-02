# 03 — Describe image

Write the media caption and classify visual issues. Optional first-upload
cleanup copy. Do not wait inside ETL transform — that step already
**inserted** this job.

## Trigger

River job kind `describe_image`. Owner
[02](02-confirm-media-asset-upload.md) **or** an ETL transform
**inserts** one job per new `media_assets` row with empty
`media_caption`. Skip insert when `media_caption` is already set
(scheduled rerun). Unique `(tenant_id, media_asset_id)` while
pending/running. Queue max workers **48**.

## Pre

- `media_assets.file_id` set, `processing_status=processing` (owner)
  or a new imported row with empty `media_caption` (ETL).
- Original `files` row readable.

## Must not

- Unique on `tenant_id` alone (uploads and ETL rows must not
  serialize).
- Wait inside ETL transform for this job.
- Reclassify `photo_kind` (that is photo classification).
- Auto-cleanup `photo_kind=logo`.
- Auto-upres (`blur` / `overlay_text` / `subject_too_small` /
  `low_resolution` are suggestions only).
- Cloudflare Image Resizing. `WriteImageThumbnail` already ran in 02
  / ETL insert.
- Write `review_status=pending_review` on the **original** owner or
  ETL row.

## Do

`DescribeImage` writes the media caption and may copy-on-write a
cleanup child.

1. Insert / reuse `ai.threads` `thread_kind=media_cleanup` for this
   item before the first generate.
2. **sends** media caption + `submit_image_visual_issues`
   (`parallel_tool_calls=true`). Record reasoning, output, and tool
   calls on `ai_generations`.
3. Persist `media_caption`, every `*_severity` (`low` / `medium` /
   `high` or null), `processing_status=ready`.
4. First-upload auto-cleanup when `clutter` / `busy_background` /
   `poor_lighting` / `color_cast` is not null (high first) **and**
   `photo_kind` is not `logo`: **calls** `CleanupMediaAsset` (no owner
   prompt). Original stays `ready` + `approved`. Child: new
   `file_id`, `pending_review`, `parent_media_asset_id`.
   `CleanupMediaAsset` **calls** `WriteImageThumbnail` on the child.
5. One failed photo retries that `media_asset_id` only.

## Reads

`media_assets`, `files`.

## Sends

Caption generate + `submit_image_visual_issues`.

## Calls

`CleanupMediaAsset` when auto-cleanup runs.

## Persist

`media_assets.media_caption`, `media_assets.*_severity`,
`media_assets.processing_status=ready`. Optional second `media_assets`
row (cleanup child) + child `files` / `thumbnail_file_id`.
`ai.threads` / `ai_generations` `thread_kind=media_cleanup`.

## Fail

Retryable River job. Same `(tenant_id, media_asset_id)`. Row stays
`processing` until success or retries exhaust → `failed`. Prior good
rows kept. Sibling photos are other job ids.

## Out

`/cms/media` shows Ready (and the cleanup child when auto-cleanup
ran). Ads LLM pool is `ready` + `approved` (the original; the child
waits for `ApproveAd` / `PublishWebsite`).

## Invariants

- Two rows when auto-cleanup runs; never replace the original
  `file_id`.
- ETL fast extract SLO is the Details chunk, not “every media caption
  ready.”
- `thread_kind` stays `media_cleanup` (image-edits / first-upload
  cleanup reuse it).
