# Assistant architectural decision record

Status: decided (2026-08-28). Update an entry (keeping the old decision + date)
instead of silently replacing it.

## Decisions

1. **Two assistants, isolated context** — CMS assistant after website activation
   (guide and doer). Onboarding assistant is a sibling **guide** only. They do
   not share thread, tool registry, or assistant screen context. Onboarding 06
   remains a headless River job that calls website editor tool **functions**,
   not this HTTP. (2026-08-28)

2. **Go is the only tool dispatcher** — Text runs the model in Go
   (`LLMProvider`). Voice audio never hits Go; the browser relays
   `function_call` as typed `POST /v1/assistant/tool-calls`. Same validate /
   events / apply path. No frontend-run loop with ephemeral generation tokens.
   No untyped JSON bucket. (2026-08-28) Same day, later: text chat is
   `GET /v1/assistant/thread/ws` (in-process tools). Voice tool ingress is
   `POST /v1/assistant/voice/tool-calls` (HTTP request and HTTP response). Go
   does **not** upsert unpublished website rows on that POST. (2026-08-28)

3. **Full native `tools=` + allowed-set reject** — Each assistant’s full tool
   registry is passed on every generation / realtime connection (`tools=` on
   text; the same list on voice-service connection create). Do not swap the list
   on assistant screen switch (prompt cache). Do not put tool schemas in
   messages. Allowed set is the execution gate: general (including
   `update_details`) always; plus website editor tools on the website editor;
   plus ads tools on Ads. After `switch_assistant_screen` succeeds, the allowed
   set follows the new screen. Owner clicks during a run do not retarget the
   allowed set. Expanding tool schemas after boot is not v1 and is not for
   voice. (2026-08-28) Same day, later: Ads write tool is `cleanup_image` (media
   library), not ads generate / revise / rewrite. `get_ad` and
   `get_website_styles` are always executable. Allowed-set reject is **409**
   `allowed_set_rejected`. (2026-08-28)

4. **One CMS thread per activated tenant** — Not per assistant screen. Hydrate
   when an overlay assistant screen mounts — not on `/cms`. Clear context starts
   a new thread and drops the voice realtime connection. Compaction after 12
   hours of inactivity summarizes older turns **in place** (thread id stays).
   Distinct from discarding the thread at 24h. (2026-08-28) Same day, later:
   new thread is `POST /v1/assistant/thread/new`; previous `status=completed`
   (not `cleared`). Unique `(tenant_id) WHERE status = 'current'`. (2026-08-28)
   (2026-08-29): Hydrate when they **call** the assistant (bottom-right
   **Assistant**), including `/cms`. Visiting `/cms` without calling does not
   hydrate. Always-visible Assistant hydrate is the old trigger. Same day, later
   (2026-08-29): GET thread lazy-creates empty `current`. Aging is compaction
   only (decisions 11 and 12). `/thread/new` while a run is `running` is 409
   and does not drop Voice (decision 16).

5. **Thread is standalone persistence** — Schema `assistant`. Hydrate, overlay,
   voice→text, and the next text turn read **only** thread rows.
   `ai.ai_generations` is audit only (no FK from thread). Website
   `edit_history.ai_generation_id` stays last-writer on website edits.
   Onboarding conversation tables stay under schema `onboarding`. Shared `ai` is
   `LLMProvider` + traces; features own product rows. (2026-08-28) Same day,
   later (2026-08-30): Thread **identity** moves to `ai.threads`. Every
   `ai_generations` row has a required `thread_id` FK (CMS
   `thread_kind=cms_assistant`, onboarding `thread_kind=onboarding_assistant`,
   headless factories their own enum value). Schema `assistant` keeps
   `thread_items` and `runs` only. Onboarding drops `assistant_conversations`;
   items/runs FK `ai.threads`. Hydrate still reads overlay items only (never
   joins `ai_generations`). No FK from thread items to generations.

6. **Voice is typed HTTP of finals** — No Go WebSocket for audio, VAD, playback,
   or transcript deltas. `POST …/tool-calls` and `POST …/transcripts` append the
   thread as they happen. Voice-service request logs and connection resumption
   are ops, not hydrate. Two realtime-connection routes: CMS
   `POST /v1/voice/realtime-connection` (Clerk JWT); onboarding
   `POST /v1/onboarding/assistant/realtime-connection` (onboarding session
   token). (2026-08-28) Same day, later: CMS voice HTTP is under
   `/v1/assistant/voice/` (`realtime-connection`, `tool-calls`, `transcripts`).
   Onboarding voice HTTP is under `/v1/onboarding/assistant/voice/`. Text is a
   Go WebSocket; audio is not. Do not create
   `POST /v1/voice/realtime-connection`. (2026-08-28) Same day, later: after
   Voice ends, the browser PUTs the recording to object storage via a signed URL
   (`files` row, `runs.recording_file_id`). The recording file never hits Go.
   GET thread does not hydrate or play them. (2026-08-28) Recordings: decision
   13. (2026-08-30) Same day, later: onboarding does **not** store that
   recording (decision 13 later). Live Voice region is the business country
   (decision 23).

7. **Lifecycle gate** — Activated owner (`tenants.status=active` / `/me.tenant`
   non-null) **403** on all onboarding routes, including a leftover onboarding
   session token. Unactivated cannot call `/v1/assistant/…`. (2026-08-28)

8. **One in-flight run per assistant** — Voice and text share that lock (`409`).
   While onboarding 06 is in flight, CMS assistant POSTs stay `409`. Failed /
   usage credit / allowed-set: frontend still writes a failed `tool_result` on
   the voice socket. The in-flight run holds the `ai_generations` id for
   appending audit `tool_calls`; that id is not on thread rows. (2026-08-28)
   Same day, later: drop “06 in flight → CMS 409”. CMS lock is `assistant.runs`
   (voice + text) only. 06 is River `tenant_id`, not this table. CMS is not
   409-blocked for leftover 06. Same website-slot overlap is last-write /
   `edit_history_conflict`. (2026-08-28) Same day, later (2026-08-29): failed
   Voice tool writes `function_call_output`, not `tool_result`. `in_flight_run`
   on `…/voice/tool-calls` is a second start, not the current voice run.

9. **Billing is not auth** — CMS assistant debits billing usage credit (hop ×5).
   Onboarding (including the onboarding assistant) is not billed; still write
   `ai_generations`. Check before a text turn, CMS realtime-connection create,
   and each billed CMS POST mid-call. [Billing](../billing/README.md). (2026-08-28) Same day, later:
   **Voice is not billed as a text LLM call.** xAI Speech to Speech invoices
   **per minute of audio sent or received**, plus a flat fee per text
   `conversation.item.create` (not per token). Same **×5** on that invoice line.
   Nested Go generation from tools still hop ×5 on top. Settle from measured
   audio sent + received (and billed text items) posted on transcripts +
   realtime-connection close — xAI does not document token usage on
   `response.done`. Go never sees PCM. Do not debit wall-clock. Check usage
   credit before CMS realtime-connection create and before each billed LLM or
   image call; drop the CMS realtime connection when usage credit is exhausted.
   Seed instructions, not billed text items, for knowledge / profile. Do not
   enable xAI server-side search / MCP tools. Same day, later: exhausted usage
   credit on billed CMS assistant HTTP is **402** (`usage_credit_exhausted`),
   not 403. Transcripts settlement stays 200. Voice **cost**: decision 14.

10. **Every screen in The CMS can call the assistant** — The owner calls the
    assistant from a bottom-right **Assistant** button on every screen in The
    CMS, including `/cms`. Default channel is **Voice**. Text is a switch on the
    same thread (**Switch to text mode** / Voice in the composer), not a second
    assistant. Closed until they call; do not leave DustOrb or the Assistant
    always on. Hydrate when they call (open **Assistant**). `/cms` is a
    guide-only assistant screen (`cms` in the CMS v1 enum). Connect (ad
    accounts) is still not an assistant screen. Plan / Ask first stay website
    editor only. Do not clone this button onto onboarding (onboarding stays the
    bottom-right voice guide). Not an **AI tools** left-nav item. Look:
    [design decision 11](design-decision-record.md). (2026-08-29) Same day,
    later: the call is bottom-right of the main pane.

11. **Compaction** — River job after 12 hours on `threads.last_activity_at`
    summarizes older thread items **in place** (keep last 3 owner + last 3
    assistant + `tool_summary` / `thinking` in that tail; older → one
    `assistant` summary; same thread `id`; `compacted_through_item_id`
    advances). The **same function** runs if **text** prompt assembly would
    exceed **128K tokens**, or if Voice **instructions** seed would be too large
    to send (do not wait 12h). Not a live-xAI context trim. Compaction prompt
    includes the Voice STT caveat when the thread has a `channel=voice` run. It
    does **not** treat a pending Ask-first reject notice as a special case.
    (2026-08-29) Later (2026-08-30): `last_activity_at` is on `ai.threads`
    (`thread_kind=cms_assistant`). Same day, later (2026-08-31): compaction
    includes the **Voice transcription notice**, not an STT caveat.

12. **No 24h discard** — Aging is compaction only. Do not discard the thread at
    24h on `last_assistant_edit_at`. That column is written when tool events
    persist, not as a discard timer. Compaction does not delete `ai_generations`
    or the voice recording object. (2026-08-29)

13. **Voice recordings** — After Voice ends, the browser PUTs the recording to
    object storage via a signed URL (`files` row, `runs.recording_file_id`). CMS
    `owner_type=assistant_voice`, `owner_id` = that voice `runs.id`. Onboarding
    `owner_type=onboarding_assistant_voice`, `owner_id` =
    `onboarding.assistant_runs.id`. GET thread never returns the URL.
    (2026-08-29) Same day, later (2026-08-30):
    **Onboarding does not store Voice recordings.** Persist committed utterance
    **text** on `assistant_conversation_items`. No `files` row, no
    `recording_file_id`, no `POST /v1/onboarding/assistant/voice/recordings`.
    CMS recordings stay. Online research consent is not this. Same day, later:
    Voice utterances store **`offset_seconds`** (seconds from that Voice run’s
    start). Reconstruct `[m:ss owner]` / `[m:ss assistant]` + `body`. Never say
    **user**. `created_at` is the row insert time. (2026-08-30) Same day, later:
    **`offset_seconds` and utterance `body` come from xAI’s live Voice
    connection**, not a browser audio clock and not a second STT call. Browser
    forwards committed xAI events already emitted on that socket
    (`conversation.item.input_audio_transcription.completed` for owner;
    `response.output_audio_transcript.done` for assistant). Go maps those to
    typed `thread_item_kind` (`owner` / `assistant`) + `body` + `offset_seconds`
    (xAI Voice-connection clock on those events, int seconds) and persists the
    forwarded JSON as `provider_event` jsonb. Reconstruct `[m:ss owner]` /
    `[m:ss assistant]` from those columns — typed; never bake into `body`.
    Never say **user**. There is no `thread_item_kind=system` and no
    `[m:ss system]`.
    xAI instructions / `role=system` stay the Voice-connection seed, not a
    thread item. Persist those exact instructions on the voice run’s
    `ai_generations.input` at realtime-connection create (plus the keyterms /
    `replace` sent on that create) so a conversation can be reconstructed with
    the system prompt. Text turns do the same: `input` is the exact assembled
    prompt sent that turn. Hydrate does not return it. Same day, later:
    **use only xAI Voice events that exist.** xAI documents the event names and
    OpenAI Realtime compatibility. Owner committed text is
    `conversation.item.input_audio_transcription.completed`; map `body` from
    JSON `transcript` when present (OpenAI-compat keys; xAI REST lists the
    event, not a field table). Assistant text is
    `response.output_audio_transcript.done` the same way. Set
    `audio.input.transcription.model` to **`grok-transcribe`** (named on xAI’s
    `.updated` docs; `.updated` is captions only — do not POST it). xAI does
    **not** document `offset_seconds`. Pair owner `.completed` with
    `input_audio_buffer.speech_started` when both JSON objects share `item_id`.
    If the forwarded JSON has `audio_start_ms` (OpenAI Realtime field; xAI lists
    the event, not the payload), store `offset_seconds` as floor(ms/1000). If
    that key is missing, leave `offset_seconds` null — do not invent a browser
    clock. Assistant `.done` has no documented clock; null unless a timing key
    is on that JSON. Do not call `POST /v1/stt` / `wss://…/v1/stt` (separate STT
    API with word timings). If xAI did not emit a committed transcript for that
    utterance, skip the row. Do not transcribe the recording. (2026-08-30)

14. **AI voice vendor cost** — Voice is not billed as a text LLM call. Debit is
    **AI voice vendor cost** (xAI audio minutes + text
    `conversation.item.create` fees). **Our cost** is that invoice;
    **their cost** is ×5. Settle on `POST /v1/assistant/voice/transcripts`
    (usage-only POST on close). Do not say meter. (2026-08-29)

15. **Projects write tools on website editor** — `create_project`,
    `set_project_title`, `set_project_cover`, `patch_project_description`,
    `archive_project`, `unarchive_project` are on the CMS registry; allowed only
    while `assistant_screen` is `website_editor`. The Assistant on Projects
    stays guide. Writing on `/cms/projects/{id}` is **inline AI assistance**.
    `create_project` creates a **project draft**. Ads generate may use projects
    as **context** (TBD when). Not “ads never sees projects.” Do not add those
    write tools to the Ads allowed set. (2026-08-29)

16. **`/thread/new` does not drop Voice** — `POST /v1/assistant/thread/new` does
    not preempt a run. **409** `in_flight_run` while a CMS run is `running`
    (text or Voice). (2026-08-29)

17. **Voice is always Ask first** — No `plan` / `ask_first` / `follow` on Voice
    create. No owner Plan switch. Instant apply is not a Voice path. Text Ask
    first vs Instant apply stays the website-editor switch. (2026-08-29)

18. **Onboarding guide is Voice only** — No text backup. No
    `GET /v1/onboarding/assistant/thread/ws`. Denied microphone stays retry cue.
    `GET /v1/onboarding/assistant/thread` may hydrate for a later Voice turn.
    (2026-08-29)

19. **Ask first keeps the run busy** — While `ask_first_status=pending` the run
    stays `running`. New thread, second text send, second Voice create → 409.
    Same Voice connection may continue. GET thread omits `runs`. (2026-08-29)

20. **Reject is prompt assembly step 6** — Clock is the next **model** turn, not
    last owner request. `record-reject` does not upsert unpublished website
    rows, does not call the LLM, is not 402. It appends a muted thread item
    (edits did not land). Consume once that model turn starts. Not compaction.
    Apply has no parallel notice. (2026-08-29)

21. **CMS Assistant is an agent** — After one owner send or utterance, up to
    **20** tool-using model turns. **Text:** 128K **tokens** assembled context /
    12K **tokens** generation per turn; wrap-up notice when 3 turns remain;
    21st inference `tools=[]`, plaintext summary, run `succeeded`. **Voice:**
    xAI owns the live Voice connection after instructions seed; Go counts the 20
    on `…/voice/tool-calls` and then stops executing tools; no Go 128K/12K on
    that connection. Distinct from onboarding 06’s River cap (3 steps / 12 calls
    / 4 website pages). Not 409. (2026-08-29) Same day, later (2026-08-30):
    owner input is **characters** (text 4000, owner utterance 5000). Text agent
    back and forth is **tokens** (128K context / 12K generation). Do not use
    5000 characters as the agent output cap. Voice still has no Go token cap.

22. **Voice → text STT caveat** — First CMS text assembly after a completed
    `channel=voice` run injects a typed notice: those owner lines were
    speech-to-text and may contain transcription issues; do not always take them
    literally. Model-only. Not a column. Not onboarding. Compaction of a thread
    that has a voice run uses the same caveat. (2026-08-29) Same day, later
    (2026-08-31): this is the **Voice transcription notice**. Same inject
    rules. Do not say caveat.

23. **xAI Voice follows the business country** — Live audio (CMS and onboarding)
    does **not** blanket-route every tenant to eu-west-1. Region comes from the
    **business country** at realtime-connection create: company registry
    country if attached; else Google Maps listing address country; else Find
    country on `tenants.country` (`ie` / `gb` / `us`). Map `ie`/`gb` →
    **eu-west-1**, `us` → **us-east-1**. Not the contractor’s IP. Hosts:
    [voice agent](../../general-architecture/voice-agent.md). (2026-08-30)
    Same day, later: **public Speech to Speech is documented as cluster
    us-east-1** (`wss://api.x.ai/v1/realtime`,
    `https://api.x.ai/v1/realtime/client_secrets`). Do not invent
    `eu-west-1.api.x.ai` / `us-east-1.api.x.ai` Voice hosts. When xAI
    documents an EU Voice host, map `ie`/`gb` there. Until then the create
    response returns that documented realtime URL. Same day, later:
    **`{region}.api.x.ai` hosts are real.** status.x.ai lists
    `eu-west-1.api.x.ai` / `us-east-1.api.x.ai`. xAI mTLS docs refer to
    regional endpoints. `grok-voice-think-fast-2.0` is listed in us-east-1,
    eu-west-1, and us-saltlake-2. Restore the map: `ie`/`gb` → **eu-west-1**,
    `us` → **us-east-1**. Return `wss://{region}.api.x.ai/v1/realtime` and
    create the secret on
    `https://{region}.api.x.ai/v1/realtime/client_secrets`. Global `api.x.ai`
    auto-routes; Speech to Speech examples use it. Pin the regional host for
    live Voice. (2026-08-30)

24. **Glossary is in both assistants; Voice also gets pronunciation** — CMS
    text, CMS Voice, and the onboarding voice guide all include the product
    glossary in knowledge (Domain + Enums + Don't say; not Internal, not Why).
    Voice connection create also sets xAI `audio.input.transcription.keyterms`
    (STT bias) and `replace` (spoken wording; transcript text unchanged).
    **Placis** is a keyterm; `replace` speaks it **Play-sis**. Do not
    `session.update` those mid-call. (2026-08-30) Same day, later: set
    `audio.input.transcription.model` to **`grok-transcribe`**. xAI documents
    `instructions`, `keyterms`, and `replace` on `session.update`. Bind them
    on `POST /v1/realtime/client_secrets` when that request accepts an
    initial-configuration object; otherwise the browser sends **one**
    `session.update` after the Voice connection opens with the instructions
    Go already stored. Not a second configure mid-call.

25. **Three Assistant implementations, one contractor name** — CMS
    `/v1/assistant/…` after website activation. Find, Review, and client
    interview `/v1/onboarding/assistant/…` (Voice only, `tools=[]`). Onboarding
    website editor `/v1/onboarding/website/assistant/…` on
    `/onboarding/preview-and-edit/` only (policy wrapper in
    `internal/onboarding/websiteeditor`). Contractor copy is **Assistant** on
    all three. Do not relax unactivated **403** `tenant_unactivated` on
    `/v1/assistant/…`. Do not add `/v1/website/editor/assistant`. CMS HTTP must
    not import `onboarding/websiteeditor`. (2026-08-30)

26. **Onboarding website editor reuses `ai.threads`
    (`thread_kind=cms_assistant`)** — Same overlay `thread_items` / `runs`. No
    `website_editor_*` tables. OpenAPI grows paths, not persistence models.
    Unpaid `current` while `tenants.status=unactivated`. **No compaction** on
    that `current` (12h, 128K overflow, or Voice compact-before-seed would drop
    `thread_item_kind=owner` items and refill the five unpaid prompts). If text
    assembly would exceed 128K or Voice instructions would not fit, that turn /
    Voice create fails. 09 completes `current` and ends `running` in the
    **same transaction** as `status=active`. CMS GET lazy-creates a new empty
    `current`. Five unpaid prompts = count `thread_item_kind=owner` items on
    that unpaid `current` (06 does not write owner items). Over cap is pay CTA,
    not 402. 06 LLM traces stay on a `website_copy_generation` thread.
    (2026-08-30)

27. **06 is the first unpaid website-preview run** — While unactivated, 06 holds
    `assistant.runs` `running` (`channel=text`) and appends `tool_summary`.
    The website preview follows 06 via onboarding SSE + unpublished GET, not the
    Assistant text socket. Owner send is **409** `in_flight_run` until 06 is
    idle. After 09, leftover 06 is River-only (`tenant_id` lock, no
    `assistant.runs`, no new thread items). CMS Assistant / PATCH stay not 409
    because 06 is running (testing §15). 06 cap stays 3 / 12 / 4. 06 still must
    not `create_page`. (2026-08-30)

28. **Unpaid instant apply via website PATCH** — Text and Voice on the
    onboarding website editor force instant apply (ignore `ask_first` / `plan`
    on the wire). Exception to decision 17 (Voice always Ask first is CMS).
    No `record-apply` / `record-reject` / `/thread/new` on this tree. Go does
    not upsert unpublished rows on that turn. Signed-in unactivated **PATCH**
    on the app origin is the apply path (not a human-vs-Assistant 403).
    Onboarding session token may GET unpublished website and GET `…/thread`
    (hydrate only). It must not PATCH and must not send. The preview website
    address never calls this agent or PATCH.
    Voice → text STT caveat (decision 22) **does** apply here; “not onboarding”
    there means Find / Review. Recordings use `assistant_voice` on
    `assistant.runs`. (2026-08-30)

29. **Wait teaser lands on the website preview** — `/onboarding/preview` then
    `/onboarding/preview-and-edit/`, not `{website_prefix}.preview.placis.com`.
    Share is optional on-demand 08 (R2 + strip). 09 does **not** require a
    prior share: if they never shared, 09 reserves the prefix if needed and
    writes the first live R2 without strip. Apex `preview.placis.com` is not a
    tenant site (404). (2026-08-30)
