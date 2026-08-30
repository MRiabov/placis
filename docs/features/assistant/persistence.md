# Assistant — persistence

CMS assistant overlay tables. Conventions:
[persistence conventions](../../general-architecture/persistence.md)
(Postgres schema `assistant`).

Thread **identity** is [`ai.threads`](../../general-architecture/llm-layer.md)
(`kind=cms_assistant`). This feature owns items and the in-flight run. Shared AI
traces: [LLM layer](../../general-architecture/llm-layer.md)
(`ai.ai_generations`). Onboarding conversation:
[onboarding persistence](../onboarding/persistence.md). Usage credit:
[billing](../billing/persistence.md). Website last-writer:
[website edit history](../website/persistence.md)
(`edit_history.ai_generation_id`). Logic: [architecture.md](architecture.md).

**Principle:** `ai` is shared `LLMProvider` + threads + traces. This feature
owns overlay items. No `ai_generation_id` on thread items. Follow and Plan are
not columns. Reject notice and the Voice → text STT caveat are thread items /
prompt assembly, not new columns. Voice `provider_event` is the forwarded xAI
JSON (jsonb, persistence-only); hydrate omits it.

Do **not** keep leftover `website_assistant_threads` /
`website_assistant_turns` (website schema). Do **not** keep `assistant.threads`
as an identity table.

## Overlay items

- `thread_items` — `id`, `tenant_id` fk, `thread_id` fk → `ai.threads`, `kind`
  (`owner` / `assistant` / `tool_summary` / `thinking`), `body` text, `icon`
  (`write` / `think` / null), `offset_seconds` int nullable (`>= 0`; Voice
  utterances only; seconds from the xAI Voice connection clock on the committed
  transcript events for that utterance; null on text items), `provider_event`
  jsonb nullable (the forwarded xAI JSON for that utterance; Voice only; omit
  from GET), `created_at` (row insert). Index `(thread_id, created_at)`. Do
  not store recording file. Do not bake `[m:ss …]` into `body`.

## In-flight run

- `runs` — `id`, `tenant_id` fk, `thread_id` fk → `ai.threads`, `status`
  (`running` / `succeeded` / `failed`), `channel` (`text` / `voice`),
  `assistant_screen` (CMS v1 enum), `ask_first_status` (`pending` / `applied` /
  `rejected` / null), `ai_generation_id` uuid nullable (audit row for this run;
  **not** a thread FK), `recording_file_id` uuid nullable fk (`files`; CMS voice
  only), timestamps. Unique `(tenant_id) WHERE status = 'running'`.

## Audit (owned by `ai`)

`ai.threads`, `ai.ai_generations`, and `ai.ai_generation_tool_revisions` — see
[LLM layer](../../general-architecture/llm-layer.md). CMS assistant rows use
the tenant’s current `cms_assistant` thread (`thread_id` required). Unpaid
onboarding website editor uses that same `current` while unactivated. Onboarding
guide rows use an `onboarding_assistant` thread. Voice: `generation_type` voice;
`internal_reasoning` empty if the voice service did not emit it; `output` is
visible text; `cost_amount` from xAI usage (audio minutes + text-item fees);
`input_tokens` / `output_tokens` stay null. Record `knowledge_id` +
`knowledge_format_revision` when that call used a knowledge base. Voice create
writes the exact instructions blob to `ai_generations.input` (with keyterms /
`replace`); text turns write the exact assembled prompt. Prompt id is not a
substitute. Image **files** stay in `files` / `media_library`. CMS Voice
recording files stay in object storage; `runs.recording_file_id` points at
`files`. Onboarding voice runs have no `recording_file_id`. Voice items store
`provider_event` jsonb (forwarded xAI JSON); GET omits it.

## Indexes

Unique: `(tenant_id) WHERE status = 'running'` on `runs`. Unique current CMS
thread lives on `ai.threads`. Lookup: `(thread_id, created_at)` on
`thread_items`; compaction on `ai.threads.last_activity_at` and
`ai.threads.last_assistant_edit_at` (`kind=cms_assistant`; tool events, not a
discard timer).

River compaction job: [jobs](../../general-architecture/jobs.md). Same function
on text 128K overflow and Voice seed-too-large. No 24h discard.
