# 02 — Business research

Async, parallel. Starts when 01 business lookup returns — **not** when 03 finishes. Overlaps Review
and the client interview. Progress on the onboarding session SSE stream. Photo classification of
found photos is this step, not the client interview.

Paid lookups (Maps, Parallel, Facebook, crawl) cost money. A naive contractor must not be able to
start that work dozens of times by repeating business lookup, picking another company, or retrying.
Cap it.

A **run** is one enqueue of this step’s job set for a tenant (business lookup, or attaching/changing
sources on the same onboarding session). One run writes several `etl.business_research_sources`
(one per kind) and events on the same `run_id`. River retries of those jobs are the same run.
Count runs, not jobs — otherwise one business lookup would already exceed the cap.

Extract / transform / load, append-only fetches, and listing updates after website activation:
[ETL](../../other/etl/architecture.md). This file is the onboarding trigger and the **02 job
set**. Scheduled runs do not enqueue these jobs.

## Trigger

01 business lookup returns with `online_research_consent_at` set, or sources change on an existing
onboarding session, **and** the tenant is under the run cap. River jobs per research kind.

## Pre

- Onboarding session `status=client_interviewing`.
- `online_research_consent_at` set.
- Unactivated `tenant_id` on the onboarding session.
- Fewer than **5** `etl.business_research_runs` with `trigger=onboarding` for that `tenant_id`
  with `started_at` in the last **30 minutes**.

## Must not

- Call Parallel’s API; use Exa, Perplexity, Tako, a model’s built-in search, `:online`, or
  OpenRouter web search.
- Refetch when the latest `etl.fetches` row for that kind + cache key is inside the **30-minute
  freshness window**, or when `etl.google_maps_listings` is already current for that `place_id`
  inside the same window.
- Text autosave, voice mint, `end_interview`, interview field lists, set `channel`.
- Write Review. Photo classification of found photos is this step, not 04a/04b.
- Say a miss means “this business has no profile” — a miss is “ask”.
- Enqueue a 6th `trigger=onboarding` run for the same `tenant_id` inside 30 minutes (paid or
  freshness-window hit).
- Treat a River retry of an existing `etl.business_research_run` as a new run.
- Block business lookup, 03 Continue, or the client interview on this wait.

## Do

**Run cap (before any job):** count `etl.business_research_runs` with `trigger=onboarding` for
this `tenant_id` with `started_at > now() - 30 minutes`. If the count is **5 or more**, do not
insert a run, do not enqueue River jobs, do not call Maps / Parallel / Facebook / crawl. Set
`research_wait_until` = oldest of those five `started_at` + 30 minutes. Business lookup and source
changes still persist; 01 still returns; UI still goes to 03. Profile and SSE carry
`research_wait_until`.

If the count is **0–4**, insert one `etl.business_research_runs` row (`tenant_id`,
`onboarding_session_id`, `trigger=onboarding`, `started_at=now()`, `place_id` when a Maps
listing was selected), then enqueue the jobs below with that `run_id`.

Each River job writes sources and events on that run. Registry-only onboarding sessions still
get a run.

| Job | Fold / checklist | `etl.business_research_sources.kind` |
| --- | --- | --- |
| Google listing | Maps profile, marketing phone, website, opening hours, reviews, photos | `google_maps_listing` |
| Facebook | Facebook profile / URL, public Facebook reviews, **public posts and post images when they exist** | `facebook` / `social_profile` / `facebook_post` |
| Services and area | trade, services, service area | `website_crawl` / `directory` |
| Founder | founder | `directory` |
| Accreditations | trade-registry certifications | `trade_registry` |
| Reviews and photos | reviews, rating, photos | `review` / `photo` |

Adapters live in `internal/etl` (Google Maps Details, upsert `etl.google_maps_listings`; scrape
when Maps is not configured), Vercel fast extract (LLM over retrieved text, no search tools),
Facebook lookup (`etl.facebook_pages` + reviews + posts), photo classification (hero / project / service /
founder / logo), trade-registry lookups (Safe Electric, RGI, … for IE; Gas Safe, NICEIC, … for
GB). Discovery of a URL or listing without `place_id` or a known website URL is **Parallel**
through Vercel AI Gateway (`gateway.tools.parallelSearch()`).

Before any **external** fetch: look up the latest `etl.fetches` by kind + stable key (and
`etl.google_maps_listings` by `place_id` on the Maps path). If that fetch is inside the
30-minute freshness window → reuse `raw`; still write `etl.business_research_sources` for
**this** onboarding session (`fetch_id` on the source points at the reused fetch; the run
already exists). Company registry parquet and
Find autocomplete are not this cache. There is no forever TTL — [ETL](../../other/etl/architecture.md).

Instagram / LinkedIn may appear inside a fast extract; persist Instagram as `social_profile`
+ `instagram_post` when a public URL is known. LinkedIn is not a post extract in this pass.

Each job is its own River job. On finish: `etl.business_research_events` +
`etl.business_research_sources` (`kind`, `external_id`, `source_ref`, lookup `status`,
`confidence`; `raw` only when there is no listing or reviews table). Clear in-progress on the
checklist projection. Google listing job also upserts `etl.google_maps_listings` (columns +
`latest_fetch_id`), hours, reviews (on the order of **20** reviews; exact cap **TBD** as a
constant). Reviews job writes further review rows when Details did not already return them.
Facebook job upserts `etl.facebook_pages`, `etl.facebook_page_reviews`, `etl.facebook_posts`
(+ post photos), then loads reviews onto `business_profile_reviews`
(`origin=facebook_business_page`, `facebook_page_review_external_id`) and post images onto
the media library — same load rules as Maps; do not wait for Facebook Login. Lookup outcomes
(`matched` / `ambiguous` / `not_found` / `not_attempted` / `blocked` / `error`) live on the
source row’s `status`. A Facebook URL with no public posts is `not_found` / empty for `facebook_post`,
not a run failure.

Profile deltas go through [build-profile](build-profile.md) (conflict rule: fold does not move).
Imported review rows set `origin` (`google_maps_listing` / `facebook_business_page`) and land
`in_pool`. The pin + review citation job in this file writes `is_top` / `top_position` and the
review citation column; it is not a contractor question.

## Persist

`etl.business_research_runs` (one row per enqueue, `trigger=onboarding`, `place_id` on the
Maps path); `etl.business_research_events`, `etl.business_research_sources` (`fetch_id` when
a fetch was reused or inserted), `etl.fetches` (insert on a
real call; never overwrite), `etl.watermarks`, `etl.google_maps_listings` (+ hours and
reviews), `etl.facebook_pages` / reviews / posts, `etl.imported_media`. Fold via build-profile.
Pin + review citation job writes `is_top` / `top_position` and the review citation column
(`ai_generations`). It does not write `website_slot_reviews`.
`research_wait_until` is derived (oldest in-window onboarding run + 30 minutes) when the cap
is hit; it is not a separate table. Expose it on `GET .../profile` and the onboarding session
SSE.

## Fail

Retryable River jobs. Fail leaves prior fold + source `status=error`. In-progress checklist rows
clear when the job ends. Do not change onboarding session status. Job retry keeps the same
`run_id`.

Run cap: not a pipeline Fail. 01 business lookup still succeeds. A later source change that would start
a 6th run in 30 minutes does not enqueue 02; the mutating request returns `429` with
`research_wait_until`. Prior fold and in-flight jobs stay.

## Out

SSE on the onboarding session stream. 03 and/or 04a/04b may already be open.

## Invariants

- 02 starts on 01 return, before 03, when the tenant is under the run cap.
- At most **5 runs per `tenant_id` per rolling 30 minutes**. The next run waits until the
  oldest of those five is 30 minutes old.
- A run is one enqueue. River retries are not a new run.
- Freshness-window hit still writes source for this onboarding session (when a run is
  allowed).
- Photo classification is here, not in 04a/04b.
- Parallel only via the Vercel AI Gateway Parallel server tool.
- The wait does not change onboarding session status and does not block 03/04.

## Pin top reviews and extract review citations

After reviews land on the fold, enqueue this job (same idea as picking/describing photos). It
does not block 03/04. It writes `is_top` / `top_position` and review citations for **ads**.
It does **not** copy that set onto `website_slot_reviews`. After 05 has created reviews
website sections, enqueue (or run) the pick of reviews per website section in
[05](05-apply-website-template.md) if those arrays are still empty. Record every LLM run: internal reasoning, user-visible output, tool
calls
([LLM layer](../../../general-architecture/llm-layer.md)).

**Pick (one shot).** Dump the pool into context (1M input is enough). Each review in the prompt
has a handle `review_001`, `review_002`, … (prompt-only, not owner-facing). The model returns
the list of handles to pin, order = featured-first. That becomes `is_top` + dense
`top_position` 1…n from list order, written in one transaction (same replace as
[details HTTP](../../other/details/api.md)). Do not merge onto an existing top set (that
would clash on `top_position`). If any `is_top` is already set, skip the pin (the owner
already chose). The owner can change the set later on Certifications and reviews.

**Review citations (parallel).** Separate LLM calls, one per pinned review (and any review that
still needs a review citation): extract a review citation up to `maxLength` 500 (~2–3
sentences) from `body`.

- Overlap of the review citation with **actual substrings** of `body` must be **>90%**. Below
  that: retry / fail the extract; do not ship invented paraphrase.
- Do **not** insert `[...]`.
- Omitting or switching clauses is allowed only as concatenation of those near-exact
  substrings.
- **Typos:** the review citation may fix missing spaces (e.g. `time,were` → `time, were`). Do
  not otherwise rewrite.

Example: raw leak/roof story → review citation is two substrings joined with a space, no
ellipsis; comma-spacing fixed.

Raw: *They arrived on time,were polite,showed my husband the work they had completed and tidied
up everything afterwards. … I would certainly recommend them to anyone. Thank you John & Team!*

Review citation: *They arrived on time, were polite, showed my husband the work they had
completed and tidied up everything afterwards. I would certainly recommend them to anyone.
Thank you John & Team!*

Cards may show the review citation with the matching spans highlighted (e.g. blue) on the
review `body`. Owner-written: the review citation may equal `body`.
