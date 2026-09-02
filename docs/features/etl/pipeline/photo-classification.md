# Photo classification

Shared operation group after photos land from [Google Maps](google-maps.md), [Facebook](facebook.md),
[Instagram](instagram.md), or [website crawl](website-crawl.md). Not an ETL run kind and not a client interview
step. Shared extract / transform rules: [pipeline README](README.md). Classifier model:
**`glm-5.3-flash`** (dated id; same cheap multimodal default as
[projects.md](projects.md)).

Labels: hero / project / service / founder / logo. Written as `photo_kind` on
the business profile’s media library items. Captioning and visual-issue tools
are River job kind `describe_image`
([media library 03](../../other/media/pipeline/03-describe-image.md)); this step
writes `photo_kind*` only. Transform **calls** this, then **inserts**
`describe_image`.

The skip keys are **`algorithm`** and **`schema_revision`**, stored on the media
library item next to the hash — same skip as every other transform schema
([pipeline README](README.md)). A new algorithm does **not** reclassify the library
(classifier cost) until `force=true`. A bumped `schema_revision` (new fields /
labels on `photo_kind`) classifies by default on the next run. `algorithm=human`
is never overwritten by ETL, including `force=true` or a schema bump. Onboarding
02 and Monday / Wednesday / Friday pass `force=false`. Project skip is **not**
on the media item — it is `etl.llm_source_to_project_classifications`
([projects.md](projects.md)).

## Trigger

Transform for an ETL run kind that attached new photos. `force` is the shared
transform job arg (default false). It does not refetch Maps / Facebook /
Instagram / crawl. 02 never passes a `photo` ETL run kind.

## Pre

- Media library items exist for this `tenant_id` with
  `supplied_by=business_research`.
- `content_hash` present when we can hash the file.

## Must not

- Call Maps / Facebook / Instagram / crawl networks (read fetch / listing /
  HTML URL / media library rows only).
- Reclassify when `photo_kind` is set, `schema_revision` is current, and `force`
  is false — including when the current `algorithm` string differs from
  `photo_kind_algorithm`.
- Overwrite `photo_kind_algorithm=human`, including when `force=true` or
  `schema_revision` bumped.
- Skip an item because the first classifier output failed the schema.
- Create `etl.photo_classifications`.
- Specify this in 04a / 04b.

## Do

For each item with no `photo_kind`, or whose `photo_kind_schema_revision` is
stale, call the classifier, parse against the `photo_kind` schema, set
`photo_kind`, `photo_kind_algorithm`, and `photo_kind_schema_revision`. Skip
stale-revision items whose algorithm is `human`.

When `force=true`, also reclassify items whose `photo_kind_algorithm` is not the
current `algorithm` and is not `human`. Leave items whose stored algorithm
already matches or is `human`.

## Persist

`media_assets.photo_kind`, `photo_kind_algorithm`, `photo_kind_schema_revision`,
`content_hash`. Calling ETL run kinds stay succeeded from their own transform.

## Fail

A classifier output that does not match the schema is **retried up to 3 times**,
not skipped, on the same `etl_photo_classify` thread (insert before the first
generate). On each attempt, use bounded schema repair when the mismatch is small
enough ([LLM layer](../../../general-architecture/llm-layer.md): repair only the smallest failing subtree; never accept a
partial `photo_kind`). After those retries, leave `photo_kind` unset (do not
write `photo_kind_algorithm`). Continue other items. Prior ETL run kinds’ live
business profile stays.

Transport / job errors stay retryable on the River job. `status=error` when
those retries exhaust.

## Out

Checklist photos row may move `in_progress` → filled as each item is classified
(do not wait for every photo from ETL slow extract). Onboarding SSE mirrors
Postgres (`etl.runs` and media library items).

## Invariants

- Classification is transform, not extract.
- Same `content_hash` is not classified twice unless `force=true` or
  `schema_revision` is stale (and not `human`).
- Changing `algorithm` does not spend classifier calls until `force=true`.
  Bumping `schema_revision` classifies / extracts by default.
- `algorithm=human` is not overwritten by ETL. A later override is a manual
  transform.
- A schema mismatch is retried up to 3 times; it is not a skip.
