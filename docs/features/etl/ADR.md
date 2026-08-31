# ETL Decision Record

Status: decided (2026-08-27, product owner + engineering). Update an entry
(keeping the old decision + date) instead of silently replacing the old entry.

## Decisions

1. **`etl` is a Postgres namespace and a root Go package** — Extract warehouse
   tables live in schema `etl`. `internal/etl/` owns extract **and** transform.
   There is no root `internal/research/` and no `internal/onboarding/research`.
   Onboarding 02 only calls `StartRun` and mirrors Postgres on SSE (`etl.runs`
   and the live business profile). (2026-08-27; same day, later: SSE includes
   live business profile writes, not only run status.)

2. **ETL is not extract-only** — `internal/etl/extract/` writes fetches and the
   Google Maps listing. `internal/etl/transform/` writes the business profile
   (research conflicts, Facebook / Instagram posts, photo classification).
   Extract must not import `profile` or write `business_profile_*`. Transform
   must not call Maps / Facebook / Instagram networks.
   **`StartRun` is not a god function:** it counts the cap, creates
   `enqueue_id`, inserts `etl.runs` when an ETL run kind can start, and enqueues
   that River job. It does not call source networks, write fetches, upsert the
   listing, or transform. Each ETL run kind’s extract and transform live in their
   own packages (`extract/googlemaps`, `transform/facebook`, …). A small worker
   dispatch calls those functions; it does not inline them. (2026-08-27; same
   day, later: StartRun orchestration only. 2026-08-31: insert when the input
   set is met.)

3. **One fetch table per extract type** — Append-only UUID rows with typed
   metadata (Instagram handle / Instagram user, Facebook page / handle, Maps
   `place_id`) plus `raw` jsonb. No single mixed `etl.fetches` dump. No `raw` on
   listing / profile / post live rows. A unifying `{id, type}` pointer table is
   not in this slice. (2026-08-27) (2026-08-30: `etl.sources` is live extract
   **identity** — `source_kind` + natural key — not mixed fetches and not `raw`.
   Fetches stay one table per extract type. Live extract rows fk `source_id`.
   Project skip is `etl.llm_source_to_project_classifications`, not this
   table.)

4. **An ETL run is one ETL run kind** — `etl.runs` is one row per ETL run kind that
   started (Google Maps extract, Facebook extract, Instagram extract).
   `StartRun(trigger, tenant, force=false)` creates one `enqueue_id` and
   inserts a run when that ETL run kind can start. The onboarding cap counts
   distinct `enqueue_id` with `trigger=onboarding` (5 per tenant per rolling 30
   minutes), not jobs. (2026-08-27: explicit `etl_run_kinds` list, one pending row per
   ETL run kind. 2026-08-31: `force` defaults false; onboarding ETL run kinds are the
   [registry](pipeline/etl-kind-triggers.md). Same day, later: insert when the
   Starts-when tuple is met, not one pending row per ETL run kind up front.)

5. **Transformed contractor data is the business profile** — Facebook profile /
   posts, Instagram profile / posts, and photo classification (hero / project /
   service / founder / logo) live on the business profile (today’s `details`
   schema) and that profile’s media library items. `etl` keeps raw fetches,
   runs, and the Google Maps listing (hours / reviews on `place_id`).
   (2026-08-27)

6. **Scheduled refresh is Monday, Wednesday, Friday** — Activated tenants.
   Sources: Google Maps, Facebook, Instagram (public scrape; Graph API later).
   Stagger across tenants. Skip an ETL run kind that has no key (`place_id`,
   handle). Company registry / existing-site API extracts later. Website crawl,
   trade registry, and Parallel stay first-run (onboarding 02). Website
   activation implies this refresh; online research consent covers it.
   (2026-08-27)

7. **Increment is natural-key upsert** — No watermark table. A scheduled extract
   fetches again; insert only reviews / posts / photos whose source id we do not
   already have. A run may insert several fetch rows (ETL fast extract, then ETL
   slow extract chunks). Retry of the same run reuses a fetch that already
   landed for that chunk; it does not skip remaining chunks. A scheduled run
   does not skip extract. (2026-08-27; same day, later: several fetches per run,
   retry per chunk.)

8. **Transform uses the same profile-update rules as onboarding** — New reviews
   / posts / photos land. Empty fields fill. A disagreeing owner-typed value is
   a research conflict on Details, not a silent overwrite. Transform runs on
   each extract chunk as it arrives; do not wait for ETL slow extract or
   `status=succeeded`. (2026-08-27; same day, later: per chunk, not per
   ETL run kind done.)

9. **Later: rename schema `details`** — Details the screen is a subset of the
   business profile. Rename Postgres schema `details` to `business_profile` or
   `profile` in a later slice. Do not rename it in this docs pass. (2026-08-27)

10. **Transform skip is `algorithm` + `schema_revision`; `human` is never
    overwritten by ETL** — Every transform-written schema stores `algorithm` and
    `schema_revision`. Skip when both match and `force` is false. A new
    **algorithm** does not auto-rerun (cost) until `force=true`. A bumped
    **`schema_revision`** (new fields) extracts by default on the next run.
    `force=true` rewrites stale **non-`human`** algorithms only.
    `algorithm=human` is not overwritten by scheduled ETL, `force`, or a schema
    bump (empty new fields may still fill). A later override is a manual
    transform. Onboarding 02 and Monday / Wednesday / Friday pass `force=false`.
    (2026-08-27: photo classification / `algorithm` only. Same day, later: all
    transform schema; `human` reserved. Same day, later: `schema_revision` bump
    extracts by default.)

11. **ETL fast extract then ETL slow extract; results as they arrive** — ETL fast extract is
    the cheap first response (p95 ≤ 5s): Google Maps Details (Places API first
    response: at most 5 reviews and 10 photos today), or an ETL fast crawl. ETL
    slow extract is the remainder (progressively over about 60s): Maps scrape of
    further reviews / photos (on the order of 50 reviews), or an ETL slow crawl.
    Persist a fetch and transform each chunk before the next extract continues.
    Onboarding shows about half of that ETL run kind’s checklist from the ETL fast
    extract, then more as ETL slow extract runs. Web search is not instant; a new
    empty `place_id` or URL is a detail that starts Maps / crawl in the same
    enqueue. ETL fast extract / ETL slow extract live in the per-source package,
    not `StartRun`.
    (2026-08-27) (2026-08-30: website crawl ETL slow extract is a parallel remainder
    extract after the homepage, not a serial tens-of-seconds walk. Maps scrape
    remainder is unchanged. 2026-08-31: means fire from input sets, not sibling
    unblocks. 2026-08-31 later: p95 ≤ 5s / ~60s progressive; ETL run kind starts
    when it has the details it needs.)

12. **Crawl fetches record `fetched_from`; live HTML URLs hold photos** —
    Parallel Extract, HTML GET, Apify, robots, and sitemaps are separate
    append-only fetch rows. Depicting photos live on
    `etl.website_crawl_pages`, not fetches. Extract markdown and goquery
    visible text are two `etl.sources` (`website_crawl_extract` /
    `website_crawl_html`). Apify stands in for the crawled HTML when GET fails.
    Project skip lives on `etl.llm_source_to_project_classifications`, not on
    crawl HTML URLs. (2026-08-30; same day, later: two crawl sources; Project
    skip off the HTML URL row.)

13. **Written rows cite extracts through typed junctions** — `source_id` is
    never a nullable column. ETL-produced edits, Projects, and imported files
    cite **at least one** `etl.sources` id (`business_profile_edit_sources`,
    `project_sources`, `imported_media_sources`). Owner / client interview
    writes have no junction rows. Do not use a generic `table.column` field map.
    `origin` stays the product origin. (2026-08-30)

14. **Onboarding business research is ETL run kind triggers; ETL run kinds are
    adapters** — 02 never passes `directory`, `review`, or `photo`. Scrape is
    ETL slow extract of `google_maps_listing`. Photo classification is transform
    after attach. Crawl fills trade / founder / service areas (no directory
    job). An ETL run kind starts when it has the details it needs (any of the
    **Starts when** tuples). Those details live on the onboarding session attach
    and the live profile (Find, extract, or contractor). Insert `etl.runs` when
    the ETL run kind starts. Facebook / Instagram start on URL/handle; `skipped`
    when nothing left can produce that detail. A later paste can still start
    them. Maps may start from `place_id` **or** `display_name` + locality **or**
    `legal_name` + locality (Places Find uses `display_name` if set, else
    `legal_name`, plus registered-office locality / trade location / tenant
    country city; one high-confidence hit only). `trade_registry` from
    `company_number` + country **or** `display_name` + country. `web_search`
    starts when some discoverable detail is still empty; it does not overwrite
    Find-attached `place_id`. ETL fast extract then ETL slow extract is why ETL run kinds
    fire in parallel from 01 seeds, not a job deadline. Skip remaining expensive
    extract when the only leftovers are `human` scalars. (2026-08-31 closed ETL run
    kind list + sibling unblock; same day, later: trade registry not gated on company
    registry attach; web search not gated on missing `place_id`; same day,
    later: Starts-when registry replaces the Always-ETL-run-kinds DAG. 2026-08-31 later:
    ETL run kind + details, not means / identity key / input set / client-interview
    window. 2026-08-31 later: Places Find may use `legal_name` +
    registered-office locality.)
15. **Find attach is onboarding session keys; extract still owns the listing**
    — 01 persists `place_id` / `company_number` / `website_url` on the
    onboarding session and writes profile increments from the selected
    company registry record and Maps autocomplete Read. It does not upsert
    `etl.google_maps_listings` or insert fetch rows. Those attach values are
    details. 02 does not copy them onto pending sibling runs. Company registry
    `etl.sources` rows are inserted by 01, not by an ETL run kind.
    (2026-08-31; same day, later: identity keys, not sibling key-passing.
    2026-08-31 later: details, not identity keys.)
