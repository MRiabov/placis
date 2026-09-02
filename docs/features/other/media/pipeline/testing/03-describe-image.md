# 03 — Describe image (integration test)

Media caption + visual issues. Optional first-upload cleanup is a second
`media_assets` row.

- **Setup**: 02 already wrote `media_assets` (`processing`, `file_id`
  set, `thumbnail_file_id` set, `review_status=approved`) and
  `describe_image` in schema `jobs`. No `ai.threads` /
  `ai_generations` for `media_cleanup` yet.
- **Invoke**: River worker for `describe_image` (`DescribeImage`).
- **Assert**:
  - `media_assets` original: `media_caption` set,
    `processing_status=ready`, `review_status=approved`, every
    `*_severity` present (`low` / `medium` / `high` or null). Same
    `file_id` as 02.
  - `ai.threads` / `ai_generations`: `thread_kind=media_cleanup`
    (reasoning + output + tool calls).
  - When auto-cleanup runs (clutter / busy background / poor lighting
    / color cast not null, `photo_kind` not `logo`): second
    `media_assets` row, `parent_media_asset_id` = original,
    new `file_id`, `pending_review`, `thumbnail_file_id` set.
    Original still `ready` + `approved`.
  - When `photo_kind=logo`: still one `media_assets` row.
- **Cases**:
  - ETL insert path: transform already set `photo_kind`; same asserts
    on that id. Empty `media_caption` was the insert condition.
  - Caption already set before invoke: skip (no second generate).
- **Fail**: LLM error → row stays `processing`; retries same
  `media_asset_id`; sibling photos unchanged.
- **Mocked**: LLM (media caption + `submit_image_visual_issues`). Cleanup
  image generate when auto-cleanup runs.
