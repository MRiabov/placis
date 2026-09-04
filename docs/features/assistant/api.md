# Assistant HTTP

Conventions: [HTTP conventions](../../general-architecture/api.md).
Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).
Logic: [architecture.md](architecture.md). Tables:
[persistence.md](persistence.md). Website-editor apply is website PATCH
then `record-apply` / `record-reject`; those routes live here, not under
`/v1/websites/{website_prefix}/editor/pages/{page_id}/assistant`.

**Auth default:** Clerk JWT, active tenant. Mutating unary Routes send
`Idempotency-Key` (not the text WebSocket). Unactivated tenant: **403**
`tenant_unactivated` on every `/v1/assistant/…` route (HTTP and the text
WebSocket). Unpaid website preview:
[`/v1/onboarding/website/assistant/…`](../onboarding/website-editor.md)
(same DTO names). Activated owner: **403** on all
`/v1/onboarding/assistant/…` and `/v1/onboarding/website/…` routes.

Caps are mixed. **Owner input is characters:** composer
`AssistantOwnerMessage.body` **4000**; owner Voice utterance **5000**.
**Text agent back and forth is tokens:** assembled context **128K** and
generation **12K** per model turn ([architecture.md](architecture.md)) —
thinking, assistant `body`, and tool `summary` persist that generation.
Do **not** use a 5000-character `maxLength` as generation. **Voice:** no Go
token cap on the live connection. HTTP still puts a storage `maxLength`
on those strings (OpenAPI). Do **not** add `agent_turn_limit` 409.

Huma may not host `GET /v1/assistant/thread/ws`; event structs still land
in `/openapi.json` for typegen (same rule as SSE). Audio never hits this
socket. Hydrate, `/thread/new`, voice HTTP, `record-apply`, and
`record-reject` stay unary HTTP.

Serve-only jsonb: Voice `provider_event` is persistence-only; **omit**
from GET. **Omit** `ai_generations` and `runs` on hydrate and the text
WebSocket. Extra keys 4xx. Field name is **`items`**, not
`thread_items`. `409 edit_history_conflict` stays on website PATCH
([website HTTP](../website/api.md)).

## DTOs

### Assistant

| DTO | Fields | Description |
| --- | --- | --- |
| `AssistantThreadRead` | `id`, `status`, `last_activity_at`, `items: []AssistantThreadItemRead` | Hydrate / new thread |
| `AssistantThreadItemRead` | `thread_item_kind`, `body`, `icon`, `offset_seconds`, `created_at` | One `items[]` row; omit `provider_event` |
| `AssistantOwnerMessage` | `type`, `body`, `assistant_screen`, `plan`, `ask_first`, `website_working_copy: AssistantWebsiteWorkingCopy` | WS inbound; `type=owner_message` |
| `AssistantWebsiteWorkingCopy` | `pages: []WebsitePageRead`, `menus: WebsiteMenusRead`, `website_styles: WebsiteSettingsRead` | Omit off `website_editor` |
| `AssistantTokenDelta` | `type`, `delta` | WS outbound; `type=token_delta` |
| `AssistantThinkingEvent` | `type`, `body` | WS outbound; `type=thinking` |
| `AssistantToolActivityEvent` | `type`, `status`, `summary`, `icon` | WS outbound; `type=tool_activity` |
| `AssistantWsError` | `type`, `code`, `message` | WS outbound; `type=error` |
| `AssistantRecordApplyCreate` | `run_id` | Ask first Apply |
| `AssistantRecordRejectCreate` | `run_id` | Ask first Reject |

Omit `website_working_copy` off `website_editor`. `plan` / `ask_first`
only when `assistant_screen` is `website_editor`. **Follow** is not a
field; `follow: false` → **400**. No website pointer list this pass
(`open_website` deferred).

### Voice

| DTO | Fields | Description |
| --- | --- | --- |
| `AssistantVoiceRealtimeConnectionCreate` | `assistant_screen`, `website_working_copy: AssistantWebsiteWorkingCopy` | Voice create; no `plan` / `ask_first` / `follow` |
| `AssistantVoiceRealtimeConnectionRead` | `secret`, `expires_at`, `realtime_url` | Browser-safe; omit API key and region field |
| `AssistantVoiceToolCallsCreate` | `assistant_screen`, `website_working_copy: AssistantWebsiteWorkingCopy`, `tools` | Closed CMS tool union; args in [website editor tools](../website/assistant.md) |
| `AssistantVoiceToolEventRead` | `status`, `summary`, `icon` | HTTP JSON; not pushed on the Go WS |
| `AssistantVoiceTranscriptsCreate` | `events: oneOf AssistantVoiceOwnerTranscriptEvent / AssistantVoiceAssistantTranscriptEvent / AssistantVoiceSpeechStartedEvent`, `usage: AssistantVoiceUsage`, `internal_reasoning` | `events` omit on usage-only; `usage` required when debiting |
| `AssistantVoiceUsage` | `audio_seconds_sent`, `audio_seconds_received`, `billed_text_item_count` | Debit body; extra keys 4xx |
| `AssistantVoiceOwnerTranscriptEvent` | `type`, `item_id`, `transcript` | `type=conversation.item.input_audio_transcription.completed` |
| `AssistantVoiceAssistantTranscriptEvent` | `type`, `item_id`, `transcript` | `type=response.output_audio_transcript.done` |
| `AssistantVoiceSpeechStartedEvent` | `type`, `item_id`, `audio_start_ms` | `type=input_audio_buffer.speech_started` |
| `AssistantVoiceRecordingCreate` | `run_id`, `content_type`, `byte_size` | Signed-URL grant |
| `AssistantVoiceRecordingRead` | `id`, `signed_url`, `expires_at` | `files` id + PUT URL |

Do **not** add `input_tokens` / `output_tokens` on
`AssistantVoiceUsage`. Voice `ai_generations.input_tokens` /
`output_tokens` stay null.

## Routes

### Assistant

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/assistant/thread/ws` | CMS Assistant text composer after hydrate | `AssistantOwnerMessage` | `AssistantTokenDelta`, `AssistantThinkingEvent`, `AssistantToolActivityEvent`, `AssistantWsError` | `ai.threads`, `thread_items` | `thread_items`, `runs`, `ai_generations`, `ai_use_ledger_entries` | Text chat pipe; `StreamAssistantThread`; `bill_usage=billed` (`usage_category=text`) | `403` `tenant_unactivated`; `402` `usage_credit_exhausted`; `409` `in_flight_run`; `409` `allowed_set_rejected`; `400` `follow: false` | Hydrate; `/thread/new`; voice HTTP; `record-apply` / `record-reject`; dump `ai_generations` |
| `GET /v1/assistant/thread` | Bottom-right **Assistant**; visiting `/cms` without calling does not hydrate | | `AssistantThreadRead` | `ai.threads`, `thread_items` | `ai.threads` | No `current` → insert empty `current`; empty is `items: []` | `403` `tenant_unactivated` | Field `thread_items`; return `runs`, `provider_event`, recording URLs |
| `POST /v1/assistant/thread/new` | **New thread** / clear context | | `AssistantThreadRead` | | `ai.threads` | Previous `status=completed`; `items: []`; does not drop Voice | `403` `tenant_unactivated`; `409` `thread_current_exists`; `409` `in_flight_run` | `/thread/clear`; `status=cleared` |
| `POST /v1/assistant/record-apply` | Ask first **Apply** after website PATCH | `AssistantRecordApplyCreate` | | `runs` | `runs.ask_first_status` | Empty 200; metadata only | `403` `tenant_unactivated`; `409` `ask_first_not_pending` | Website slot payload; upsert unpublished website rows |
| `POST /v1/assistant/record-reject` | Ask first **Reject** | `AssistantRecordRejectCreate` | | `runs` | `runs`, `thread_items` | Empty 200; muted thread item; no LLM | `403` `tenant_unactivated`; `409` `ask_first_not_pending` | Upsert or delete unpublished website rows; 402 |

### GET /v1/assistant/thread/ws

Inbound closed `oneOf` on `type`: `owner_message` only. Assistant screen
switch is a field on that message when the screen changed since the last
**owner** request, not a second event. `website_working_copy` /
`plan` / `ask_first` only when `assistant_screen` is `website_editor`.

Outbound closed `oneOf` on `type`: `token_delta`, `thinking`,
`tool_activity`, `error`. `tool_activity.status` is `planned` /
`applied` / `skipped` / `failed`. `409` `allowed_set_rejected` is a
failed activity event on this socket.

### Voice

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /v1/assistant/voice/realtime-connection` | CMS Assistant after microphone granted | `AssistantVoiceRealtimeConnectionCreate` | `AssistantVoiceRealtimeConnectionRead` | | `runs`, `ai_generations` | Always Ask first on the run; `CreateAssistantVoiceRealtimeConnection`; Voice adapter `bill_usage=billed`; **calls** xAI region from business country | `403` `tenant_unactivated`; `402` `usage_credit_exhausted`; `409` `in_flight_run` | Long-lived voice API key; browser-chosen region or host; Go WebSocket |
| `POST /v1/assistant/voice/tool-calls` | Browser after voice-service `function_call` | `AssistantVoiceToolCallsCreate` | `AssistantVoiceToolEventRead` | `runs` | `thread_items`, `ai_generations`, `ai_use_ledger_entries` | `CreateAssistantVoiceToolCalls`; nested image / ads `ai` calls `bill_usage=billed`; `in_flight_run` is a second start; after 20 tool rounds do not execute more tools | `403` `tenant_unactivated`; `402` `usage_credit_exhausted`; `409` `in_flight_run`; `409` `allowed_set_rejected` | Freeform tool registry; wait on the text WS; upsert unpublished website rows |
| `POST /v1/assistant/voice/transcripts` | Committed utterances; usage-only when Voice turns off | `AssistantVoiceTranscriptsCreate` | | | `thread_items`, `ai_use_ledger_entries` | `CreateAssistantVoiceTranscripts`; Voice adapter records **their usage** (`usage_category=voice`); settlement 200; `in_flight_run` is a second start | `403` `tenant_unactivated` | PCM; `.updated` / `.delta`; `POST /v1/stt`; recording file; invent `offset_seconds`; `thread_item_kind=system` |
| `POST /v1/assistant/voice/recordings` | CMS Voice off (including idle) | `AssistantVoiceRecordingCreate` | `AssistantVoiceRecordingRead` | `runs` | `files` | Signed URL; browser PUT; then complete | `403` `tenant_unactivated`; `404` bad `run_id`; `409` already has a recording; `413` `byte_size` | Recording file on this POST; `/v1/media-assets` |
| `POST /v1/assistant/voice/recordings/{id}/complete` | After PUT succeeds | | | `files` | `runs.recording_file_id` | `CompleteAssistantVoiceRecording` | `403` `tenant_unactivated`; `404` not this tenant’s voice recording | Recording file on this POST |

Onboarding guide Voice:
[POST /v1/onboarding/assistant/voice/realtime-connection](../onboarding/api.md).
`realtime_url` is `wss://{region}.api.x.ai/v1/realtime` (Go-picked region).
Not a Go WebSocket.

### POST /v1/assistant/voice/transcripts

Map `AssistantVoiceOwnerTranscriptEvent.transcript` to owner `body`
(maxLength **5000 characters**). Map
`AssistantVoiceAssistantTranscriptEvent.transcript` to assistant `body`
(storage `maxLength`, not a 5000-character generation cap). Pair owner
`.completed` with `AssistantVoiceSpeechStartedEvent` when both share
`item_id`. If `audio_start_ms` is set, `offset_seconds` is floor(ms/1000);
else null. Do not invent a browser clock. Assistant `.done` has no
documented clock (`offset_seconds` null unless a timing key is on that
JSON). Reconstruct `[m:ss owner]` / `[m:ss assistant]` from
`thread_item_kind` + `offset_seconds`. Never say **user**. Persist the
forwarded JSON as `provider_event` (omit from GET).
`internal_reasoning` empty string if omitted. `AssistantVoiceUsage` is
required when debiting. Settlement stays **200** so **their usage**
can land. Set `audio.input.transcription.model` **`grok-transcribe`** on
Voice create (not this POST).

## Do not create

- `/v1/websites/{website_prefix}/editor/pages/{page_id}/assistant` (moved here)
- `/v1/assistant/tool/*` per-tool paths
- `/v1/assistant/apply` that writes unpublished rows (use `record-apply` +
  PATCH)
- `POST /v1/assistant/turns` as the chat pipe (use
  `GET /v1/assistant/thread/ws`)
- `POST /v1/assistant/thread/clear` (use `POST /v1/assistant/thread/new`)
- `POST /v1/voice/realtime-connection`
- `POST /v1/assistant/tool-calls` (unprefixed)
- `POST /v1/assistant/transcripts` (unprefixed)
- Go WebSocket for audio or voice-service events
- Shared `/v1/voice/…` with an onboarding discriminator
- `POST …/assistant/cancel`
- `/v1/files` (media library owns photo upload; voice recordings are the
  routes above)
- The recording file on `POST /v1/assistant/voice/transcripts`
- `POST /v1/stt` and `wss://…/v1/stt` (use live Voice transcripts)
- `input_tokens` / `output_tokens` on `AssistantVoiceUsage`
- AsyncAPI (WS types are the DTOs above in `/openapi.json`)
