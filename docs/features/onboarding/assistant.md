# Onboarding assistant

Guide only: as if a person were helping the contractor through Find, Review, and
the field screens. It does **not** conduct a client interview, does **not**
write the business profile via interview tools, does **not** Archive interview
Project cards, and does **not** share the CMS
thread, tool registry, or assistant screen context.

CMS dispatcher, allowed set, and voice transport: [assistant](../assistant/README.md). This file is the
onboarding-specific isolation. HTTP: [api.md](api.md). Overlay tables:
[assistant persistence](../assistant/persistence.md). Isolation:
[onboarding persistence](persistence.md).

Website preview on `/onboarding/preview-and-edit/` is **not** this assistant.
That surface is the [onboarding website editor](website-editor.md).

## Isolation

- Conversation is **onboarding-session-scoped** (the onboarding session token),
  not `tenant_id`. Overlay rows are `assistant.thread_items` /
  `assistant.runs`. Never hydrate from the CMS thread.
- One conversation per onboarding session. There is no `/thread/new` and no
  `completed` chain.
- After website activation those routes **403**. Do not migrate the conversation
  onto the CMS thread.
- Knowledge:
  `internal/onboarding/assistant/knowledge/onboarding_knowledge_base_registry.yaml`
  (includes the shared product glossary). Must not import `internal/assistant`.
  Seed **instructions**: knowledge + current step + visible fields. `tools=[]`.
  No unpublished website working copy. No CMS `tools=`.
- No `obtained_information` / `end_interview`. Client-interview writer tools are
  not in this registry.
- **Not billed.** No 402. Still write `ai_generations` (`thread_id` on the
  `onboarding_assistant` thread). Voice create stores the exact instructions
  on `ai_generations.input` (reconstructable; hydrate omits it). Usage on
  transcripts is recorded, not debited.
- In-flight lock is `assistant.runs`, unique running per
  `onboarding_session_id` (not `tenant_id`). Voice lock starts at
  realtime-connection create and ends on close / crash. A second
  realtime-connection create while running is **409** `in_flight_run`. No
  cancel HTTP. Hydrate does not return runs and does not join `ai_generations`.
- **No text backup.** There is no `GET /v1/onboarding/assistant/thread/ws`.
  `GET /v1/onboarding/assistant/thread` may hydrate for a later Voice turn.
  Default launcher stays DustOrb.
- Persist utterances on `POST /v1/onboarding/assistant/voice/transcripts`:
  committed xAI Voice events already on that socket (owner
  `input_audio_transcription.completed`, assistant
  `output_audio_transcript.done`). Go maps to **text**, **`offset_seconds`**
  (from `audio_start_ms` when present), and `provider_event` jsonb. Reconstruct
  `[m:ss owner]` / `[m:ss assistant]` + `body` from typed `thread_item_kind`.

  Never say **user**.

  Never `thread_item_kind=system`. `created_at` is the row insert time. If xAI
  omitted a committed transcript, skip the row — do not call STT again. Do
  **not** store the Voice recording (no signed-URL PUT, no `files` row, no
  `recording_file_id`). Do not invent a second text dump route. Frontend posts
  leftover transcripts on close. Live audio is browser ↔ the xAI region for the
  business country ([voice agent](../../general-architecture/voice-agent.md)) and is not kept by us. Knowledge includes the
  product glossary; Voice create sets keyterms and `replace` (Placis →
  **Play-sis**).
- Launcher: DustOrb bottom right, **visible**, voice off until they click. Cue
  **Click to turn on voice**; close → **Enable voice guide**. Prerecorded intro
  on click, then live Q&A. The intro does not replay if they turn the guide on
  again more than **5 seconds** after that first intro began. Denied microphone:
  cue **Allow microphone access in your browser**; click retries; do not leave
  Voice on; do not create the realtime connection. Owner copy is **Assistant**,
  never guide on those screens. Look: [assistant design decision 6](../assistant/design-decision-record.md). Denied
  microphone [design decision 8](../assistant/design-decision-record.md); greeting [design decision 9](../assistant/design-decision-record.md); realtime after
  microphone [design decision 10](../assistant/design-decision-record.md). Look: [`apps/demo/`](../../../apps/demo/README.md) `/onboarding/*`.
- Realtime connection is created **when they turn the voice guide on and the
  microphone is granted**, not on Find mount.

`channel` on `onboarding_sessions` stays (04a writer vs leftover). 04b writer is
still out.

Client interview **data entry** stays the contractor filling fields ([04a](pipeline/04a-text-client-interview.md)).
Agent writer ([04b](pipeline/04b-voice-client-interview.md)) is out.
