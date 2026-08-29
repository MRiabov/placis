# Assistant — persistence

CMS assistant thread tables. Conventions:
[persistence conventions](../../general-architecture/persistence.md)
(Postgres schema `assistant`).

Shared AI traces: [LLM layer](../../general-architecture/llm-layer.md) (`ai.ai_generations`). Onboarding conversation:
[onboarding persistence](../onboarding/persistence.md). Usage credit: [billing](../billing/persistence.md). Website last-writer:
[website edit history](../website/persistence.md) (`edit_history.ai_generation_id`). Logic:
[architecture.md](architecture.md).

**Principle:** `ai` is shared `LLMProvider` + traces. This feature owns thread
rows. No `ai_generation_id` on thread rows.

Do **not** keep leftover `website_assistant_threads` /
`website_assistant_turns` (website schema).

## Threads

- `threads` — `id`, `tenant_id` fk, `status` (`current` / `completed`),
  `last_activity_at`, `last_assistant_edit_at`, `compacted_through_item_id`
  nullable fk, timestamps. Unique `(tenant_id) WHERE status = 'current'`.
- `thread_items` — `id`, `tenant_id` fk, `thread_id` fk, `kind` (`owner` /
  `assistant` / `tool_summary` / `thinking`), `body` text, `icon` (`write` /
  `think` / null), `created_at`. Index `(thread_id, created_at)`. Do not store
  recording file.

## In-flight run

- `runs` — `id`, `tenant_id` fk, `thread_id` fk, `status` (`running` /
  `succeeded` / `failed`), `channel` (`text` / `voice`), `assistant_screen`
  (CMS v1 enum), `ask_first_status` (`pending` / `applied` / `rejected` /
  null), `ai_generation_id` uuid nullable (audit row for this run; **not** a
  thread FK), `recording_file_id` uuid nullable fk (`files`; voice only),
  timestamps. Unique `(tenant_id) WHERE status = 'running'`.

## Audit (owned by `ai`)

`ai.ai_generations` and `ai.ai_generation_tool_revisions` — see
[LLM layer](../../general-architecture/llm-layer.md). CMS assistant rows set
`thread_id`. Onboarding rows set `conversation_id`. Voice:
`generation_type` voice; `internal_reasoning` empty if the voice service did
not emit it; `output` is visible text; `cost_amount` from xAI usage (audio
minutes + text-item fees); `input_tokens` / `output_tokens` stay null. Record
`knowledge_id` + `knowledge_format_revision` when that call used a knowledge
base. Image **files** stay in `files` / `media_library`. Voice recording files
stay in object storage; `runs.recording_file_id` points at `files`.

## Indexes

Unique: `(tenant_id) WHERE status = 'current'` on `threads`;
`(tenant_id) WHERE status = 'running'` on `runs`. Lookup: `(thread_id,
created_at)` on `thread_items`; compaction/discard on `threads.last_activity_at`
and `threads.last_assistant_edit_at`.

River compaction job: [jobs](../../general-architecture/jobs.md).
