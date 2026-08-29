# Assistant testing

One full-stack E2E per story below. DB asserts. External/paid services mocked;
Go, Postgres, and `frontend-2` are not mocked.

Named idle constant: **30 seconds** with no owner speech → frontend stops the
voice conversation (CMS and onboarding). Assert that constant. 20s warning look
TBD (do not assert UI). Go does not enforce idle.

## CMS

1. **Hydrate** — Calling the assistant (bottom-right **Assistant**) on website
   editor / Ads / Details / `/cms` returns the current thread (`items`, not
   `thread_items`). Empty is `items: []`. Visiting `/cms` without calling does
   not hydrate. Hydrate does not return `runs` and does not join
   `ai_generations`.
2. **Assistant screen switch** — Owner moves website editor → Details during
   speech; speech continues; next owner turn carries one switch notification for
   Details.
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
   `POST /v1/assistant/voice/tool-calls` (HTTP events) → browser writes
   `function_call_output` on that same voice-service WS; muted `tool_summary`
   item appended. `POST /v1/assistant/voice/transcripts` appends owner +
   assistant text. `ai_generations` has a voice row with `thread_id`. Hydrate
   does not read that table.
8. **Voice → text** — After a tool-using voice turn, expanded thread shows
   transcripts **and** muted tool lines. Next owner send on
   `GET /v1/assistant/thread/ws` continues from those thread items.
9. **Ask first** — Instant apply never writes `runs.ask_first_status=pending`.
   `record-apply` / `record-reject` **409** `ask_first_not_pending` unless
   `pending`. Second transition 409. Go does not upsert unpublished rows on
   those POSTs.
10. **`/thread/new`** — Completes previous (`status=completed`), inserts
    `current`. Two racing POSTs: second **409** `thread_current_exists`.
    In-flight run **409** `in_flight_run`.
11. **Insufficient usage credit** — CMS text send / realtime-connection create
    is **402** (`usage_credit_exhausted`) when usage credit is exhausted. Voice
    minutes debit from posted usage (transcripts + connection close), not from
    `POST /v1/assistant/voice/tool-calls`. A tool that is itself a billed LLM or
    image call is **402** when usage credit is exhausted; failed
    `function_call_output` still reaches the voice-service socket. Exhausted
    usage credit drops the CMS realtime connection. Transcripts settlement stays
    `200`.
12. **Unactivated** — **403** `tenant_unactivated` on `/v1/assistant/…`.
13. **Voice idle** — After 30s with no owner speech, frontend closes (leftover
    transcripts + usage posted; recording upload (signed URL); realtime
    connection dropped).
14. **Voice recording** — After Voice turns off, `files` row + object in
    storage; `runs.recording_file_id` set. GET thread does not return the URL.
    The recording file is never posted to Go.
15. **06 overlap** — Activate (08) while 06 is still writing a website slot; CMS
    PATCH of that website slot is last-write / `edit_history_conflict`, not
    assistant `in_flight_run`. CMS assistant POSTs are not 409 because 06 is
    running.
16. **Denied microphone** — Shared **notification** **Allow microphone access
    in your browser to talk. You can keep typing.** **Try again** retries
    getUserMedia; **Switch to text mode** restores the chatbot. Overlay is not
    restored until Switch to text mode. `POST …/realtime-connection` was not
    called.
17. **Greeting once** — First Voice start plays the prerecorded greeting.
    Start Voice again more than 5s after that greeting began: orb on, no second
    greeting.

## Onboarding

1. **Guide hydrate** — Bottom-right DustOrb visible, voice off, cue
   **Click to turn on voice**. Conversation is onboarding-session-scoped.
   `GET /v1/onboarding/assistant/thread` returns that thread (`items: []` until
   the first utterance).
2. **Turn on** — Click orb: cue gone, prerecorded intro, microphone granted,
   then realtime connection created
   (`POST /v1/onboarding/assistant/voice/realtime-connection`, not on Find
   mount). Close → **Enable voice guide**. Hidden on wait teaser. Turn on
   again more than 5s after that intro began: no second intro.
3. **No write tools** — Profile is unchanged after a guide turn. `tools=[]`.
4. **Voice → text backup** — After voice utterances, `GET` hydrate then
   `GET /v1/onboarding/assistant/thread/ws` continues the same conversation.
   Text-backup look TBD (do not assert the launcher look).
5. **No `/thread/new`** — That route does not exist on onboarding.
6. **403 after website activation** — Activated owner cannot call
   `/v1/onboarding/assistant/…` (or leftover onboarding session routes).
7. **Voice idle** — Same 30s frontend stop as CMS. Not billed (no 402).
   Recording upload (signed URL) same as CMS (unactivated `tenant_id` on
   `files`).
8. **Denied microphone** — Cue **Allow microphone access in your browser**.
   Click orb retries. Voice does not stay on. `POST …/realtime-connection` was
   not called. Text-backup look TBD.
