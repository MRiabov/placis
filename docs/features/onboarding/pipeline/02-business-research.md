# 02 — Business research

Async, parallel. Starts when 01 business lookup returns — **not** when 03 finishes. Overlaps Review
and the client interview. Progress on the onboarding session SSE stream (reads `etl.runs`). Photo
classification of found photos is ETL transform, not the client interview.

Paid lookups (Maps, Parallel, Facebook, crawl) cost money. A naive contractor must not be able to
start that work dozens of times by repeating business lookup, picking another company, or retrying.
Cap it.

02 only calls **`etl.StartRun(kinds, trigger=onboarding)`**. Extract and transform:
[ETL](../../etl/README.md). One `StartRun` creates one `enqueue_id` and one ETL run
per kind. River retries keep the same `etl.runs.id`. Count distinct `enqueue_id`, not jobs —
otherwise one business lookup would already exceed the cap.

## Trigger

01 business lookup returns with `online_research_consent_at` set, or sources change on an existing
onboarding session, **and** the tenant is under the enqueue cap.

## Pre

- Onboarding session `status=client_interviewing`.
- `online_research_consent_at` set.
- Unactivated `tenant_id` on the onboarding session.
- Fewer than **5** distinct `etl.runs.enqueue_id` for that `tenant_id` with
  `trigger=onboarding` and `started_at` in the last **30 minutes**.

## Must not

- Own adapters, fetch tables, or the Google Maps listing (those are ETL).
- Call Parallel’s API; use Exa, Perplexity, Tako, a model’s built-in search, `:online`, or
  OpenRouter web search.
- Text autosave, create a realtime connection, `end_interview`, interview field lists, set `channel`.
- Write Review. Photo classification is ETL transform, not 04a/04b.
- Say a miss means “this business has no profile” — a miss is “ask”.
- Enqueue a 6th `StartRun` (`trigger=onboarding`) for the same `tenant_id` inside 30 minutes
  (paid or cache-hit).
- Treat a River retry of an existing ETL run as a new enqueue.
- Block business lookup, 03 Continue, or the client interview on this wait.

## Do

**Enqueue cap (before StartRun):** count distinct `enqueue_id` on `etl.runs` for this
`tenant_id` with `trigger=onboarding` and `started_at > now() - 30 minutes`. If **5 or more**,
do not call `StartRun`. Set `research_wait_until` = oldest of those five enqueue start times +
30 minutes. Business lookup and source changes still persist; 01 still returns; UI still goes to
03. Profile and SSE carry `research_wait_until`.

If the count is **0–4**, call `StartRun` with the kinds that apply (not an implicit “all
sources”). Registry-only sessions still get the kinds they have. Pass `onboarding_session_id`.

| Kind | Live profile / checklist |
| --- | --- |
| `google_maps_listing` | Maps profile, marketing phone, website, opening hours, reviews, photos |
| `facebook` | Facebook profile / URL / posts |
| `instagram` | Instagram profile / posts |
| `website_crawl` / `directory` | trade, services, service area, founder |
| `trade_registry` | accreditations |
| `review` / `photo` | further reviews, photos |

Kinds 02 may include that Monday / Wednesday / Friday does not: crawl, trade registry, Parallel
discovery. Instagram is a persisted kind (scrape).

Profile deltas go through ETL transform using [build-profile](build-profile.md) (conflict rule:
live business profile is not updated).

## Persist

`etl.runs` (one per kind, shared `enqueue_id`); fetches and listing on miss/extract; live business
profile via transform. `research_wait_until` is derived when the cap is hit; it is not a table. Expose it on
`GET .../profile` and the onboarding session SSE.

## Fail

Retryable River jobs inside ETL. Fail leaves prior live business profile + `etl.runs.status=error`. In-progress
checklist rows clear when the job ends. Do not change onboarding session status. Job retry keeps
the same `etl.runs.id`.

Enqueue cap: not a pipeline Fail. 01 business lookup still succeeds. A later source change that
would start a 6th enqueue in 30 minutes does not call `StartRun`; the mutating request returns
`429` with `research_wait_until`. Prior live business profile and in-flight jobs stay.

## Out

SSE on the onboarding session stream (mirrors `etl.runs`). 03 and/or 04a/04b may already be open.

## Invariants

- 02 starts on 01 return, before 03, when the tenant is under the enqueue cap.
- At most **5 onboarding `enqueue_id`s per `tenant_id` per rolling 30 minutes**. The next
  enqueue waits until the oldest of those five is 30 minutes old.
- An enqueue is one `StartRun`, not one ETL run. River retries are not a new enqueue.
- Photo classification is ETL transform, not 04a/04b.
- Parallel only via the Vercel AI Gateway Parallel server tool.
- The wait does not change onboarding session status and does not block 03/04.
