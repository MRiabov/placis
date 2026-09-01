# Media — persistence

The photo library. Website sections and ads reference these rows; they do not
copy them. Conventions: [persistence conventions](../../../general-architecture/persistence.md) (Postgres schema
`media_library`). Files live in
[files](../../../general-architecture/files-and-s3.md).

The file on a media library item is never replaced. An edit creates a new row
(`parent_media_asset_id`); uses keep pointing at the old item until they are
retargeted to the copy. That copy-on-write is an invariant of those functions
(`/cms/media`, website editor, assistant, ads light cleanup are callers —
[README.md](README.md)).

- **Crop / focal** — child keeps the parent’s `file_id`. Stay `approved` if the
  parent is. If this row is unreferenced, mutate crop/focal in place (the widget
  click-off must not stack unused copies). If referenced, insert the child; uses
  keep the parent until retargeted.
- **AI cleanup** — child gets a new `file_id`, `pending_review`, inherits
  `supplied_by`. Reject archives that copy (`status=archived`,
  `review_status=rejected`) and retargets uses to the parent. Accept is not a
  write.
- **Owner replace** — child gets a new `file_id`, `pending_review`.
- **Attach** — no new row; the website slot (or ad placement) points at an
  existing item.
- `media_assets` — `id`, `tenant_id` fk, `asset_type`
  (`image`/`logo`/`document`/ `generated_image`), `source`
  (`upload`/`generated`/`imported`/`external`), `supplied_by`
  (`owner`/`business_research`/`ai`), `parent_media_asset_id` nullable fk,
  `created_by` (`owner`/`ai`/`done_for_you`), `status` (`active`/`archived`),
  `file_id` nullable (never replaced after insert), `source_url`,
  `media_caption`, `crop_mode` (`full`/`rect`), `crop_x`, `crop_y`,
  `crop_width`, `crop_height` (0–1, null when `full`), `focal_x`, `focal_y`
  (0–1), `review_status` (`pending_review`/`approved`/`rejected`),
  `processing_status` (`uploading`/`processing`/`ready`/`failed`), `photo_kind`
  nullable (`hero` / `project` / `service` / `founder` / `logo`) — ETL transform
  sets this on business-research photos, `photo_kind_algorithm` nullable —
  classifier identity that wrote `photo_kind` (the skip key `algorithm`; value
  `human` when the owner set it; a new algorithm does not reclassify until
  `force=true`; `human` is never overwritten by ETL),
  `photo_kind_schema_revision` nullable — bump when the `photo_kind` schema
  gains fields; the next run classifies / extracts by default, `content_hash`
  nullable, `clutter_severity`, `busy_background_severity`,
  `poor_lighting_severity`, `color_cast_severity`, `blur_severity`,
  `overlay_text_severity`, `subject_too_small_severity`,
  `low_resolution_severity` (each `low` / `medium` / `high` or null),
  `created_at`

`processing_status` is not `review_status` and not `status` (active/archived). A
new upload is `uploading` while the file is uploading, then `processing` while
Placis writes the media caption and classifies visual issues, then `ready` — the
media caption is always there once ready. Failed upload is `failed`. The live
website only uses `ready` + `approved` items. Ads LLM picks use that same pool;
a photo the owner adds to an ad is usable once the photo is uploaded, even if
captioning is still `processing`.

Visual-issue severities are Internal/code (`submit_image_visual_issues` on the
captioning pass, `parallel_tool_calls=true`). Every argument is present: `low` /
`medium` / `high` or null. Auto-run tailored light cleanup on first upload from
`clutter`, `busy_background`, `poor_lighting`, `color_cast` when not null (high
first). Suggest only: `blur`, `overlay_text`, `subject_too_small`,
`low_resolution`. No auto-upres. Do not classify “looks unfinished”.
Identifiable people stay on media review. Record the tool call in
`ai_generations` (`thread_kind=media_cleanup` thread; insert before the first
generate).

A cleanup copy inherits `supplied_by` from the parent. A generated image is
`supplied_by=ai`.

Maps listing photos and Facebook/Instagram **post** images are
`source=imported`, `supplied_by=business_research`. External ids live in
`etl.imported_media`, not a second column on this row. Parent extracts are
`imported_media_sources` (≥1 `etl.sources` id). A later extract does not insert
a second item for the same `(tenant_id, imported_media_kind, external_id)`,
including when this row is `archived`. Owner uploads are not `imported_media`
and have no source junction.
