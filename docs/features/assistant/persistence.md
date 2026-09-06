# Assistant — persistence

CMS assistant overlay tables. Conventions:
[persistence conventions](../../general-architecture/persistence.md)
(Postgres schema `assistant`). Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).

Thread **identity** is [`ai.threads`](../../infrastructure/ai/README.md) (`thread_kind=cms_assistant` or
`onboarding_assistant`). This feature owns overlay items and the in-flight run.
Shared AI traces: [AI layer](../../infrastructure/ai/README.md) (`ai.ai_generations`). Guide isolation:
[onboarding assistant](../onboarding/assistant.md). Usage credit: [billing](../billing/persistence.md). Website last-writer:
[website edit history](../website/persistence.md)
(`edit_history.ai_generation_id`). Voice recordings:
[files](../../infrastructure/files.md). Logic:
[architecture.md](architecture.md).

`ai` is shared `LLMProvider` + threads + traces. No `ai_generation_id` on
thread items. Follow and Plan are not columns. Reject notice and the Voice
transcription notice are thread items / prompt assembly, not new columns.
Voice `provider_event` is the forwarded xAI JSON (jsonb,
persistence-only); hydrate omits it.

Do **not** keep leftover `website_assistant_threads` /
`website_assistant_turns` (websites schema). Do **not** keep
`assistant.threads` as an identity table.

## Tables

### `thread_items`

- **Columns:** `id`, `tenant_id` fk, `thread_id` fk → `ai.threads`,
  `thread_item_kind`, `body`, `icon`, `offset_seconds` int nullable
  (`>= 0`; Voice utterances only; seconds from `audio_start_ms` on
  paired `speech_started` when present; null if that key is missing or on
  text items), `provider_event` jsonb nullable (forwarded xAI JSON;
  Voice only; omit from GET), `created_at` (row insert)
- **Enums:** `thread_item_kind` → `owner` / `assistant` / `tool_summary`
  / `thinking`; `icon` → `write` / `think` / null
- **Written by:** `GET /v1/assistant/thread/ws`;
  `POST /v1/assistant/voice/transcripts`;
  `POST /v1/assistant/voice/tool-calls`;
  `POST /v1/assistant/record-reject`; `CompactAssistantThread`;
  `POST /v1/onboarding/assistant/voice/transcripts`
- **Notes:** Do not store the recording file. Do not bake `[m:ss …]`
  into `body`. Compaction is `cms_assistant` only. Guide items share
  this table (`thread_kind=onboarding_assistant` on `ai.threads`).

### `runs`

- **Columns:** `id`, `tenant_id` fk, `thread_id` fk → `ai.threads`,
  `onboarding_session_id` nullable fk (`onboarding.onboarding_sessions`;
  required when the thread is `onboarding_assistant`; null on CMS /
  unpaid website editor), `status`, `channel`, `assistant_screen`,
  `ask_first_status`, `ai_generation_id` uuid nullable (audit row for
  this run; **not** a thread FK), `recording_file_id` uuid nullable fk
  (`files`; CMS voice only), timestamps
- **Enums:** `status` → `running` / `succeeded` / `failed`; `channel` →
  `text` / `voice`; `ask_first_status` → `pending` / `applied` /
  `rejected` / null; `assistant_screen` → CMS v1 closed enum
- **Uniques:** `(tenant_id) WHERE status = 'running' AND
  onboarding_session_id IS NULL`; `(onboarding_session_id) WHERE
  status = 'running'`
- **Written by:** `GET /v1/assistant/thread/ws`;
  `POST /v1/assistant/voice/realtime-connection`;
  `POST /v1/assistant/record-apply`;
  `POST /v1/assistant/record-reject`;
  `POST /v1/assistant/voice/recordings/{id}/complete`;
  `POST /v1/onboarding/assistant/voice/realtime-connection`;
  `POST /v1/onboarding/assistant/voice/transcripts`
- **Notes:** Unactivated 06 / `GenerateWebsiteCopy` also holds
  `running` on the CMS unique while unpaid
  ([website 03](../website/pipeline/03-website-copy-generation.md)).
  Guide runs set `onboarding_session_id` and leave `assistant_screen` /
  `ask_first_status` / `recording_file_id` null. Instant apply never
  writes `ask_first_status=pending`.

## Indexes

Unique: `(tenant_id) WHERE status = 'running' AND onboarding_session_id
IS NULL` on `runs`; `(onboarding_session_id) WHERE status = 'running'`
on `runs`. Unique current CMS thread lives on `ai.threads`. Lookup:
`(thread_id, created_at)` on `thread_items`; compaction on
`ai.threads.last_activity_at` and `ai.threads.last_assistant_edit_at`
(`thread_kind=cms_assistant`; tool events, not a discard timer).

River job `CompactAssistantThread`:
[jobs](../../infrastructure/jobs.md). Same function on text 128K
overflow and Voice seed-too-large. No 24h discard.
