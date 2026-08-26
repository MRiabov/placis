# 02 — Business research

Async, parallel. Starts when 01 business lookup returns — **not** when 03 finishes. Overlaps Review
and the client interview. Progress on the onboarding session SSE stream. Photo classification of
found photos is this step, not the client interview.

Paid lookups (Maps, Parallel, Facebook, crawl) cost money. A naive contractor must not be able to
start that work dozens of times by repeating business lookup, picking another company, or retrying.
Cap it.

A **wave** is one enqueue of this step’s job set for a tenant (business lookup, or attaching/changing
sources on the same onboarding session). One wave writes several `business_research_runs` (one per
kind). River retries of those jobs are the same wave. Count waves, not jobs — otherwise one
business lookup would already exceed the cap.

## Trigger

01 business lookup returns with `online_research_consent_at` set, or sources change on an existing
onboarding session, **and** the tenant is under the wave cap. River jobs per research kind.

## Pre

- Onboarding session `status=client_interviewing`.
- `online_research_consent_at` set.
- Unactivated `tenant_id` on the onboarding session.
- Fewer than **5** `business_research_waves` for that `tenant_id` with `started_at` in the last
  **30 minutes**.

## Must not

- Call Parallel’s API; use Exa, Perplexity, Tako, a model’s built-in search, `:online`, or
  OpenRouter web search.
- Refetch on `business_research_fetches` hit (kind + cache key) or `google_maps_listings` hit by
  `place_id`.
- Text autosave, voice mint, `end_interview`, interview field lists, set `channel`.
- Write Review. Photo classification of found photos is this step, not 04a/04b.
- Say a miss means “this business has no profile” — a miss is “ask”.
- Enqueue a 6th wave for the same `tenant_id` inside 30 minutes (paid or cache-hit).
- Treat a River retry of an existing `business_research_run` as a new wave.
- Block business lookup, 03 Continue, or the client interview on this wait.

## Do

**Wave cap (before any job):** count `business_research_waves` for this `tenant_id` with
`started_at > now() - 30 minutes`. If the count is **5 or more**, do not insert a wave, do not
enqueue River jobs, do not call Maps / Parallel / Facebook / crawl. Set
`research_wait_until` = oldest of those five `started_at` + 30 minutes. Business lookup and source
changes still persist; 01 still returns; UI still goes to 03. Profile and SSE carry
`research_wait_until`.

If the count is **0–4**, insert one `business_research_waves` row (`tenant_id`,
`onboarding_session_id`, `started_at=now()`), then enqueue the jobs below with that `wave_id`.

One `business_research_run` per job. `place_id` on the run when a Maps listing was selected.
Registry-only onboarding sessions still get runs.

| Job | Fold / checklist | `business_research_sources.kind` |
| --- | --- | --- |
| Google listing | Maps profile, marketing phone, website, opening hours, reviews, photos | `google_maps_listing` |
| Facebook | Facebook profile / URL | `facebook` / `social_profile` |
| Services and area | trade, services, service area | `website_crawl` / `directory` |
| Founder | founder | `directory` |
| Accreditations | trade-registry certifications | `trade_registry` |
| Reviews and photos | reviews, rating, photos | `review` / `photo` |

Adapters: Google Maps Details (upsert `google_maps_listings`; scrape when Maps is not configured),
Vercel fast extract (LLM over retrieved text, no search tools), Facebook lookup, photo
classification (hero / project / service / founder / logo), trade-registry lookups (Safe Electric,
RGI, … for IE; Gas Safe, NICEIC, … for GB). Discovery of a URL or listing without `place_id` or a
known website URL is **Parallel** through Vercel AI Gateway (`gateway.tools.parallelSearch()`).

Before any **external** fetch: look up `business_research_fetches` by kind + stable key (and
`google_maps_listings` by `place_id` on the Maps path). Hit → reuse `raw`; still write
`business_research_run` + `business_research_sources` for **this** onboarding session. Company
registry parquet and Find autocomplete are not this cache. No TTL.

Instagram / LinkedIn may appear inside a fast extract; they are not persisted kinds unless a job
writes a `social_profile` row.

Each job is its own River job. On finish: `business_research_events` + `business_research_sources`
(`kind`, `external_id`, `source_ref`, lookup `status`, `confidence`; `raw` only when there is no
listing or reviews table). Clear in-progress on the checklist projection. Google listing job also
upserts `google_maps_listings` (columns + `raw`), hours, reviews. Reviews job writes further
review rows when Details did not already return them. Lookup outcomes (`matched` / `ambiguous` /
`not_found` / `not_attempted` / `blocked` / `error`) live on the source row’s `status`.

Profile deltas go through [build-profile](build-profile.md) (conflict rule: fold does not move).

## Persist

`business_research_waves` (one row per enqueue); `business_research_runs` (`wave_id`, `place_id` on
the Maps path), `business_research_events`, `business_research_sources`, `business_research_fetches`
(on miss), `google_maps_listings` (+ hours and reviews). Fold via build-profile.
`research_wait_until` is derived (oldest in-window wave + 30 minutes) when the cap is hit; it is
not a separate table. Expose it on `GET .../profile` and the onboarding session SSE.

## Fail

Retryable River jobs. Fail leaves prior fold + source `status=error`. In-progress checklist rows
clear when the job ends. Do not change onboarding session status. Job retry keeps the same
`wave_id`.

Wave cap: not a pipeline Fail. 01 business lookup still succeeds. A later source change that would start
a 6th wave in 30 minutes does not enqueue 02; the mutating request returns `429` with
`research_wait_until`. Prior fold and in-flight jobs stay.

## Out

SSE on the onboarding session stream. 03 and/or 04a/04b may already be open.

## Invariants

- 02 starts on 01 return, before 03, when the tenant is under the wave cap.
- At most **5 waves per `tenant_id` per rolling 30 minutes**. The next wave waits until the
  oldest of those five is 30 minutes old.
- A wave is one enqueue, not one `business_research_run`. River retries are not a new wave.
- Cache hit still writes run + source for this onboarding session (when a wave is allowed).
- Photo classification is here, not in 04a/04b.
- Parallel only via the Vercel AI Gateway Parallel server tool.
- The wait does not change onboarding session status and does not block 03/04.
