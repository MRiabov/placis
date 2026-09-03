# Assistant testing

One full-stack E2E per journey below. Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).
DTOs and Routes: [api.md](api.md). Tables: [persistence.md](persistence.md).

Public 1:1 HappyPath specs live under `## Integration` (one
`### TestHappyPath*` per [api.md](api.md) Routes row). **Verify** through
HTTP. They do not replace these E2E journeys or frontend Full. **Do not
create** paths are omitted. Go funcs stay on `leftover_tests.go`.

`## E2E` is both-sides Playwright: UI, frontend-owned timers/cues, and
multi-route / cross-feature handoffs. It does not re-list each
Method+path HappyPath. Frontend Full is SPA + MSW Method+path, not
Postgres and not OpenAPI 1:1.

Named idle constant: **30 seconds** with no owner speech → frontend stops
the voice conversation (CMS and onboarding). Assert that constant in E2E.
20s warning look TBD (do not assert UI). Go does not enforce idle.

Named agent-loop constants live on the Route 1:1 rows (WS / tool-calls):
**20** tool-using model turns after one owner send or utterance (text and
Voice). **Owner input is characters** (text **4000**, owner utterance
**5000**). **Text:** **128K tokens** assembled context, **12K tokens**
generation per turn (agent back and forth — not a 5000-character cap).
Wrap-up notice on **text** turns 18–20. **21st text** inference has empty
`tools=` and a plaintext summary (not 409). Voice after 20 tool rounds
does not execute more tools.

## E2E

### CMS

#### Setup

E2E (Playwright, both sides). Playwright drives `frontend-2` against the
real API + real Postgres. Activated tenant. Voice/LLM faked. Go +
Postgres + `frontend-2` not mocked.

#### Exercise

1. **Dock** — Owner opens website editor / Ads / Details and calls
   bottom-right **Assistant**. Visiting `/cms` without calling does not
   hydrate.
2. **Screen switch during speech** — Owner moves website editor →
   Details during speech; speech continues. Next owner send carries one
   switch notification for Details. `switch_assistant_screen` opens Ads;
   `get_context_about_screen` returns Ads context without navigating.
3. **Ask first canvas** — Instant apply vs Ask first. Apply / Reject
   pills on the canvas; dirty keys in tenant+thread `localStorage`.
4. **Voice → text** — After a tool-using Voice turn, Switch to text.
   First typed send; second typed send; Voice then text again.
5. **Idle and greeting** — First Voice start plays the prerecorded
   greeting. Start Voice again more than 5s after that greeting began.
   After 30s with no owner speech, frontend closes. Denied microphone:
   **Try again** retries getUserMedia; **Switch to text mode** opens the
   composer.
6. **06 overlap** — Activate (09) while 06 is still writing a website
   slot; CMS PATCH of that website slot. CMS assistant POSTs while 06 is
   running.

#### Verify

1. **Dock** — UI: thread hydrates on call. `/cms` without calling does
   not hydrate.
2. **Screen switch** — Speech continues through the move. Next send uses
   Details context. Tool opens Ads (allowed set then includes Ads
   `cleanup_image`). Peek does not navigate and does not authorize ads
   writes while still on the website editor. `create_project` on
   `website_editor` leaves a **project draft**. Those tools on Ads (or
   on Projects) are rejected in the UI.
3. **Ask first canvas** — Instant apply: no Apply/Reject pills. Ask
   first: pills over the composer; Apply PATCHes dirty keys then
   record-apply. Reject does not revert-after-apply. While pending, New
   thread / second text / second Voice stay locked in the UI. Same Voice
   connection may continue.
4. **Voice → text** — Expanded thread shows transcripts **and** muted
   tool lines. First text send after Voice includes the Voice
   transcription notice; second text send does not; Voice then text
   includes it again.
5. **Idle and greeting** — First start plays the greeting. Second start:
   DustOrb on, no second greeting. Idle **30 seconds** closes Voice;
   leftover transcripts posted; CMS recording upload (signed URL);
   realtime connection dropped. Denied mic: shared **notification**
   **Allow microphone access in your browser to talk. You can keep
   typing.** Assistant is not restored until Switch to text mode. No
   realtime-connection create until the microphone is granted.
6. **06 overlap** — CMS PATCH is last-write / `edit_history_conflict`,
   not assistant `in_flight_run`. CMS assistant POSTs are not 409
   because 06 is running. 09 completed unpaid `current` and ended
   `running` in the same transaction as `status=active`; CMS GET is a
   new empty `current`.

#### Fail

Denied microphone (no realtime-connection POST). 06 overlap is not
`in_flight_run`.

#### Mocked

Voice and LLM.

### Onboarding

#### Setup

E2E (Playwright, both sides). Playwright drives `frontend-2` against the
real API + real Postgres on an unactivated onboarding session.
Voice/LLM faked. Go + Postgres + `frontend-2` not mocked.

#### Exercise

1. **Launcher** — Bottom-right DustOrb visible, voice off, cue **Click
   to turn on voice**. Denied mic stays retry cue (no Switch to text).
2. **Turn on** — Click DustOrb: cue gone, prerecorded intro, microphone
   granted, then realtime connection created. Close → **Enable voice
   guide**. Hidden on wait teaser. Turn on again more than 5s after that
   intro began.
3. **No composer** — After voice utterances, UI has no text backup.
4. **Idle and denied mic** — Same 30s frontend stop as CMS. Click
   DustOrb retries denied mic. After pay, guide is gone.

#### Verify

1. **Launcher** — Conversation is onboarding-session-scoped. DustOrb
   cue visible.
2. **Turn on** — Intro plays once; no second intro after 5s. Wait teaser
   hides the launcher.
3. **No composer** — No text composer / Switch to text. Profile is
   unchanged (guide only).
4. **Idle and denied mic** — Not billed. Leftover transcripts posted;
   **no** recording upload. Denied mic: cue **Allow microphone access in
   your browser**; Voice does not stay on; no realtime-connection until
   granted. After pay, UI is CMS, not the guide.

DB (this story; what Persist names):
`onboarding.assistant_conversation_items`,
`onboarding.assistant_runs`, `ai.threads`
(`thread_kind=onboarding_assistant`, unique per
`onboarding_session_id`).

#### Fail

Denied microphone (no realtime-connection POST). Guide gone after pay.

#### Mocked

Voice and LLM.

### Onboarding website editor

#### Setup

E2E (Playwright, both sides). Playwright drives `frontend-2` against the
real API + real Postgres. Unpublished website from 05; 06 may still be
running. [website-editor.md](../onboarding/website-editor.md).

#### Exercise

**Wait → website preview → prompt → pay** — Wait teaser
`/onboarding/preview` then `/onboarding/preview-and-edit/`. Unsigned
land hydrates the unpaid thread (onboarding session token). Sign up. One
signed-in owner prompt after 06 idle. Canvas updates via website-editor
PATCH (instant apply). Pay (09).

#### Verify

Unsigned land shows 06 `tool_summary` while copy is still running.
`/cms/website` shows the unpublished change. After pay, CMS thread is a
new empty `current` (unpaid thread completed). Sixth unpaid prompt is
out of this story (pay CTA, not 402).

#### Mocked

LLM. Voice unused.

## Integration

### TestHappyPathV1AssistantThread — Route

Backend. Go `TestHappyPathV1AssistantThread`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant. No
`current`. No `frontend-2`. No Worker.

#### Exercise

`GET /v1/assistant/thread`. Response `AssistantThreadRead`.

#### Verify

Exercise body: `AssistantThreadRead` (`items`, not `thread_items`).
Omits `runs`, `provider_event`, recording URLs. No `current` →
**persists into** `ai.threads` empty `current`. Empty is `items: []`.
Hydrate does not join `ai_generations`.

#### Fail

`403` `tenant_unactivated`.

### TestHappyPathV1AssistantThreadWs — Route

Backend. Go `TestHappyPathV1AssistantThreadWs`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
Hydrated `current`. No `frontend-2`. No Worker.

#### Exercise

`GET /v1/assistant/thread/ws`. Request `AssistantOwnerMessage`. Response
`AssistantTokenDelta`, `AssistantThinkingEvent`,
`AssistantToolActivityEvent`, `AssistantWsError`.

#### Verify

Exercise body: stream events for one owner send. **persists into**
`thread_items`, `runs`, `ai_generations`, `ai_use_ledger_entries`. Must
not: hydrate; `/thread/new`; voice HTTP; `record-apply` /
`record-reject`; dump `ai_generations`. Create then GET thread shows
items (GET omits `runs`). Agent-loop: **20** tool-using turns; owner
input **4000**; text **128K** / **12K**; wrap-up on text turns 18–20;
21st text inference empty `tools=` plaintext summary (not 409). 128K
overflow compact in-place then assemble again (same rules as the 12h
job).

#### Fail

`403` `tenant_unactivated`. `402` `usage_credit_exhausted`. `409`
`in_flight_run`. `409` `allowed_set_rejected`. `400` `follow: false`.

#### Mocked

LLM.

### TestHappyPathV1AssistantThreadNew — Route

Backend. Go `TestHappyPathV1AssistantThreadNew`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
Hydrated `current`. No `frontend-2`. No Worker.

#### Exercise

`POST /v1/assistant/thread/new`. Response `AssistantThreadRead`.

#### Verify

Create then GET thread: `items: []`. **persists into** `ai.threads`
(previous `status=completed`, insert `current`). Does not drop Voice.

#### Fail

`403` `tenant_unactivated`. Racing second POST `409`
`thread_current_exists`. In-flight run `409` `in_flight_run`. Voice on
→ 409 (does not drop Voice).

### TestHappyPathV1AssistantRecordApply — Route

Backend. Go `TestHappyPathV1AssistantRecordApply`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
Pending `ask_first_status=pending` run. Website PATCH already applied
dirty keys (fixture). No `frontend-2`. No Worker.

#### Exercise

`POST /v1/assistant/record-apply`. Request `AssistantRecordApplyCreate`.

#### Verify

Empty 200. **persists into** `runs.ask_first_status`. Create then GET
thread still omits `runs`. Must not: website slot payload; upsert
unpublished website rows. Instant apply never writes
`ask_first_status=pending`.

#### Fail

`403` `tenant_unactivated`. `409` `ask_first_not_pending` unless
`pending`. Second transition 409.

### TestHappyPathV1AssistantRecordReject — Route

Backend. Go `TestHappyPathV1AssistantRecordReject`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
Pending `ask_first_status=pending` run. No `frontend-2`. No Worker.

#### Exercise

`POST /v1/assistant/record-reject`. Request
`AssistantRecordRejectCreate`.

#### Verify

Empty 200. **persists into** `runs`, `thread_items` (muted item). Create
then GET thread includes the muted item. No LLM. Must not: upsert or
delete unpublished website rows. Not 402.

#### Fail

`403` `tenant_unactivated`. `409` `ask_first_not_pending`.

### TestHappyPathV1AssistantVoiceRealtimeConnection — Route

Backend. Go `TestHappyPathV1AssistantVoiceRealtimeConnection`. OpenAPI
1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
Microphone granted (fixture). No `frontend-2`. No Worker.

#### Exercise

`POST /v1/assistant/voice/realtime-connection`. Request
`AssistantVoiceRealtimeConnectionCreate`. Response
`AssistantVoiceRealtimeConnectionRead`.

#### Verify

Exercise body: `AssistantVoiceRealtimeConnectionRead`. Realtime URL host
is **eu-west-1** for Find `ie`/`gb` and **us-east-1** for Find `us`
(`wss://{region}.api.x.ai/v1/realtime`), not a frontend-chosen host.
Includes **`grok-transcribe`**, **Placis** in keyterms, and `replace`
**Play-sis**. Always Ask first on the run. **persists into** `runs`,
`ai_generations` (instructions on `ai_generations.input`). Voice create
has no `plan` / `ask_first` / `follow`. Voice seed-too-large compact
then seed (same rules as the 12h job). Must not: long-lived voice API
key; browser-chosen region or host; Go WebSocket.

#### Fail

`403` `tenant_unactivated`. `402` `usage_credit_exhausted`. `409`
`in_flight_run`. Exhausted usage credit drops the CMS realtime
connection.

#### Mocked

Voice.

### TestHappyPathV1AssistantVoiceToolCalls — Route

Backend. Go `TestHappyPathV1AssistantVoiceToolCalls`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
Voice connection on (current voice run). No `frontend-2`. No Worker.

#### Exercise

`POST /v1/assistant/voice/tool-calls`. Request
`AssistantVoiceToolCallsCreate`. Response `AssistantVoiceToolEventRead`.

#### Verify

Exercise body: `AssistantVoiceToolEventRead`. **persists into**
`thread_items` (`tool_summary`), `ai_generations`,
`ai_use_ledger_entries`. Failed `function_call_output` still reaches
the voice-service socket. `in_flight_run` is a second start. After 20
tool rounds do not execute more tools. Must not: freeform tool
registry; wait on the text WS; upsert unpublished website rows.

#### Fail

`403` `tenant_unactivated`. `402` `usage_credit_exhausted` (nested billed
LLM or image). `409` `in_flight_run`. `409` `allowed_set_rejected`
(`update_slot` while on Ads). `get_ad` unknown / other-tenant id is
**404**, not screen-gate 409. Projects write tools on Ads (or on
Projects) `409` `allowed_set_rejected`.

#### Mocked

Voice. Assistant tools.

### TestHappyPathV1AssistantVoiceTranscripts — Route

Backend. Go `TestHappyPathV1AssistantVoiceTranscripts`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
Committed Voice events. No `frontend-2`. No Worker.

#### Exercise

`POST /v1/assistant/voice/transcripts`. Request
`AssistantVoiceTranscriptsCreate`.

#### Verify

HTTP **200** (settlement). **persists into** `thread_items`
(`provider_event` jsonb; GET omits it), `ai_use_ledger_entries`
(`usage_category=voice`). Map `AssistantVoiceOwnerTranscriptEvent` /
`AssistantVoiceAssistantTranscriptEvent`. `offset_seconds` from
`audio_start_ms` on paired `AssistantVoiceSpeechStartedEvent` when that
key exists; else null. Reconstruct `[m:ss owner]` / `[m:ss assistant]`.
Never say **user**. If a committed transcript was omitted, no row. Voice
minutes debit from `AssistantVoiceUsage` on transcripts (and connection
close), not from tool-calls. Must not: PCM; `.updated` / `.delta`;
recording file; invent `offset_seconds`; `thread_item_kind=system`;
`POST /v1/stt`.

#### Fail

`403` `tenant_unactivated`.

#### Mocked

Voice.

### TestHappyPathV1AssistantVoiceRecordings — Route

Backend. Go `TestHappyPathV1AssistantVoiceRecordings`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
CMS Voice off after a turn. No `frontend-2`. No Worker.

#### Exercise

`POST /v1/assistant/voice/recordings`. Request
`AssistantVoiceRecordingCreate`. Response
`AssistantVoiceRecordingRead`.

#### Verify

Exercise body: `AssistantVoiceRecordingRead`. **persists into** `files`.
Must not: recording file on this POST; `/v1/media-assets`. GET thread
does not return the URL. The recording file is never posted to Go.

#### Fail

`403` `tenant_unactivated`. `404` bad `run_id`. `409` already has a
recording. `413` `byte_size`.

#### Mocked

Voice. MinIO is real (Testcontainers).

### TestHappyPathV1AssistantVoiceRecordingsIdComplete — Route

Backend. Go `TestHappyPathV1AssistantVoiceRecordingsIdComplete`. OpenAPI
1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant. A
recording id from create. PUT already succeeded (MinIO). No
`frontend-2`. No Worker.

#### Exercise

`POST /v1/assistant/voice/recordings/{id}/complete`.

#### Verify

HTTP 2xx. **persists into** `runs.recording_file_id`. GET thread does
not return the URL. Must not: recording file on this POST.

#### Fail

`403` `tenant_unactivated`. `404` not this tenant’s voice recording.

#### Mocked

Voice. MinIO is real (Testcontainers).

### HappyPathAssistantFull — frontend Full

Frontend. Vitest `HappyPathAssistantFull`. CMS dock, not OpenAPI 1:1.

#### Setup

Frontend (jsdom / Vitest, MSW, no Go). Activated tenant.

#### Exercise

Open website editor, call Assistant, send one owner message. MSW
`GET /v1/assistant/thread`, `GET /v1/assistant/thread/ws`.

#### Verify

UI: thread hydrates; owner message appears. MSW saw those Method+path
strings. Postgres rows are the backend test.

#### Mocked

All HTTP via MSW.
