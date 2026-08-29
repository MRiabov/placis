# Voice agent

Voice is a **channel into the same governed tools as text**, not a later
milestone and not a separate product. Everything sits behind a
voice-service-neutral interface; the concrete voice service is swappable. Text
and voice both write through the same tools. Never say “activate” for the voice
agent — that word is website activation. The owner turns it on.

Dictation / manual ASR / TTS is **not kept**: it's legacy, dropped for latency.

## Surfaces (v1)

- **Website editor** (`/cms/website`): empty composer turns the canvas orb on.
  First Voice start plays the prerecorded greeting; starting Voice again more
  than **5 seconds** after that greeting began does not replay it.
  `POST /v1/assistant/voice/realtime-connection` only after the microphone is
  granted. Governed website assistant tools. Also **explains the current
  screen** from the product knowledge base.
- **Ads** (`/cms/ads` list and workspace): product **guide** plus media-library
  `cleanup_image` (then placement PATCH). Generate / revise / rewrite stay Ads
  UI (Create ad and generate, Revise, Review copy orbs). Existing field orbs
  stay.
- **Onboarding guide:** DustOrb bottom right, visible, voice off. Click
  **Click to turn on voice**: ask for the microphone, then a **prerecorded
  intro** while `POST /v1/onboarding/assistant/voice/realtime-connection` is
  created; they ask questions after. Do not create that connection if the
  microphone was refused. Turn on again more than **5 seconds** after that intro
  began: no second intro. Owner copy is **guide** / **voice guide**. Talk them
  through
  the current onboarding screen (example on Find: Google Maps listing and
  company registry). `tools=[]`. Not `confirm_conflict` / client-interview
  tools. Not a second client interview after website activation. Close (×) then
  **Enable voice guide**. Not on the wait teaser. Voice → text backup:
  `GET /v1/onboarding/assistant/thread/ws` (look TBD).
- **Onboarding client-interview voice: out.** Text 04a stays the writer. Do not
  ship 04b as v1. `/cms` Start client interview stays hidden.

`/cms` two-card home is not a voice surface. Details / Media library / Usage &
billing can be explained from the knowledge base; they are not the main v1 tool
surface.

## Knowledge base

A small set of owner-facing markdown docs loaded **into memory**. Not a large
retrieved knowledge base. Cannot unvalidated-write or skip website publication
validation.

CMS and onboarding assistants: [assistant](../features/assistant/README.md). Audio **never** hits Go. The chatty
socket is only browser ↔ voice service. Go gets typed HTTP **finals** under
`/v1/assistant/voice/` (`tool-calls`, `transcripts`) and onboarding
`/v1/onboarding/assistant/voice/`. Do not add a Go WebSocket for audio, VAD,
playback, or transcript deltas. Voice-service request logs and connection
resumption are ops, not the assistant thread and not `ai_generations`.

## Go voice adapter

The adapter (not the browser) is responsible for:

1. Create the short-lived secret (`POST …/voice/realtime-connection`).
2. Pin a **dated** voice model id (not `grok-voice-latest`).
3. Seed **instructions** (knowledge concat + profile + screen / step). Do
   **not** replay the thread as billed `conversation.item.create` items.
4. Pass the full CMS `tools=` list (onboarding: `tools=[]`).
5. Close / drop the connection on CMS **402** `usage_credit_exhausted`.

## Realtime connection — short-lived secret, audio bypasses the backend

1. The frontend asks the backend for a short-lived
   **realtime connection secret**
   (`POST /v1/assistant/voice/realtime-connection` or the onboarding twin).
2. The backend creates it through the voice adapter and returns only
   browser-safe connection fields.
3. The frontend connects **directly to the voice service**; live audio never
   flows through the backend.
4. The browser never receives the long-lived voice API key.

CMS create **includes** the unpublished website working copy when
`assistant_screen` is `website_editor`. Other CMS screens omit that blob.
Onboarding create: current step + visible fields, no canvas.

**Two routes** (lifecycle gate is one auth mode per prefix):

- CMS: `POST /v1/assistant/voice/realtime-connection` (Clerk JWT, active tenant)
- Onboarding: `POST /v1/onboarding/assistant/voice/realtime-connection`
  (onboarding session token)

Do **not** create `POST /v1/voice/realtime-connection`.

Voice tool flow: (1) voice service `function_call` on **its** WS → browser;
(2) browser `POST /v1/assistant/voice/tool-calls`, waits for HTTP events;
(3) browser writes `function_call_output` on the **same voice-service WS**.
Go does **not** upsert unpublished website rows on tool-calls.

There is no structured-instruction handoff.

Record reasoning, owner-visible output, and tool calls ([llm-layer](llm-layer.md)). Overlay
thinking is `thread_items.kind=thinking` at turn time.
`ai_generations.internal_reasoning` is audit only (empty if the voice service
did not emit it). Hydrate never reads audit.

## Idle stop

Frontend-owned. If the owner does not speak for **30 seconds** (named constant,
asserted in [assistant testing](../features/assistant/testing.md)), stop the
conversation (leftover transcripts + usage, recording upload via signed URL,
drop realtime connection). Same for CMS and onboarding. A warning at
**20 seconds** that it will end — look TBD. Go does not enforce this idle timer.

## Billing (xAI Speech to Speech)

The concrete voice service today is **xAI Speech to Speech**. It is **not**
billed like a text LLM call.

xAI invoices **per minute of audio sent or received** (both directions), plus
**$0.004 per text `conversation.item.create`**. `function_call_output` and
audio-content items are not that text fee. `response.create` is not a billable
event. Published audio rate 2026-08-28: `grok-voice-think-fast-2.0` $0.08 / min.
Pin a dated model id; do not ride `grok-voice-latest`. Do not enable xAI
server-side search / MCP tools (extra per-call fees). Do not use provisioned
phone numbers.

Owner debit and ×5: [billing meters](../features/billing/README.md). CMS only. Onboarding guide is not billed
to the contractor. Go never sees PCM (live audio or the debug recording PUT).
xAI does not document a token-style usage object on `response.done`; the browser
measures audio sent + received (and billed text items) and posts that on
`POST /v1/assistant/voice/transcripts` (onboarding twin under
`/v1/onboarding/assistant/voice/transcripts`), including a usage-only POST when
Voice turns off. After Voice ends, the browser PUTs the recording to object
storage via a signed URL
([assistant architecture](../features/assistant/architecture.md)).

Seed knowledge in connection **instructions**. Do not replay the assistant
thread as billed text items. Nested image/cleanup from a voice tool is another
billed LLM/image call. xAI caps a connection at 120 minutes; that is
separate from the short-lived secret TTL.

## Authority

Voice is transport, not authority. The agent calls the same governed, typed,
validated tools as text; it cannot do website publication or bypass validation.
Failed Go POSTs still return `function_call_output` on the voice-service socket.

Onboarding ADR 2 previously defaulted `frontend-2` to voice during onboarding
and treated voice as a second client-interview writer. That client-interview
default is out (2026-08-27); keep the old entry.
