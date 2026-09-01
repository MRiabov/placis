# 02 — Business research

Async, parallel. Starts when 01 business lookup returns — **not** when 03
finishes. Overlaps Review and the client interview. Progress on the onboarding
session SSE stream (reads `etl.runs` and the live business profile as each
extract chunk transforms). ETL fast extract (p95 ≤ 5s) fills about half of that
ETL run kind’s required keys; ETL slow extract (progressively over about 60s)
fills the rest as fetches arrive. Photo classification of found photos is ETL
transform, not the client interview.

Paid lookups (Maps, Parallel, Facebook, crawl) cost money. A naive contractor
must not be able to start that work dozens of times by repeating business
lookup, picking another company, or retrying. Cap it.

02 only calls **`etl.StartRun(trigger=onboarding, force=false)`** with the
onboarding ETL run kinds. Extract and transform: [ETL](../../etl/README.md). `StartRun` **inserts**
that ETL run kind’s extract River job kind ([jobs](../../../general-architecture/jobs.md)). When an ETL run kind
starts: [ETL run kind triggers](../../etl/pipeline/etl-run-kind-triggers.md). One `StartRun` creates one `enqueue_id`. An ETL
run is inserted when that ETL run kind **starts**. River retries keep the same
`etl.runs.id`. Count distinct `enqueue_id`, not jobs — otherwise one business
lookup would already exceed the cap.

01 already wrote legal identity and Maps autocomplete increments. 02 does not
repeat those writes and does not upsert `etl.google_maps_listings` itself.

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
- Call Parallel Search HTTP. Search is [web-search](../../etl/pipeline/web-search.md)
  (`gateway.tools.parallelSearch()`). Parallel Extract is the crawl adapter, not
  02.
- Use Exa, Perplexity, Tako, a model’s built-in search, `:online`, or
  OpenRouter web search.
- Text autosave, create a realtime connection, `end_interview`, client interview
  field lists, set `channel`.
- Write Review. Photo classification is ETL transform, not 04a/04b.
- Say a miss means “this business has no profile” — a miss is “ask”.
- Enqueue a 6th `StartRun` (`trigger=onboarding`) for the same `tenant_id`
  inside 30 minutes (paid or cache-hit).
- Treat a River retry of an existing ETL run as a new enqueue.
- Block business lookup, 03 Continue, or the client interview on this wait.
- Wait for an ETL run kind’s `status=succeeded` before showing the ETL fast
  extract live business profile on Review found vs missing.
- Pass `directory`, `review`, or `photo` as ETL run kinds. Scrape is ETL slow
  extract of `google_maps_listing`. Photo classification runs after photos
  attach. Crawl fills trade / founder / service areas (no directory job).
- Pass an implicit “all sources” list or a hand-built Always table. The
  onboarding ETL run kinds are the trigger table.
- Wait for a sibling ETL run kind to succeed before starting another. An ETL run
  kind starts when it has the details it needs.

## Do

`StartBusinessResearch` **calls** `etl.StartRun` (`trigger=onboarding`,
`force=false`) and **inserts** that ETL run kind’s extract River job
kind.

**Enqueue cap (before StartRun):** count distinct `enqueue_id` on `etl.runs` for
this `tenant_id` with `trigger=onboarding` and
`started_at > now() - 30 minutes`. If **5 or more**, do not call `StartRun`. Set
`research_wait_until` = oldest of those five enqueue start times + 30 minutes.
Business lookup and source changes still persist; 01 still returns; UI still
goes to 03. Profile and SSE carry `research_wait_until`.

`StartRun` counts the same cap and inserts nothing if called over it
([ETL architecture](../../etl/architecture.md)). 02 checks first so business
lookup can stay **200** and a later source change can stay **429**.

If the count is **0–4**, call `StartRun` with the onboarding ETL run kinds. Pass
`onboarding_session_id` and `force=false`. Copy Find attach and live-profile
details into the enqueue. The evaluator starts each ETL run kind that already
has what it needs (Maps from `place_id` **or** `display_name` + locality **or**
`legal_name` + locality; trade registry from `company_number` + country **or**
`display_name` + country; Parallel when some discoverable detail is still empty;
crawl / Facebook / Instagram when their URL/handle exists). Further ETL run
kinds start when details change — including 04a URL / handle writes. That is not
a new `StartRun`.

Profile deltas go through ETL transform using [build-profile](build-profile.md).
Empty fields fill. On a research conflict the live business profile column is
not updated.

## Persist

`etl.runs` (one per ETL run kind that started, shared `enqueue_id`); fetches and
listing as extract chunks land; live business profile via transform of each
chunk (not only when the ETL run kind succeeds). `research_wait_until` is
derived when the cap is hit; it is not a table. Expose it on
`GET /v1/onboarding/profile` and the onboarding session SSE.

## Fail

Retryable River jobs inside ETL. Fail leaves prior live business profile +
`etl.runs.status=error`. In-progress fill-status keys clear when the job ends.
Do not change onboarding session status. Job retry keeps the same `etl.runs.id`.

Enqueue cap: not a pipeline Fail. 01 business lookup still succeeds. A later
source change that would start a 6th enqueue in 30 minutes does not call
`StartRun`; the mutating request returns `429` with `research_wait_until`. Prior
live business profile and in-flight jobs stay.

## Out

SSE on the onboarding session stream (mirrors `etl.runs` and the live business
profile as chunks arrive). 03 and/or 04a/04b may already be open; the client
interview live-fills untouched controls and enriches lists
([04a](04a-text-client-interview.md)). Do not wait
for an ETL run kind’s `status=succeeded` to show ETL fast extract results.
Review ranking (`reviews_ranking_for_display`) runs **in parallel with the
client interview** if the pool already has rows, and **again when this
enqueue’s ETL finishes**
([build-profile](build-profile.md)).

## Invariants

- 02 starts on 01 return, before 03, when the tenant is under the enqueue cap.
- At most **5 onboarding `enqueue_id`s per `tenant_id` per rolling 30 minutes**.
  The next enqueue waits until the oldest of those five is 30 minutes old.
- An enqueue is one `StartRun`, not one ETL run. River retries are not a new
  enqueue.
- Photo classification is ETL transform, not 04a/04b.
- Parallel Search only via the Vercel AI Gateway Parallel server tool.
- The wait does not change onboarding session status and does not block 03/04.
- Review ranking (`reviews_ranking_for_display`) is not copying the website
  template’s pages and not website 03.
- 02 never passes `directory`, `review`, or `photo`.
- An ETL run kind starts from details, not from a sibling ETL run kind
  succeeding.
