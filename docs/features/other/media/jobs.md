# Media library jobs

Conventions and index: [jobs](../../../infrastructure/jobs.md). Named
identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).
Closed `## Jobs`. Overflow is `###` with a backticked River job kind
under Jobs.

## Jobs

| River job kind | Args | Unique key | Do |
| --- | --- | --- | --- |
| `describe_image` | `tenant_id`, `media_asset_id` | `(tenant_id, media_asset_id)` while pending/running | `DescribeImage` |
| `sweep_stale_media_uploads` | none | one global row while pending/running | delete stale `uploading` or upload-failed (`failed` + null `file_id`) |

### `describe_image`

Owner `POST /v1/media-assets/{id}/confirm-upload` **or** an ETL transform
**or** `CleanupMediaAsset` **inserts** this River job kind. Transform
**inserts** only when there is no classification yet. The worker skips
a new LLM row when latest matches `algorithm` + `schema_revision`.
`force` is ETL `StartRun` / transform only; this job has no `force`. Do
not wait inside transform. Unique `(tenant_id, media_asset_id)` while
pending/running — not `tenant_id` alone. Dedicated queue, max workers
**48**. Fail → retry that id only; row stays `processing` until success
or retries exhaust → captioning-failed (`processing_status=failed`;
`file_id` set). Sibling photos are other job ids.

Worker: `internal/profile/media/jobs.go`.

`DescribeImage` **sends** media caption + `submit_image_visual_issues`
(`parallel_tool_calls=true`) and **writes**
`media_asset_classifications` (`photo_kind` `logo` or `photo`,
`content_hash` of this canonical `file_id`, `algorithm`,
`schema_revision`, `ai_generation_id`). Owner / `CleanupMediaAsset`
insert of this job: `bill_usage=bill-allow-out-of-balance`
(`usage_category=image`) — remaining 0 still classifies (**our usage**
only; not captioning-failed from usage credit). ETL insert:
`bill_usage=unbilled` from `StartRun`. Cleanup generate itself is
`bill_usage=billed`. Tool `clutter` maps to column `clutter_severity`
(same for the other seven). Never updates an old classification. Then sets
`media_assets.processing_status=ready`. Record reasoning, output, and
tool calls on `ai_generations`. Insert / reuse `ai.threads`
`thread_kind=media_cleanup` for this item. Must not write `hero` /
`project` / `service` / `founder` / `person`. Must not write
`pending_review` on the original owner or ETL row. Must not auto-upres
(`blur` / `overlay_text` / `subject_too_small` / `low_resolution` are
suggestions only). `WriteCanonicalWebP` and `WriteImageThumbnail` already
ran in confirm-upload / ETL insert.

First-upload auto-cleanup only when feature flag `media_auto_cleanup`
is on (default off). Then when **latest** `photo_kind=photo` **and**
`clutter_severity` / `busy_background_severity` /
`poor_lighting_severity` / `color_cast_severity` is not null (high
first): **calls** `CleanupMediaAsset` (no owner prompt). Skip when the
flag is off, latest is `logo`, or there is no classification yet. When
the flag is off: classify, set `ready`, **do not** **call**
`CleanupMediaAsset`. No child. Auto path does not **call**
`AssertUsageCredit`. When it **calls**: original stays `ready` +
`approved`. Child: new original + canonical + thumbnail,
`pending_review`, `parent_media_asset_id`, inherit `supplied_by` /
`created_by`, `cleaned_up_with_ai=true`. `CleanupMediaAsset` **calls**
`WriteCanonicalWebP` then `WriteImageThumbnail` on the child and
**inserts** `describe_image` on the child. Routes:
[media library HTTP](api.md). Named flags:
[feature flags](../../../infrastructure/config.md).

### `sweep_stale_media_uploads`

Worker: `internal/profile/media/jobs.go`. Periodic insert from the same
`cmd/api` in-process River workers as `scheduled_etl`. Not crontab. Not
list/GET handler deletes. Args none; unique one global row while
pending/running. **Do:** delete `media_assets` older than the
website-editor leave-guard window
([editing.md](../../website/editing.md)) that are `uploading` **or**
upload-failed (`failed` + null `file_id`). Must not delete
captioning-failed (`failed` + `file_id` set). Age lives only here.
`ListMediaAssets` omits those in-flight `uploading` rows immediately.
