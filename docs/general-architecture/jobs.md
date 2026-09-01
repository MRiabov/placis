# Background jobs

Slow work runs off-request in `River` (Postgres-backed): AI generation, ETL
extract and transform, file processing, notifications, and export generation.
`cmd/api` runs the jobs in-process. Every job can be retried safely (an explicit
key). The queue is the isolation, not a second container.

River-managed tables for the job queue. Postgres schema `jobs`.

ETL: onboarding 02 and a Monday / Wednesday / Friday schedule both call
`etl.StartRun` ([ETL](../features/etl/README.md)). Stagger scheduled work across activated tenants. Crawl /
Maps scrape stay in-process; API p90-delta during scrape:
[processes.md](processes.md).

Stripe webhooks enqueue work and return; see [website activation](../features/onboarding/pipeline/09-website-activation.md). Onboarding
[automatic website copy generation](../features/onboarding/pipeline/06-website-copy-generation.md)
([website 03](../features/website/pipeline/03-website-copy-generation.md)) is
River job `website_copy_generation` after copying the website template’s
pages onto the unpublished website; it must not block the website
preview. Unique key = `tenant_id`.
[Reviews ranking for display](#reviews-ranking-for-display) is a separate
River job. Compaction **skips** `ai.threads` `thread_kind=cms_assistant`
whose tenant is `status=unactivated` (unpaid current must not compact).

## Automatic website copy generation

River job enum value `website_copy_generation`. Same job as onboarding 06
(enqueue, wait teaser, unpaid lock) and website 03 (website slot writes). Args:
`tenant_id` only. Unique key: `tenant_id` while pending/running. A second
enqueue while the first is in flight is a River unique conflict → HTTP
**409**. Do not HTTP-check uniqueness before insert (it races). After 09
the leftover job stays in schema `jobs` on that `tenant_id` (not
cancelled). CMS PATCH / assistant HTTP are **not** 409 because this job
is running (`assistant.runs` is a different lock).

`thread_kind=website_copy_generation`, `prompt_id=website_copy_generation` in
the onboarding package `prompts.yaml`. Worker: [website 03](../features/website/pipeline/03-website-copy-generation.md). Worker internal
render binding is still an
[open question](../features/website/catalog.md#open-questions).

## Reviews ranking for display

River job enum value `reviews_ranking_for_display`. Args: `tenant_id` only.
Unique key: `tenant_id` while pending/running. A second insert while the
first is in flight is a River unique conflict — treat as already queued.
Not HTTP 409 (nothing HTTP-enqueues this). After the first completes, a
later enqueue on the same tenant is allowed.

The worker always loads `in_pool` reviews, generates, and replaces
`is_top` / `top_position` (skip `algorithm=human`). Same replace as
Certifications and reviews PATCH. In that transaction it sets
`business_profiles.top_reviews_provisional`: **true** if overlapping ETL
for this onboarding enqueue is still running, else **false**. Scheduled
ranking always writes **false** (the run already `succeeded`). Args:
`tenant_id` only. No pass field. No `onboarding_session_id`.

`top_reviews_provisional` is not a skip key. A later
`reviews_ranking_for_display` may replace pins until owner PATCH sets
`algorithm=human` (and `top_reviews_provisional=false`). When to enqueue
is orchestration (below). When that enqueue’s ETL finishes with **no**
extra `in_pool` rows: set `top_reviews_provisional=false` without a
second generate.

`internal/jobs` worker calls the profile function. LLM:
`thread_kind=reviews_ranking_for_display`,
`prompt_id=reviews_ranking_for_display` in the profile package
`prompts.yaml`. Input: current `in_pool` rows (id, citation/body, rating,
origin, `published_at`). Output: ordered `review_ids[]`, length 1–30,
each id in that pool. Prompt prose, ranking heuristics, and dated model
id are unspecified. Not stars or recency.
[LLM layer](llm-layer.md).

**Onboarding** enqueue: [build-profile](../features/onboarding/pipeline/build-profile.md) (after ETL fast extract has `in_pool`
reviews; again when that enqueue’s overlapping ETL runs finish if additional
rows landed). **Scheduled ETL** (Monday / Wednesday / Friday): after a scheduled
run **succeeds** and new `in_pool` rows landed, enqueue **once** (not per
chunk). ETL transform does not rank. Website does not enqueue this job.

## Assistant thread compaction

River job **and** the same in-process function. Triggers:

- `ai.threads.last_activity_at` older than **12 hours**
  (`thread_kind=cms_assistant`)
- **text** `LLMProvider` prompt assembly would exceed **128K tokens**
- Voice **instructions** seed would be too large to send (`realtime-connection`
  create — not mid-utterance)

Keep the last **3 owner** and last **3 assistant** `thread_items` (plus
`tool_summary` / `thinking` in that tail). Older items become **one**
`assistant` summary in place; `compacted_through_item_id` advances. Kept Voice
items keep `offset_seconds` and `provider_event`. Summarize with a cheap flash
model (DeepSeek V4 Flash or current Qwen Flash — **pin a dated id**, not
`*-latest`). Write a new `ai_generations` row for that call (on that
`cms_assistant` thread). Does **not** debit usage credit (maintenance, not an
owner turn). Does not rewrite existing `ai_generations` rows. Compaction prompt
is assistant `prompts.yaml` (not Go). It does **not** include a pending
Ask-first reject notice as a special case. It **does** include the Voice
transcription notice when the thread has a `channel=voice` run. Not a live xAI
Voice connection trim. There is no 24h discard. **Skip** threads whose tenant is
`status=unactivated` (onboarding website editor unpaid `current` must not
compact — 12h, 128K overflow, or compact-before-seed would refill the five
unpaid prompts).

Onboarding [automatic website copy generation](../features/onboarding/pipeline/06-website-copy-generation.md) stays a River job with its own
cap (3 steps / 12 calls / 4 website pages), not the CMS agent’s 20 model turns.
