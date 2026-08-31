# 02 — Business research

Async, parallel. Starts when 01 business lookup returns — **not** when 03
finishes. Overlaps Review and the client interview. Progress on the
onboarding session SSE stream (reads `etl.runs` and the live business
profile as each extract chunk transforms). ETL fast extract (~1s) fills about half
of that ETL run kind’s checklist; ETL slow extract (~40s extra) fills the rest as fetches
arrive. Photo classification of found photos is ETL transform, not the client
interview.

Paid lookups (Maps, Parallel, Facebook, crawl) cost money. A naive contractor
must not be able to start that work dozens of times by repeating business
lookup, picking another company, or retrying. Cap it.

02 only calls **`etl.StartRun(etl_run_kinds, trigger=onboarding, force=false)`**.
Extract and transform: [ETL](../../etl/README.md). One `StartRun` creates one
`enqueue_id` and one ETL run per ETL run kind. River retries keep the same
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
- Call Parallel Search HTTP. Discovery is [web-search](../../etl/pipeline/web-search.md)
  (`gateway.tools.parallelSearch()`). Parallel Extract is the crawl adapter, not
  02.
- Use Exa, Perplexity, Tako, a model’s built-in search, `:online`, or
  OpenRouter web search.
- Text autosave, create a realtime connection, `end_interview`, interview field
  lists, set `channel`.
- Write Review. Photo classification is ETL transform, not 04a/04b.
- Say a miss means “this business has no profile” — a miss is “ask”.
- Enqueue a 6th `StartRun` (`trigger=onboarding`) for the same `tenant_id`
  inside 30 minutes (paid or cache-hit).
- Treat a River retry of an existing ETL run as a new enqueue.
- Block business lookup, 03 Continue, or the client interview on this wait.
- Wait for an ETL run kind’s `status=succeeded` before showing the ETL fast extract live
  business profile on the checklist.
- Pass `directory`, `review`, or `photo` as `StartRun` ETL run kinds. Scrape is
  ETL slow extract of `google_maps_listing`. Photo classification runs after photos
  attach. Crawl fills trade / founder / service areas (no directory job).
- Pass an implicit “all sources” list. Build `etl_run_kinds` from the table below.

## Do

**Enqueue cap (before StartRun):** count distinct `enqueue_id` on `etl.runs` for
this `tenant_id` with `trigger=onboarding` and
`started_at > now() - 30 minutes`. If **5 or more**, do not call `StartRun`. Set
`research_wait_until` = oldest of those five enqueue start times + 30 minutes.
Business lookup and source changes still persist; 01 still returns; UI still
goes to
03. Profile and SSE carry `research_wait_until`.

`StartRun` counts the same cap and inserts nothing if called over it
([ETL architecture](../../etl/architecture.md)). 02 checks first so business
lookup can stay **200** and a later source change can stay **429**.

If the count is **0–4**, call `StartRun` with the ETL run kinds below. Pass
`onboarding_session_id` and `force=false`. Copy onboarding session attach keys
onto the matching `etl.runs` rows (`place_id`, `website_url`). Find with only a
company registry record still gets Maps / crawl / Facebook / Instagram: [web
search](../../etl/pipeline/web-search.md) seeds Parallel from `legal_name`,
`company_number`, country, and `registered_office`. The first `place_id` /
website URL unblocks those runs in this enqueue. Maps-only Find still gets
`trade_registry` (lookup by `display_name` + country).

### ETL run kinds 02 passes

| Include when | ETL run kind | Live profile / checklist | Pipeline |
| --- | --- | --- | --- |
| Always | `google_maps_listing` | Maps profile, marketing phone, website, opening hours, reviews, photos, Projects from reviews usable as a Project (Details first, then scrape) | [Google Maps](../../etl/pipeline/google-maps.md) |
| Always | `facebook` | Facebook profile / URL / posts, Projects from posts. Waits for a Facebook URL / handle | [Facebook](../../etl/pipeline/facebook.md) |
| Always | `instagram` | Instagram profile / posts, Projects from posts. Waits for a handle | [Instagram](../../etl/pipeline/instagram.md) |
| Always | `website_crawl` | trade, services, service area, founder, photos, Projects (homepage fast, then parallel remainder). Waits for a website URL | [Website crawl](../../etl/pipeline/website-crawl.md) |
| Always | `trade_registry` | accreditations. Key is `company_number` + country when a company registry record is attached, else `display_name` + country (Maps-only is enough). Not the locked business-registry certification on Find | [Trade registry](../../etl/pipeline/trade-registry.md) |
| Missing `place_id` **or** missing website URL on the onboarding session at this `StartRun` | `web_search` | discover `place_id` / URL onto sibling runs (not a profile dump) | [Web search](../../etl/pipeline/web-search.md) |

Monday / Wednesday / Friday does not pass crawl, trade registry, or web search.
Instagram is a persisted ETL run kind (scrape).

ETL run kinds in this enqueue **start when their key exists**. Maps Details,
crawl links, and web search write discovered keys onto the waiting sibling run
(and the onboarding session). That is not a new `StartRun`. After Maps, crawl,
and web search (if any) have `succeeded` / `error` / `skipped`, a social ETL
run kind still missing its key becomes `skipped`.

Profile deltas go through ETL transform using [build-profile](build-profile.md).
Empty fields fill. On a research conflict the live business profile column is
not updated.

## Persist

`etl.runs` (one per ETL run kind, shared `enqueue_id`); fetches and listing as
extract chunks land; live business profile via transform of each chunk (not only
when the ETL run kind succeeds). `research_wait_until` is derived when the cap
is hit; it is not a table. Expose it on `GET .../profile` and the onboarding
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
