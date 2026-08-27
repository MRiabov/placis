# ETL Decision Record

Status: decided (2026-08-27, product owner + engineering). Update an entry (keeping the old
decision + date) instead of silently replacing the old entry.

## Decisions

1. **`etl` is a Postgres namespace and a root Go package** — Extract warehouse tables live in
   schema `etl`. `internal/etl/` owns extract **and** transform. There is no root
   `internal/research/` and no `internal/onboarding/research`. Onboarding 02 only calls
   `StartRun` and mirrors `etl.runs` on SSE. (2026-08-27)

2. **ETL is not extract-only** — `internal/etl/extract/` writes fetches and the Google Maps
   listing. `internal/etl/transform/` writes the business profile (research conflicts, Facebook /
   Instagram posts, photo classification). Extract must not import `profile` or write
   `business_profile_*`. Transform must not call Maps / Facebook / Instagram networks. (2026-08-27)

3. **One fetch table per extract type** — Append-only UUID rows with typed metadata (Instagram
   handle / Instagram user, Facebook page / handle, Maps `place_id`) plus `raw` jsonb. No single
   mixed `etl.fetches` dump. No `raw` on listing / profile / post live rows. A unifying
   `{id, type}` pointer table is not in this slice. (2026-08-27)

4. **An ETL run is one source kind** — `etl.runs` is one row per kind (Google Maps extract,
   Facebook extract, Instagram extract). `StartRun(kinds, trigger, tenant)` takes an explicit
   list (length ≥ 1), creates one `enqueue_id`, inserts one run per kind, enqueues that kind’s
   River job. The onboarding cap counts distinct `enqueue_id` with
   `trigger=onboarding` (5 per tenant per rolling 30 minutes), not jobs. (2026-08-27)

5. **Transformed contractor data is the business profile** — Facebook profile / posts, Instagram
   profile / posts, and photo classification (hero / project / service / founder / logo) live on
   the business profile (today’s `details` schema) and that profile’s media library items. `etl`
   keeps raw fetches, runs, and the Google Maps listing (hours / reviews on `place_id`). (2026-08-27)

6. **Scheduled refresh is Monday, Wednesday, Friday** — Activated tenants. Sources: Google Maps,
   Facebook, Instagram (public scrape; Graph API later). Stagger across tenants. Skip a kind that
   has no key (`place_id`, handle). Company registry / existing-site API extracts later. Website
   crawl, trade registry, and Parallel stay first-run (onboarding 02). Website activation implies
   this refresh; online research consent covers it. (2026-08-27)

7. **Increment is natural-key upsert** — No watermark table. A scheduled extract fetches again;
   insert only reviews / posts / photos whose source id we do not already have. Retry of the same
   run may reuse the newest fetch for that type’s natural key. A scheduled run does not skip
   extract. (2026-08-27)

8. **Transform uses the same profile-update rules as onboarding** — New reviews / posts / photos land.
   Empty fields fill. A disagreeing owner-typed value is a research conflict on Details, not a
   silent overwrite. Transform runs per kind as soon as that kind’s extract succeeds. (2026-08-27)

9. **Later: rename schema `details`** — Details the screen is a subset of the business profile.
   Rename Postgres schema `details` to `business_profile` or `profile` in a later slice. Do not
   rename it in this docs pass. (2026-08-27)
