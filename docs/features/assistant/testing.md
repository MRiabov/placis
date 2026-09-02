# Assistant testing

One full-stack E2E per story below. DB asserts. External/paid services mocked;
Go, Postgres, and `frontend-2` are not mocked. Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).
DTOs and Routes: [api.md](api.md). Tables: [persistence.md](persistence.md).

Named idle constant: **30 seconds** with no owner speech → frontend stops the
voice conversation (CMS and onboarding). Assert that constant. 20s warning look
TBD (do not assert UI). Go does not enforce idle.

Named agent-loop constants: **20** tool-using model turns after one owner send
or utterance (text and Voice). **Owner input is characters** (text **4000**,
owner utterance **5000**). **Text:** **128K tokens** assembled context,
**12K tokens** generation per turn (agent back and forth — not a 5000-character
cap). Assert those constants. Wrap-up notice on
**text** turns 18–20. **21st text** inference has empty `tools=` and a plaintext
summary (not 409). Voice after 20 tool rounds does not execute more tools.

## CMS

1. **Hydrate** — `GetAssistantThread` on website editor / Ads / Details / `/cms`
   (bottom-right **Assistant**). Response `AssistantThreadRead` (`items`, not
   `thread_items`). **reads** `ai.threads` / `thread_items`. No `current` →
   **persists into** `ai.threads` empty `current`. Empty is `items: []`.
   Visiting `/cms` without calling does not hydrate. Hydrate omits `runs` and
   does not join `ai_generations`. Voice create still wrote the instructions on
   `ai_generations.input` (reconstructable; not in GET).
2. **Assistant screen switch** — Owner moves website editor → Details during
   speech; speech continues; next `AssistantOwnerMessage` carries one switch
   notification for Details.
3. **`switch_assistant_screen`** — Tool opens Ads; allowed set then includes Ads
   `cleanup_image`.
4. **`get_context_about_screen`** — Returns Ads assistant screen context without
   navigating and without authorizing ads writes while still on the website
   editor.
5. **Wrong-screen reject** — `update_slot` while on Ads is **409**
   `allowed_set_rejected`; failed `function_call_output` still reaches the
   voice-service socket when Voice is on. Distinct from `in_flight_run`.
6. **`get_ad` off Ads** — Unknown / other-tenant id is **404**, not screen-gate
   409.
7. **Voice relay + transcripts** — `function_call` on the voice-service WS →
   Request `AssistantVoiceToolCallsCreate`; Response
   `AssistantVoiceToolEventRead` → browser writes `function_call_output` on
   that same voice-service WS; **persists into** `thread_items`
   (`tool_summary`). Request `AssistantVoiceTranscriptsCreate` **persists
   into** `thread_items` (`provider_event` jsonb; GET omits it). Map
   `AssistantVoiceOwnerTranscriptEvent` /
   `AssistantVoiceAssistantTranscriptEvent`. `offset_seconds` from
   `audio_start_ms` on paired `AssistantVoiceSpeechStartedEvent` when that key
   exists; else null. Reconstruct `[m:ss owner]` / `[m:ss assistant]`.
   Never say **user**.
   No `POST /v1/stt`. If a committed transcript was omitted, no row.
   `ai_generations` has a voice row on that `cms_assistant` thread. Hydrate
   does not read that table. Tool-calls during the **current** voice run
   succeed (`in_flight_run` is a second start). Request
   `AssistantVoiceRealtimeConnectionCreate`; Response
   `AssistantVoiceRealtimeConnectionRead`. Realtime URL host is **eu-west-1**
   for Find `ie`/`gb` and **us-east-1** for Find `us`
   (`wss://{region}.api.x.ai/v1/realtime`), not a frontend-chosen host.
   Connection create includes **`grok-transcribe`**, **Placis** in keyterms, and
   `replace` **Play-sis**.
8. **Voice → text** — After a tool-using voice turn, expanded thread shows
   transcripts **and** muted tool lines. Next `AssistantOwnerMessage` on
   `GET /v1/assistant/thread/ws` (`StreamAssistantThread`) continues from those
   `thread_items`. First text send after Voice includes the Voice transcription
   notice; second text send does not; Voice then text includes it again.
9. **Ask first** — Instant apply never writes `runs.ask_first_status=pending`.
   `RecordAssistantApply` / `RecordAssistantReject` **409**
   `ask_first_not_pending` unless `pending`. Second transition 409. Those POSTs
   do not upsert unpublished website rows. Reject **persists into**
   `thread_items` (muted item) and `runs`. While `pending`, the run stays
   `running`: New thread, second text send, and second Voice create are **409**.
   Same Voice connection may continue.
10. **`/thread/new`** — `CreateAssistantThread` **persists into** `ai.threads`
    (previous `status=completed`, insert `current`). Response
    `AssistantThreadRead` (`items: []`). Two racing POSTs: second **409**
    `thread_current_exists`. In-flight run **409** `in_flight_run`.
    `/thread/new` while Voice is on → 409 (does not drop Voice).
11. **Insufficient usage credit** — CMS text send / realtime-connection create
    is **402** (`usage_credit_exhausted`) when usage credit is exhausted. Voice
    minutes debit from `AssistantVoiceUsage` on transcripts (and connection
    close), not from `POST /v1/assistant/voice/tool-calls`. A tool that is
    itself a billed LLM or image call is **402** when usage credit is
    exhausted; failed `function_call_output` still reaches the voice-service
    socket. Exhausted usage credit drops the CMS realtime connection.
    Transcripts settlement stays `200`.
12. **Unactivated** — **403** `tenant_unactivated` on `/v1/assistant/…`. Unpaid
    website preview is `/v1/onboarding/website/assistant/…`.
13. **Voice idle** — After 30s with no owner speech, frontend closes (leftover
    transcripts with `offset_seconds` from Voice events + `AssistantVoiceUsage`;
    CMS recording upload (signed URL); realtime connection dropped). Onboarding
    idle skips the recording PUT.
14. **Voice recording** — After **CMS** Voice turns off, Request
    `AssistantVoiceRecordingCreate`; Response `AssistantVoiceRecordingRead`.
    **persists into** `files`; complete **persists into**
    `runs.recording_file_id`. GET thread does not return the URL. The recording
    file is never posted to Go. Onboarding has no recording object.
15. **06 overlap** — Activate (09) while 06 is still writing a website slot; CMS
    PATCH of that website slot is last-write / `edit_history_conflict`, not
    assistant `in_flight_run`. CMS assistant POSTs are not 409 because 06 is
    running. 09 completed unpaid `current` and ended `running` in the same
    transaction as `status=active`; CMS GET is a new empty `current`.
16. **Denied microphone** — Shared **notification** **Allow microphone access
    in your browser to talk. You can keep typing.** **Try again** retries
    getUserMedia; **Switch to text mode** opens the composer. Assistant is not
    restored until Switch to text mode. `POST …/realtime-connection` was not
    called.
17. **Greeting once** — First Voice start plays the prerecorded greeting.
    Start Voice again more than 5s after that greeting began: DustOrb on, no
    second greeting.
18. **Projects write tools** — `create_project` on `website_editor` leaves a
    **project draft**. Those tools on Ads (or on Projects) are **409**
    `allowed_set_rejected`.
19. **Follow** — `follow: false` on the text socket is **400**. Voice create
    has no `plan` / `ask_first` / `follow`; the run is Ask first.
20. **128K overflow compact** — `CompactAssistantThread` in-place then assemble
    again (same rules as the 12h job). Voice **create** seed-too-large
    compact-then-seed. **persists into** `thread_items`. Not a live Voice
    connection trim.

## Onboarding

1. **Guide hydrate** — Bottom-right DustOrb visible, voice off, cue
   **Click to turn on voice**. Conversation is onboarding-session-scoped.
   `GET /v1/onboarding/assistant/thread` returns that thread (`items: []` until
   the first utterance). Denied mic stays retry cue (no Switch to text).
2. **Turn on** — Click DustOrb: cue gone, prerecorded intro, microphone granted,
   then realtime connection created
   (`POST /v1/onboarding/assistant/voice/realtime-connection`, not on Find
   mount). Close → **Enable voice guide**. Hidden on wait teaser. Turn on
   again more than 5s after that intro began: no second intro. In-flight 409 on
   a second realtime-connection create. Realtime URL host is **eu-west-1** for
   Find `ie`/`gb` and **us-east-1** for Find `us`
   (`wss://{region}.api.x.ai/v1/realtime`). Connection create
   includes **`grok-transcribe`**, **Placis** in keyterms, and `replace`
   **Play-sis**.
3. **No write tools** — Profile is unchanged after a guide turn. `tools=[]`.
4. **No text backup** — There is no `GET /v1/onboarding/assistant/thread/ws`.
   After voice utterances, `GET` hydrate may return items for a later Voice
   turn (`offset_seconds` from xAI events). No `POST /v1/stt`.
5. **No `/thread/new`** — That route does not exist on onboarding.
6. **403 after website activation** — Activated owner cannot call
   `/v1/onboarding/assistant/…` or
   `/v1/onboarding/website/…` (or leftover onboarding session
   routes).
7. **Voice idle** — Same 30s frontend stop as CMS. Not billed (no 402). Leftover
   transcripts (committed xAI events → `offset_seconds`) posted; **no**
   recording upload (onboarding does not store Voice recordings).
8. **Denied microphone** — Cue **Allow microphone access in your browser**.
   Click DustOrb retries. Voice does not stay on. `POST …/realtime-connection`
   was not called.

   DB (this story; what Persist names):
   `onboarding.assistant_conversation_items`, `onboarding.assistant_runs`,
   `ai.threads` (`thread_kind=onboarding_assistant`, unique per
   `onboarding_session_id`). Voice/LLM faked; Go + Postgres + `frontend-2` not
   mocked.

## Onboarding website editor

One E2E. [website-editor.md](../onboarding/website-editor.md).

1. **Wait → website preview → prompt → pay** — Wait teaser `/onboarding/preview`
   then
   `/onboarding/preview-and-edit/`. Unsigned land hydrates `GET …/thread`
   (onboarding session token) and shows 06 `tool_summary` while copy is still
   running. Sign up.
   One signed-in owner prompt after 06 idle. Canvas updates via website-editor
   PATCH (instant apply). Pay (09). `/cms/website` shows the unpublished change.
   CMS `GET /v1/assistant/thread` is a new empty `current` (unpaid thread
   completed). `/v1/assistant/…` was 403 `tenant_unactivated` before pay. Sixth
   unpaid prompt is out of this story (pay CTA, not 402).
