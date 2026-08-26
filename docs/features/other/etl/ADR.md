# ETL Decision Record

Status: decided (2026-08-26, product owner + engineering). Update an entry (keeping the old
decision + date) instead of silently replacing the old entry.

Earlier cache and listing-table decisions lived on the
[onboarding ADR](../../onboarding/ADR.md) (#4, #5, #6). Those entries stay; this file is the
split and the ongoing extract.

## Decisions

1. **ETL is its own Postgres schema** — Fetch bodies, run ledger, watermarks, and typed
   listing tables (Maps, Facebook reviews / posts, `imported_media`) live in
   `etl`, not `onboarding` and not `details`. Onboarding keeps sessions, client interview,
   website preview, website activation, and `stripe_events`. The live business profile
   (the fold of profile history: `details.business_profiles` plus services, service areas,
   opening hours, reviews, and certification selections) stays in `details`. Photos stay
   media library items (`media_library.media_assets`); the stored bytes are `files`.
   (2026-08-26)

   Onboarding 02 was written as if listing rows and a last-wins fetch cache were onboarding
   tables. They are extract tables. A later scheduled wave has no onboarding session.
   (2026-08-26, later: that enqueue is a **run**, not a wave. A scheduled run has no
   onboarding session.)

2. **One machinery, several triggers** — Onboarding 02, a Details URL change, Certifications
   and reviews **import**, and a daily job for an **activated** tenant all insert
   `etl.business_research_waves` and run the same adapters. `onboarding_session_id` is
   required only for `trigger=onboarding`. (2026-08-26)
   The enqueue table is `etl.business_research_runs` (not `waves`). Each River job writes
   `etl.business_research_sources` and events on that `run_id` — not a second per-job run
   row. The activated-tenant job is **three times per UTC week** (Monday, Wednesday, Friday),
   not daily. (2026-08-26)
   A scheduled run is **listing updates only** (Google Maps listing, Facebook, Instagram when
   a URL exists): new reviews, posts, and photos. It does not enqueue the 02 job set
   (company registry, trade registry, directory / founder, website crawl, Parallel).
   (2026-08-26)

3. **Fetches are append-only** — Each external call inserts `etl.fetches`. A prior `raw` is
   never overwritten. Listing tables are the current typed projection and point at
   `latest_fetch_id`. Reuse during onboarding is “latest fetch for that key inside the
   freshness window”, not a forever cache. (2026-08-26)

   Onboarding ADR #5 said no TTL on `business_research_fetches`. That stopped repeat paid
   lookups during find. It also blocked seeing new Facebook posts. Freshness window +
   watermarks replace “never refetch”.

4. **Load never overwrites the fold with a full profile** — Transform writes listing rows and
   `etl.imported_media`. Load into the profile is [build-profile](../../onboarding/pipeline/build-profile.md)
   increments only. Owner-set / conflict / `filled_by_user` columns do not move. Archived
   reviews and archived media library items are not recreated. Scheduled waves do not
   re-pin **top reviews** and do not rewrite `website_slot_reviews`. (2026-08-26)
   Same skip rules on a scheduled **run**. (2026-08-26)

5. **Social posts are a first-class source** — When a Facebook business URL (or an Instagram
   URL persisted as `social_profile`) exists, extract public **posts**, not only Facebook reviews.
   Post images become media library items (`supplied_by=business_research`). Post text may
   propose new list details (services, areas) through build-profile. Facebook Login stays
   out of this pass; public Facebook URL or scrape only. (2026-08-26)

6. **Online research consent covers later public extracts** — The find checkbox is still the
   only acknowledgement. No per-purpose records, versioning, or withdrawal machinery
   (onboarding ADR #3). After website activation the daily wave still uses that online research consent.
   (2026-08-26)
   After website activation the three-times-a-week scheduled run still uses that online research consent.
   (2026-08-26)

7. **Go package is `internal/etl`** — Adapters (`googlemaps/`, `companyregistry/`,
   `facebook/`, `crawl/`, `photo/`) and fakes live here. `onboarding` enqueues the first
   wave; it does not own adapters. Was described as `internal/research/` in module layout.
   (2026-08-26)
   `onboarding` enqueues the first **run**. (2026-08-26)
