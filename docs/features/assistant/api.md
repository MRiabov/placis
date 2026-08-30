# Assistant HTTP

Conventions: [HTTP conventions](../../general-architecture/api.md). Auth: Clerk JWT, active tenant, unless noted.
Logic: [architecture.md](architecture.md). Tables: [persistence.md](persistence.md). Website-editor apply still
uses website PATCH + `record-apply` / `record-reject`; those routes live here,
not under `/v1/website/editor/pages/{page_id}/assistant`.

Unactivated tenant: **403** `tenant_unactivated` on every `/v1/assistant/…`
route (HTTP and the text WebSocket). Unpaid website preview uses
[`/v1/onboarding/website-editor/assistant/…`](../onboarding/website-editor.md)
instead. Activated owner: **403** on all `/v1/onboarding/assistant/…` and
`/v1/onboarding/website-editor/assistant/…` routes.

Caps are mixed. **Owner input is characters:** composer `owner_message.body`
`maxLength` **4000**; owner Voice utterance **5000**. **Text agent back and
forth is tokens:** assembled context **128K** and generation **12K** per model
turn ([architecture.md](architecture.md)) — thinking, assistant `body`, and
tool `summary` persist that generation. Do **not** use a 5000-character
`maxLength` as generation. **Voice:** no Go token cap on the live connection;
do not treat a character cap as Voice generation. HTTP still puts a storage
`maxLength` on those strings (OpenAPI). Do **not** add `agent_turn_limit` 409.

## Serve only types on HTTP

| Location | Persistence | HTTP |
| --- | --- | --- |
| Thread | columns | `*Read` (`id`, `status` `current`/`completed`, `last_activity_at`). |
| Thread items | columns | `*Read` (`kind` enum, `body` string + `maxLength`, `icon` enum, `offset_seconds` int nullable, `created_at`). Owner `body` is **4000** (text) or **5000** (owner Voice utterance) **characters**. Assistant / `thinking` / `tool_summary` `body` storage `maxLength` is not generation — text generation is **12K tokens**. Field name is **`items`**, not `thread_items`. **Omit** `ai_generations` and `runs`. |
| Assistant screen context | — | Closed per-screen structs, not a JSON bag. |
| Voice tool-calls body | — | Closed union of CMS tool structs (name + the same types the LLM loop validates). |
| Voice transcripts | — | Closed union of committed xAI Voice events (below) + optional reasoning/usage. Go maps to `kind` / `body` / `offset_seconds`. **Omit** PCM, ASR/TTS deltas, recording file, `provider_event` on GET. |
| Voice realtime connection | — | Browser-safe secret + expiry + realtime URL (`string` + `maxLength`, `wss://…`). Region is Go-picked; **omit** a browser region field. |
| Text WebSocket events | — | Closed `oneOf` event names (same rule as SSE: no unconstrained `payload`). |

## Complete — Go WebSocket (text chat only)

Audio never uses this socket. Hydrate, `/thread/new`, voice HTTP,
`record-apply`, and `record-reject` stay unary HTTP. Huma may not host the
socket; event structs still land in `/openapi.json` for typegen.

### GET /v1/assistant/thread/ws

- **Auth:** Clerk JWT, active tenant
- **Callers:** CMS Assistant text composer after hydrate (including `/cms`
  once they have called the assistant). Not Voice.
- **Transport:** WebSocket. Query/`Authorization` as other Clerk sockets; not a
  POST body.
- **Owner → Go (closed union):**
  - `owner_message` — `body` string `maxLength` 4000; `assistant_screen` (CMS v1
    enum); `plan` / `ask_first` booleans when `assistant_screen` is
    `website_editor` (omit on other screens); unpublished website working copy
    when `website_editor`; assistant screen switch notification when the screen
    changed since the last **owner** request. **Follow** is not a field;
    `follow: false` → **400**.
- **Go → owner (closed union):** token deltas; `thinking` (`body` storage
  `maxLength`, generation is **12K tokens**); tool activity (`planned` /
  `applied` / `skipped` / `failed` + `summary` storage `maxLength`, generation
  is **12K tokens**, + `icon`); terminal `error` (`code`, `message`).
  **Must not** dump `ai_generations` or debug traces on this socket.
- **Errors:** `403` `tenant_unactivated`; `402` `usage_credit_exhausted`;
  `409` `in_flight_run`; `409` `allowed_set_rejected` (failed activity event on
  this socket).
- **Must not:** hydrate, `/thread/new`, voice create, transcripts, tool-calls,
  recordings, or record-apply/reject on this socket.

## Complete — HTTP

### GET /v1/assistant/thread

- **Auth:** Clerk JWT, active tenant
- **Callers:** bottom-right **Assistant** on an assistant screen, including
  `/cms`. Visiting `/cms` without calling does not hydrate.
- **Response:** current thread `*Read` (`id`, `status`, `last_activity_at`) +
  ordered `items` (`kind`, `body`, `icon`, `offset_seconds` nullable,
  `created_at`). No `current` → insert
  empty `current`. Empty thread is `200` with `items: []`.
- **Errors:** `403` `tenant_unactivated`.
- **Must not:** return `thread_items` as the field name; return `runs`, audit
  blobs, `provider_event`, or recording URLs.

### POST /v1/assistant/thread/new

- **Auth:** Clerk JWT, active tenant
- **Callers:** Assistant **New thread** / clear context. Does **not** preempt a
  running text or Voice run (`409` `in_flight_run`). Does **not** drop Voice.
- **Idempotency-Key:** yes.
- **Request:** empty body.
- **Response:** new thread `*Read` + `items: []`. Previous thread is
  `status=completed`.
- **Errors:** `403` `tenant_unactivated`; `409` `thread_current_exists`;
  `409` `in_flight_run`.
- **Must not:** name this `/thread/clear`; set `status=cleared`.

### POST /v1/assistant/record-apply

- **Auth:** Clerk JWT, active tenant
- **Callers:** Ask first **Apply** after the website editor PATCHed (or queued)
  the dirty keys.
- **Idempotency-Key:** yes.
- **Request:** metadata only (`run_id`). No unpublished payload.
- **Errors:** `403` `tenant_unactivated`; **409** `ask_first_not_pending`.
- **Must not:** accept a website slot payload; upsert unpublished website rows.

### POST /v1/assistant/record-reject

- **Auth:** Clerk JWT, active tenant
- **Callers:** Ask first **Reject**. Frontend drops pending edits in memory; no
  PATCH.
- **Idempotency-Key:** yes.
- **Request:** metadata only (`run_id`).
- **Errors:** `403` `tenant_unactivated`; **409** `ask_first_not_pending`.
- **Must not:** upsert or delete unpublished website rows; call the LLM (not
  402). **Does** append a muted thread item (edits did not land) for the next
  **model** turn’s reject notice.

### POST /v1/assistant/voice/realtime-connection

- **Auth:** Clerk JWT, active tenant
- **Callers:** CMS Assistant when Voice turns on, after the microphone is
  granted.
- **Idempotency-Key:** yes.
- **Request:** `assistant_screen` (CMS v1 enum); unpublished website working
  copy when `assistant_screen` is `website_editor` (omit that blob on other
  screens). No `plan` / `ask_first` / `follow`. Always Ask first on the run
  row.
- **Response:** browser-safe secret + expiry + **realtime URL** (`string` +
  `maxLength`, `wss://…` for the xAI region Go picked). **Not** a Go
  WebSocket. Audio is browser ↔ that URL. Go picks the region from the
  business country ([voice agent](../../general-architecture/voice-agent.md)).
- **Errors:** `403` `tenant_unactivated`; `402` `usage_credit_exhausted`;
  `409` `in_flight_run`.
- **Must not:** return the long-lived voice API key; accept a browser-chosen
  region or host.

Onboarding uses
[POST /v1/onboarding/assistant/voice/realtime-connection](../onboarding/api.md).

### POST /v1/assistant/voice/tool-calls

- **Auth:** Clerk JWT, active tenant
- **Callers:** browser, after a voice-service `function_call` on **that**
  voice-service WebSocket. Text does **not** use this route.
- **Idempotency-Key:** yes.
- **Request:** `assistant_screen`; unpublished website working copy when those
  tools need the canvas (`website_editor` writes); array of closed CMS tool
  structs (parallel).
- **Response:** HTTP JSON events (`planned` / `applied` / `skipped` / `failed`
  - `summary` / `icon`). Go does **not** push these on any WebSocket.
- **Errors:** `403` `tenant_unactivated`; `402` `usage_credit_exhausted`;
  `409` `in_flight_run` (a **second** start, not the current voice run);
  `409` `allowed_set_rejected`.
- **Must not:** accept freeform JSON as a tool registry; wait on
  `GET /v1/assistant/thread/ws` for these events; upsert unpublished website
  rows. After **20** tool-using rounds on this run, do not execute more tools
  (`function_call_output` that the budget is done).

### POST /v1/assistant/voice/transcripts

- **Auth:** Clerk JWT, active tenant
- **Callers:** browser after committed voice utterances, and usage-only when
  Voice turns off.
- **Idempotency-Key:** yes.
- **Request:** closed union of **committed** xAI Voice events already on that
  live socket — not a second STT request. Owner:
  `conversation.item.input_audio_transcription.completed` (`body` maxLength
  **5000 characters**). Assistant: `response.output_audio_transcript.done`
  (storage `maxLength`, not a 5000-character generation cap). Include the
  same-connection xAI timing event when the completed event has no
  Voice-connection clock (typically `input_audio_buffer.speech_started`). Go
  derives **`offset_seconds`** (int, `>= 0`, maximum 7200) from that xAI Voice
  connection clock (ms from this Voice run’s realtime-connection start →
  seconds). Reconstruct `[m:ss owner]` / `[m:ss assistant]` from `kind` +
  `offset_seconds`. Never say user. Persist the forwarded JSON as
  `provider_event` (jsonb; omitted from GET). Events may be omitted on a
  **usage-only** POST. If xAI did not emit a committed transcript, omit that
  utterance — do not invent text or offset. Reasoning if the voice service
  emitted it (`internal_reasoning`; empty string if omitted — do not invent).
  **Usage** (required when debiting): `audio_seconds_sent` (number),
  `audio_seconds_received` (number), `billed_text_item_count` (int). Optional
  typed xAI usage struct when present (named fields, not a JSON bag).
- **Errors:** `403` `tenant_unactivated`. Settlement stays **200** (not 402).
  `409` `in_flight_run` is only a **second** start, not the current voice run.
- **Must not:** accept PCM, ASR/TTS deltas, or the recording file; use
  `created_at` or a browser audio/wall clock as the conversation clock; call
  `POST /v1/stt` or `wss://…/v1/stt`; transcribe the recording; accept a
  freeform JSON bag of other xAI events.

### POST /v1/assistant/voice/recordings

- **Auth:** Clerk JWT, active tenant
- **Callers:** browser after Voice turns off (including idle stop).
- **Idempotency-Key:** yes.
- **Request:** `run_id`; `content_type` (`audio/webm` | `audio/mp4`);
  `byte_size` (int, `> 0`, maximum 33554432).
- **Response:** `id` (`files` id) + signed URL (`string` + `maxLength`) +
  expiry. Browser **PUT**s the object to that URL. Completes via
  `…/recordings/{id}/complete`.
- **Errors:** `403` `tenant_unactivated`; `404` if `run_id` is missing or not a
  voice run for this tenant; `409` if that run already has a recording;
  `413` if `byte_size` is over the maximum. `409` `in_flight_run` is only a
  **second** start, not the current voice run.
- **Must not:** accept the recording file on this POST; use
  `/v1/media-assets` for this.

### POST /v1/assistant/voice/recordings/{id}/complete

- **Auth:** Clerk JWT, active tenant
- **Callers:** browser after the PUT to the signed URL succeeds.
- **Idempotency-Key:** yes.
- **Errors:** `403` `tenant_unactivated`; `404` if the `files` row is not this
  tenant’s voice recording. `409` `in_flight_run` is only a **second** start,
  not the current voice run.
- **Must not:** accept the recording file.

## Named codes (this feature)

| `code` | HTTP |
| --- | --- |
| `tenant_unactivated` | 403 |
| `usage_credit_exhausted` | 402 |
| `in_flight_run` | 409 |
| `allowed_set_rejected` | 409 |
| `thread_current_exists` | 409 |
| `ask_first_not_pending` | 409 |

`409 edit_history_conflict` stays on website PATCH ([website HTTP](../website/api.md)), not here.

## Do not create

- `/v1/website/editor/pages/{page_id}/assistant` (moved here)
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
