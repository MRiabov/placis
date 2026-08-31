# 02 — Business research

Async, parallel. Starts when 01 business lookup returns — **not** when 03
finishes. Overlaps Review and the client interview. Progress on the onboarding
session SSE stream (reads `etl.runs` and the live business profile as each
extract chunk transforms). Fast extract (~1s) fills about half of that ETL
kind’s checklist; slow extract (~40s extra) fills the rest as fetches arrive.
Photo classification of found photos is ETL transform, not the client interview.

Paid lookups (Maps, Parallel, Facebook, crawl) cost money. A naive contractor
must not be able to start that work dozens of times by repeating business
lookup, picking another company, or retrying. Cap it.

02 only calls **`etl.StartRun(etl_kinds, trigger=onboarding)`**. Extract and
transform: [ETL](../../etl/README.md). One `StartRun` creates one `enqueue_id` and one ETL run per
ETL kind. River retries keep the same `etl.runs.id`. Count distinct
`enqueue_id`, not jobs — otherwise one business lookup would already exceed the
cap.

## Trigger

01 business lookup returns with `online_research_consent_at` set, or sources
change on an existing onboarding session, **and** the tenant is under the
enqueue cap.

## Pre

- Onboarding session `status=client_interviewing`.
- `online_research_consent_at` set.
- Unactivated `tenant_id` on the onboarding session.
- Fewer than **5** distinct `etl.runs.enqueue_id` for that `tenant_id` with
  `trigger=onboarding` and `started_at` in the last **30 minutes**.

## Must not

- Own adapters, fetch tables, or the Google Maps listing (those are ETL).
- Call Parallel’s **Search** API; use Exa, Perplexity, Tako, a model’s built-in
  search, `:online`, or OpenRouter web search. Parallel Extract is the crawl
  adapter, not 02.
- Text autosave, create a realtime connection, `end_interview`, interview field
  lists, set `channel`.
- Write Review. Photo classification is ETL transform, not 04a/04b.
- Say a miss means “this business has no profile” — a miss is “ask”.
- Enqueue a 6th `StartRun` (`trigger=onboarding`) for the same `tenant_id`
  inside 30 minutes (paid or cache-hit).
- Treat a River retry of an existing ETL run as a new enqueue.
- Block business lookup, 03 Continue, or the client interview on this wait.
- Wait for an ETL kind’s `status=succeeded` before showing the fast extract live
  business profile on the checklist.

## Do

**Enqueue cap (before StartRun):** count distinct `enqueue_id` on `etl.runs` for
this `tenant_id` with `trigger=onboarding` and
`started_at > now() - 30 minutes`. If **5 or more**, do not call `StartRun`. Set
`research_wait_until` = oldest of those five enqueue start times + 30 minutes.
Business lookup and source changes still persist; 01 still returns; UI still
goes to
03. Profile and SSE carry `research_wait_until`.

If the count is **0–4**, call `StartRun` with the ETL kinds that apply (not an
implicit “all sources”). Registry-only sessions still get the ETL kinds they
have. Pass `onboarding_session_id`.

| ETL kind | Live profile / checklist | Pipeline |
| --- | --- | --- |
| `google_maps_listing` | Maps profile, marketing phone, website, opening hours, reviews, photos, Projects from reviews usable as a Project (Details first, then scrape) | [Google Maps](../../etl/pipeline/google-maps.md) |
| `facebook` | Facebook profile / URL / posts, Projects from posts | [Facebook](../../etl/pipeline/facebook.md) |
| `instagram` | Instagram profile / posts, Projects from posts | [Instagram](../../etl/pipeline/instagram.md) |
| `website_crawl` / `directory` | trade, services, service area, founder, photos, Projects (homepage fast, then parallel remainder) | [Website crawl](../../etl/pipeline/website-crawl.md) |
| `trade_registry` | accreditations | [Trade registry](../../etl/pipeline/trade-registry.md) |
| `web_search` | discover `place_id` / URL | [Web search](../../etl/pipeline/web-search.md) |
| `review` / `photo` | further reviews, photos | [Google Maps](../../etl/pipeline/google-maps.md), [photo classification](../../etl/pipeline/photo-classification.md) |

ETL kinds 02 may include that Monday / Wednesday / Friday does not: crawl, trade
registry, Parallel discovery. Instagram is a persisted ETL kind (scrape).

Profile deltas go through ETL transform using [build-profile](build-profile.md) (conflict rule:
live business profile is not updated).

## Persist

`etl.runs` (one per ETL kind, shared `enqueue_id`); fetches and listing as
extract chunks land; live business profile via transform of each chunk (not only
when the ETL kind succeeds). `research_wait_until` is derived when the cap is
hit; it is not a table. Expose it on `GET .../profile` and the onboarding
session SSE.

## Fail

Retryable River jobs inside ETL. Fail leaves prior live business profile +
`etl.runs.status=error`. In-progress checklist rows clear when the job ends. Do
not change onboarding session status. Job retry keeps the same `etl.runs.id`.

Enqueue cap: not a pipeline Fail. 01 business lookup still succeeds. A later
source change that would start a 6th enqueue in 30 minutes does not call
`StartRun`; the mutating request returns `429` with `research_wait_until`. Prior
live business profile and in-flight jobs stay.

## Out

SSE on the onboarding session stream (mirrors `etl.runs` and the live business
profile as chunks arrive). 03 and/or 04a/04b may already be open; the client
interview live-fills untouched controls and enriches lists
([04a](04a-text-client-interview.md)). Do not wait
for an ETL kind’s `status=succeeded` to show fast extract results.

## Invariants

- 02 starts on 01 return, before 03, when the tenant is under the enqueue cap.
- At most **5 onboarding `enqueue_id`s per `tenant_id` per rolling 30 minutes**.
  The next enqueue waits until the oldest of those five is 30 minutes old.
- An enqueue is one `StartRun`, not one ETL run. River retries are not a new
  enqueue.
- Photo classification is ETL transform, not 04a/04b.
- Parallel only via the Vercel AI Gateway Parallel server tool.
- The wait does not change onboarding session status and does not block 03/04.
