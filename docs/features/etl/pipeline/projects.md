# Projects from source

Shared transform after a Facebook post, Instagram post, website-crawl **live
HTML URL**, or Maps listing review is upserted and its photos are attached /
classified. Not a `StartRun` kind. Shared extract / transform rules:
[pipeline README](README.md). Profile writes:
[build-profile](../../onboarding/pipeline/build-profile.md).

**Internal (spec / ETL, not glossary, not owner copy):** a source is **usable
as a Project** when it describes **one past named job**. Same phrase for a
post, a crawled URL, or a review. Never say well-scoped, qualifying source, or
**source-backed**.

A Project is title (1–80), description (1–2000), optional cover. ETL insert is
`status=active` ([Projects ADR](../../business-profile/projects/ADR.md) 5–6).
Do not insert a project draft from this transform.

## Trigger

Transform for [Facebook](facebook.md), [Instagram](instagram.md), [website
crawl](website-crawl.md), or [Google Maps](google-maps.md) after source upsert

- photo attach + [photo classification](photo-classification.md) for that
chunk.

## Pre

- `business_profiles` row for `tenant_id`.
- Source rows for this chunk exist (posts, `etl.website_crawl_pages`
  `status=fetched`, or `business_profile_reviews` keyed to listing reviews).

## Must not

- Be a `StartRun` kind or a second crawl.
- Call source networks (read rows only).
- Stop because four Projects already exist. Extract/classify **every** source
  in the chunks we fetch. Rank for the client interview / first gallery is
  [build-profile](../../onboarding/pipeline/build-profile.md).
- Merge the same job across Facebook, Instagram, the current site, and
  reviews.
- Invent a depicting photo. Do not steal a Maps listing dump, another job,
  logo, selfie, or **reviewer avatar**.
- Use listing-level `google_maps_listing_photos` as a review-origin cover.
- Paste the Google review quote onto the Project (write a **job blurb**).
- Put the reviewer’s name in the title.
- Overwrite `algorithm=human` on a Project (including `force=true`).
- Overwrite title or description on an existing Project for that source key.
  Scrape may **fill an empty cover only** on the same review-origin row when
  `algorithm` is not `human`.
- Put skip keys on fetch rows. Crawl skip lives on
  `etl.website_crawl_pages`.
- Invent a Facebook page-review extract. Hook Maps reviews. Facebook reviews
  only if some other writer already inserted `business_profile_reviews`.
- Treat unlabeled `photo_kind=project` photos as Projects.
- Ride `*-latest`. Pin a dated gateway id for **`glm-5.3-flash`**.

## Do

1. For each source in this chunk with no skip keys (or stale
   `schema_revision`, or `force=true` and not `human`): posts and crawled URLs
   need at least one photo on **that source**; reviews do not.
2. Bounded `LLMProvider` call on **`glm-5.3-flash`** (dated id; cheap
   multimodal default for this work). Same model if the input is text-only.
   When a depicting photo exists, put that image on `input` with media caption /
   review text. Schema: past completed named job or not; if yes, title +
   description within maxLengths. Prompt in ETL `prompts.yaml`, not Go.
   Record reasoning, owner-visible output, tool calls, model, and cost
   ([LLM layer](../../../general-architecture/llm-layer.md)).
3. Skip in-progress / current jobs, hiring, offers, memes, generic service
   lists, generic reviews (“great plumber”, stars only, “highly recommend
   Alan”), lifetime / repeat-job blurbs that span several jobs,
   owner-written reviews, templated one-liners. Reviews need a **work type**
   (flat roof, chimney flashing, kitchen doors). Street is a bonus.
4. Schema mismatch: retry up to 3 times; then leave skip keys unset and
   continue other sources.
5. If usable as a Project, insert through build-profile
   (`created_by=business_research`, `status=active`, origin
   `facebook` / `instagram` / `website_crawl` / `review`). Cover = the
   depicting photo on that source when the model (or `photo_kind=project`)
   confirms it shows the job; otherwise empty. Posts and crawled URLs without
   a depicting photo do not insert. A review usable as a Project may insert
   with empty cover.
6. Write skip keys on the source (`project_from_source_algorithm`,
   `project_from_source_schema_revision`, whether it produced a Project).

## Persist

`business_profile.projects`; skip keys on `facebook_posts` /
`instagram_posts` / `business_profile_reviews` / `etl.website_crawl_pages`;
`business_profile_edits.list=projects`. `etl.runs` stays succeeded from the
calling kind.

## Fail

Schema mismatch after 3 retries: skip keys unset; other sources continue.
Transport / job errors: River retry. Prior Projects stay.

## Out

Onboarding SSE mirrors Postgres (`etl.runs` and live Projects). Client interview
cards / 05 gallery consume the **ranked top 4** in build-profile, not arrival
order.

## Invariants

- One Project per usable source. No cross-source merge.
- Display cap is four; extract cap is the chunks we already fetch.
- Owner `algorithm=human` wins.
- Reviews usable as a Project may have empty cover until scrape photos land
  on **that** listing review.
