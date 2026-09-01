# Projects from source

Shared transform after a Facebook post, Instagram post, website-crawl
**source**, or Maps listing review is upserted and its photos are attached /
classified. Not a `StartRun` ETL run kind. Shared extract / transform rules:
[pipeline README](README.md). Profile writes: [build-profile](../../onboarding/pipeline/build-profile.md). Persistence:
[`etl.sources`](../persistence.md),
[`llm_source_to_project_classifications`](../persistence.md),
[`project_sources`](../../business-profile/projects/persistence.md).

**Internal (spec / ETL, not glossary, not owner copy):** a source is **usable
as a Project** when it describes **one past named job**. Same phrase for a
post, a crawl Extract or crawled HTML, or a review. Never say well-scoped,
qualifying source, or **source-backed**.

A Project is title (1–80), description (1–2000), optional cover. ETL insert is
`status=active` ([Projects ADR](../../business-profile/projects/ADR.md) 5–7).
Do not insert a project draft from this transform.

## Trigger

Transform for [Facebook](facebook.md), [Instagram](instagram.md), [website
crawl](website-crawl.md), or [Google Maps](google-maps.md) after source upsert

- photo attach + [photo classification](photo-classification.md) for that
chunk.

## Pre

- `business_profiles` row for `tenant_id`.
- `etl.sources` rows for sources in this chunk (both crawl sources when both
  have landed). Live posts / listing reviews already fk those ids. Crawl HTML
  URL rows exist (`etl.website_crawl_pages` `status=fetched`).

## Must not

- Be a `StartRun` ETL run kind or a second crawl.
- Call source networks (read rows only).
- Stop because four Projects already exist. Extract/classify **every** source
  in the chunks we fetch. Rank for the client interview / first gallery is
  [build-profile](../../onboarding/pipeline/build-profile.md).
- Merge the same job across Facebook, Instagram, the current site, and
  reviews. Same crawl URL, **both** sources yes → **one** Project (two cites).
- Invent a depicting photo. Do not steal a Maps listing dump, another job,
  logo, selfie, or **reviewer avatar**.
- Use listing-level `google_maps_listing_photos` as a review-origin cover.
- Paste the Google review quote onto the Project (write a **job blurb**).
- Put the reviewer’s name in the title.
- Overwrite `algorithm=human` on a Project (including `force=true`).
- Overwrite title or description on an existing Project for that `source_id`.
  Scrape may **fill an empty cover only** on the same review-origin row when
  `algorithm` is not `human`.
- Put Project skip / yes/no / `project_id` on fetch rows, `etl.sources`,
  Facebook / Instagram posts, `business_profile_reviews`, or
  `etl.website_crawl_pages`.
- Hang a nullable `source_id` column on Projects. Cite through
  `project_sources` (≥1 for ETL inserts).
- Store citations as a generic `table.column` field map.
- Invent a Facebook page-review extract. Hook Maps reviews. Facebook reviews
  only if some other writer already inserted `business_profile_reviews`.
- Treat unlabeled `photo_kind=project` photos as Projects.
- Ride `*-latest`. Pin a dated gateway id for **`glm-5.3-flash`**.

## Do

1. Ensure `etl.sources` for each source in this chunk (Extract markdown **and**
   goquery HTML for a crawled URL; Apify is the crawled HTML when GET failed).
2. Skip a `source_id` whose verdict row matches `algorithm` +
   `schema_revision` and `force` is false. Skip `algorithm=human` Projects
   pointed at by that verdict (do not insert a second row).
3. Posts and crawled URLs need at least one photo on **that HTML URL / post**;
   reviews do not. No depicting photo → verdict **no**, no LLM.
4. Source **text** under **200 characters** → verdict **no**, no LLM. Per
   `source_id`. Does not apply to Details fill.
5. Else bounded `LLMProvider` call on **`glm-5.3-flash`** (dated id; cheap
   multimodal default for this work). Same model if the input is text-only.
   When a depicting photo exists, put that image on `input` with media caption /
   review text. Schema: past completed named job or not; if yes, title +
   description within maxLengths. Prompt in ETL `prompts.yaml`, not Go.
   Record reasoning, owner-visible output, tool calls, model, and cost
   ([LLM layer](../../../general-architecture/llm-layer.md)). Insert an
   `etl_project_classify` thread before the first generate; retries of that
   source reuse it. Optional
   `ai_generation_id` on the verdict.
6. Skip in-progress / current jobs, hiring, offers, memes, generic service
   lists, generic reviews (“great plumber”, stars only, “highly recommend
   Alan”), lifetime / repeat-job blurbs that span several jobs,
   owner-written reviews, templated one-liners. Reviews need a **work type**
   (flat roof, chimney flashing, kitchen doors). Street is a bonus.
7. Schema mismatch: retry up to 3 times; then leave the verdict **unset** and
   continue other sources.
8. **No** → write verdict no (`project_id` null). **Yes** → insert Project
   through build-profile (`created_by=business_research`, `status=active`,
   origin `facebook` / `instagram` / `website_crawl` / `review`) **or** attach
   to the sibling crawl source’s Project when that URL’s other `source_kind`
   already has a yes verdict. Cover = the depicting photo on that post / HTML
   URL when the model (or `photo_kind=project`) confirms it shows the job;
   otherwise empty. Insert ≥1 `project_sources` row. Write verdict yes with
   `project_id`. Both crawl sources yes → one Project, two `project_sources`,
   two verdicts with the same `project_id`. A review usable as a Project may
   insert with empty cover.

## Persist

`etl.sources`; `etl.llm_source_to_project_classifications`;
`business_profile.projects`; `business_profile.project_sources`;
`business_profile_edits.list=projects` + ≥1 `business_profile_edit_sources`.
`etl.runs` stays succeeded from the calling ETL run kind.

## Fail

Schema mismatch after 3 retries: verdict unset; other sources continue.
Transport / job errors: River retry. Prior Projects stay.

## Out

Onboarding SSE mirrors Postgres (`etl.runs` and live Projects). Client interview
cards consume the **ranked top 4** in build-profile, not arrival order. Website
02 does not bake those ids; 04 resolves `{{projects.*}}`.

## Invariants

- One Project per usable source, except same crawl URL with two yes sources.
- Display cap is four; extract cap is the chunks we already fetch.
- Owner `algorithm=human` wins.
- Reviews usable as a Project may have empty cover until scrape photos land
  on **that** listing review.
- ETL Project ⇒ ≥1 `project_sources`. Owner drafts ⇒ zero cites.
