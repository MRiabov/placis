# ETL — pipeline

One file per **source** (or a shared operation group). Each file is extract then
transform for that source. Shared profile-update / conflict rules:
[build-profile](../../onboarding/pipeline/build-profile.md). Do not fork a second merge.

```text
StartRun(trigger, tenant, force=false)
  → enqueue_id; start each ETL run kind that has the details it needs (shared enqueue_id)
  → extract/<etl_run_kind> chunk → transform/<etl_run_kind> that chunk (repeat; not inlined in StartRun)
```

Monday / Wednesday / Friday: `trigger=scheduled`, ETL run kinds Google Maps,
Facebook, Instagram. Onboarding 02: `trigger=onboarding`, the
[ETL run kind triggers](etl-run-kind-triggers.md) table (never `directory`, `review`, or `photo`). 02 only
calls `StartRun`.

## Shared rules

- **As they arrive, not one dump at the end.** Extract emits chunks. Transform
  runs on each chunk before the next extract continues. Do not wait for ETL slow
  extract (or `status=succeeded`) before writing the live business profile.
  Onboarding SSE mirrors Postgres on change (not faster than ~2s): `etl.runs`
  **and** the live business profile / checklist transform already wrote.
- **ETL fast extract then ETL slow extract.** ETL fast extract is the cheap
  first response (p95 ≤ 5s). ETL slow extract is the remainder (progressively
  over about 60s). After ETL fast extract + transform, about half of that ETL
  run kind’s visible business research is already on the checklist; the rest
  fills during ETL slow extract. Not a stored progress ratio. ETL fast
  extract / ETL slow extract live in the per-source extract package, not in
  `StartRun`.
- Extract writes the matching `*_fetches` row (and the Google Maps listing on
  that ETL run kind). It must not import `profile` or write
  `business_profile_*`. A run may insert **several** fetch rows (ETL fast
  extract, then ETL slow extract URLs / scrape responses).
- Transform reads fetch / listing rows and writes the business profile. It must
  not call source networks.
- Retry of **this** `run_id` reuses a fetch that already landed for that chunk
  (`fetched_from`, canonical URL + `fetched_from` for crawl). It does not skip
  remaining ETL slow extract chunks. `trigger=scheduled` extracts again.
- Scheduled with no matching **Starts when** tuple (`place_id`, Facebook URL /
  handle, Instagram handle) → `status=skipped` immediately, no transform.
  Onboarding: insert the run when the ETL run kind can start. New details (Maps,
  crawl, Parallel, contractor URL) start further ETL run kinds on this enqueue.
  Nothing left that can produce the detail → `skipped`. A later paste can still
  start the ETL run kind.
- Details persist on the onboarding session attach and the live profile
  (`place_id`, `website_url`, handles). Running jobs may copy them onto
  `etl.runs`. Not a profile dump. Not a new `StartRun`.
- Pause remaining **expensive** extract when the only leftovers are `human`
  scalars (marketing phone, email, …). Cheap ETL fast extract still runs. Lists
  / Projects / reviews / photos still run. Details: [ETL run kind triggers](etl-run-kind-triggers.md).
- Dump `raw` only on the fetch row. Never on listing / profile / post live rows.
- Open web **search** is Parallel through Vercel AI Gateway only
  ([web-search](web-search.md)). Known-URL crawl **text** is Parallel Extract
  (`PARALLEL_API_KEY`) from [website crawl](website-crawl.md). Do not call
  Parallel Search HTTP from crawl.
- **`algorithm` and `schema_revision` on every transform schema** — each live
  profile increment, Facebook / Instagram profile or post, `photo_kind`, and
  `etl.llm_source_to_project_classifications` store both. Skip when
  `algorithm` matches, `schema_revision` matches, and `force` is false. A
  **new algorithm** does not auto-rerun (cost) until `force=true`. A **bumped
  `schema_revision`** (new fields on that schema) **extracts by default** on
  the next run — do not reuse an older fetch for that ETL run kind. `force=true`
  rewrites rows whose stored algorithm is stale and **not** `human`. Onboarding
  02 and Monday / Wednesday / Friday pass `force=false`. `force` does not
  refetch when only the algorithm changed. Project skip is the verdict table,
  not columns on posts / reviews / crawl HTML URLs.
- **`algorithm=human`** — owner / client interview / `confirm_conflict` /
  Details wrote this value. ETL transform must not overwrite it, including when
  `force=true` or `schema_revision` bumped (empty new fields may still fill). A
  later override is a **manual transform**, not the schedule.
- **Cheap multimodal default** — usable-as-a-Project classify, photo
  classification, and parse of crawl markdown into trade/services/etc. use
  **`glm-5.3-flash`** (dated gateway id; do not ride `*-latest`). Same model
  when input is text-only. Image on `input` when a depicting photo exists.
  Record reasoning, owner-visible output, and tool calls. Crawl parse uses an
  `etl_crawl_parse` thread per HTML URL. CMS Assistant /
  Voice / onboarding 06 are unchanged.
- **ETL writes cite `etl.sources`** — insert identity rows for sources this spec
  cites. Each ETL `business_profile_edits` increment inserts ≥1
  `business_profile_edit_sources`. ETL Projects insert ≥1 `project_sources`.
  Imported files insert ≥1 `imported_media_sources`. Never a nullable
  `source_id` column. Client interview / owner writes have no junction rows.
- **Reviews: insert only.** Transform writes `business_profile_reviews`
  (`in_pool`). It does not rank, does not write `is_top` / `top_position`,
  and does not enqueue `reviews_ranking_for_display`. Report that N new
  `in_pool` rows landed. Onboarding and scheduled-ETL **succeeded** enqueue
  that River job ([build-profile](../../onboarding/pipeline/build-profile.md),
  [jobs](../../../general-architecture/jobs.md)). Incremental LLM rerank as
  reviews arrive is later (do not spec).

## Sources

- [Google Maps](google-maps.md) — listing, hours, reviews, photos; Details then scrape (Mon /
  Wed / Fri + 02). Scrape is this ETL run kind’s ETL slow extract, not a
  `review` / `photo` ETL run kind.
- [Facebook](facebook.md) — profile and posts (Mon / Wed / Fri + 02). No
  Facebook page-review extract this slice.
- [Instagram](instagram.md) — profile and posts (Mon / Wed / Fri + 02)
- [Website crawl](website-crawl.md) — homepage fast then parallel remainder
  (02 only). Not a `directory` ETL run kind.
- [Projects from source](projects.md) — after FB / IG / crawl / Maps review
  transform (not an ETL run kind); skip on
  `etl.llm_source_to_project_classifications`
- [Trade registry](trade-registry.md) — accreditations (02 only)
- [ETL run kind triggers](etl-run-kind-triggers.md) — starts when, fire / skip / pause
- [Web search](web-search.md) — Parallel **Search** (02 only; one ETL run kind)
- [Photo classification](photo-classification.md) — photo kinds on media
  library items (transform after attach; not an ETL run kind)
