# Assistant jobs

Conventions and index: [jobs](../../infrastructure/jobs.md). Named
identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers). Closed
`## Workflows` and `## Jobs`. Overflow is `###` with a backticked River
job kind under Jobs (skip unactivated).

## Workflows

| Workflow | Steps |
| --- | --- |
| `assistant_thread_compaction` | `assistant_thread_compaction` |

## Jobs

| River job kind | Args | Unique key | Do |
| --- | --- | --- | --- |
| `assistant_thread_compaction` | `thread_id` | `thread_id` while pending/running | compact `ai.threads` in place |

### `assistant_thread_compaction`

Worker: `internal/assistant/jobs.go`. The same in-process function as
today. Triggers:

- `ai.threads.last_activity_at` older than **12 hours**
  (`thread_kind=cms_assistant`)
- **text** `LLMProvider` prompt assembly would exceed **128K tokens**
- Voice **instructions** seed would be too large to send
  (`realtime-connection` create — not mid-utterance)

Keep the last **3 owner** and last **3 assistant** `thread_items` (plus
`tool_summary` / `thinking` in that tail). Older items become **one**
`assistant` summary in place; `compacted_through_item_id` advances.
Kept Voice items keep `offset_seconds` and `provider_event`. Summarize
with a cheap flash model (DeepSeek V4 Flash or current Qwen Flash —
**pin a dated id**, not `*-latest`). Write a new `ai_generations` row
for that call (on that `cms_assistant` thread).
`bill_usage=bill-allow-out-of-balance` (`usage_category=text`): debit when
remaining > 0; remaining 0 still compacts (**our usage** only). Does not
rewrite existing `ai_generations` rows. Compaction prompt is assistant
`prompts.yaml` (not Go). It does **not** include a pending Ask-first
reject notice as a special case. It **does** include the Voice
transcription notice when the thread has a `channel=voice` run. Not a
live xAI Voice connection trim. There is no 24h discard. **Skip**
threads whose tenant is `status=unactivated` (onboarding website editor
unpaid `current` must not compact — 12h, 128K overflow, or
compact-before-seed would refill the five unpaid prompts).

Onboarding 06 stays River job kind `website_copy_generation`
([website jobs](../website/jobs.md)). Each website page’s agent is **20**
tool-using model turns (same constant as the CMS assistant, per
website page).
