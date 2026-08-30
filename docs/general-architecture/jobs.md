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

Stripe webhooks enqueue work and return; see [website activation](../features/onboarding/pipeline/08-website-activation.md). Onboarding
[website copy generation](../features/onboarding/pipeline/06-website-copy-generation.md) is a River job after applying the website template; it
must not block the website preview link.

## Assistant thread compaction

River job **and** the same in-process function. Triggers:

- `assistant.threads.last_activity_at` older than **12 hours**
- **text** `LLMProvider` prompt assembly would exceed **128K tokens**
- Voice **instructions** seed would be too large to send (`realtime-connection`
  create — not mid-utterance)

Keep the last **3 owner** and last **3 assistant** `thread_items` (plus
`tool_summary` / `thinking` in that tail). Older items become **one**
`assistant` summary in place; `compacted_through_item_id` advances. Kept Voice
items keep `offset_seconds`. Summarize
with a cheap flash model (DeepSeek V4 Flash or current Qwen Flash —
**pin a dated id**, not `*-latest`). Write a new `ai_generations` row for that
call (`thread_id` set). Does **not** debit usage credit (maintenance, not an
owner turn). Does not rewrite existing `ai_generations` rows. Compaction prompt
is assistant `prompts.yaml` (not Go). It does **not** include a pending
Ask-first reject notice as a special case. It
**does** include the Voice STT caveat when the thread has a `channel=voice` run.
Not a live xAI Voice connection trim. There is no 24h discard.

Onboarding [website copy generation](../features/onboarding/pipeline/06-website-copy-generation.md) stays a River job with its own cap (3 steps
/ 12 calls / 4 website pages), not the CMS agent’s 20 model turns.
