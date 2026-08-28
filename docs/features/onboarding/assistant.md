# Onboarding assistant

Guide only: as if a person were helping the contractor through Find, Review, and
the field screens. It does **not** conduct a client interview, does **not**
write the business profile via interview tools, and does **not** share the CMS
thread, tool registry, or assistant screen context.

CMS dispatcher, allowed set, and voice transport: [assistant](../assistant/README.md). This file is the
onboarding-specific isolation. HTTP: [api.md](api.md). Tables:
[persistence.md](persistence.md).

## Isolation

- Conversation is **onboarding-session-scoped** (the onboarding session token),
  not `tenant_id`. Tables under schema `onboarding`. Never hydrate from the CMS
  thread.
- One conversation per onboarding session. There is no `/thread/new` and no
  `completed` chain.
- After website activation those routes **403**. Do not migrate the conversation
  onto the CMS thread.
- Knowledge:
  `internal/onboarding/assistant/knowledge/onboarding_knowledge_base_registry.yaml`.
  Must not import `internal/assistant`. Seed **instructions**: knowledge +
  current step + visible fields. `tools=[]`. No unpublished website working
  copy. No CMS `tools=`.
- No `obtained_information` / `end_interview`. Client-interview writer tools are
  not in this registry.
- **Not billed.** No 402. Still write `ai_generations` (`conversation_id`).
  Usage on transcripts is recorded, not debited.
- In-flight lock is `onboarding.assistant_runs`, unique running per
  `onboarding_session_id` (not `tenant_id`). Voice lock starts at
  realtime-connection create and ends on close / crash. No cancel HTTP. Hydrate
  does not return runs and does not join `ai_generations`.
- Text backup: same conversation on `GET /v1/onboarding/assistant/thread/ws`.
  `tools=[]` — no tool dispatch. Look TBD. Default launcher stays the orb.
- Persist utterances on `POST /v1/onboarding/assistant/voice/transcripts`. After
  Voice ends, recording upload (signed URL) is the same pattern as CMS
  ([assistant architecture](../assistant/architecture.md)): object storage, not
  a Postgres binary, not overlay. Do not invent a second text dump route.
  Frontend posts leftover transcripts on close, then the recording if any.
- Launcher: DustOrb bottom right, **visible**, voice off until they click. Cue
  **Click to turn on voice**; close → **Enable voice guide**. Prerecorded intro
  on click, then live Q&A. The intro does not replay if they turn the guide on
  again more than **5 seconds** after that first intro began. Denied microphone:
  cue **Allow microphone access in your browser**; click retries; do not leave
  Voice on; do not create the realtime connection. Owner copy is **guide**,
  never Assistant on those screens. Look: [assistant design decision 6](../assistant/design-decision-record.md). Denied
  microphone [design decision 8](../assistant/design-decision-record.md); greeting [design decision 9](../assistant/design-decision-record.md); realtime after
  microphone [design decision 10](../assistant/design-decision-record.md). Mock: [onboarding.html](../../design/onboarding.html).
- Realtime connection is created **when they turn the voice guide on and the
  microphone is granted**, not on Find mount.

`channel` on `onboarding_sessions` stays (04a writer vs leftover). 04b writer is
still out.

Client interview **data entry** stays the contractor filling fields ([04a](pipeline/04a-text-client-interview.md)).
Agent writer ([04b](pipeline/04b-voice-client-interview.md)) is out.
