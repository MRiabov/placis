# Assistant architecture

Logic: what is in context, how tools are allowed, how text and voice share one
dispatcher, when rows are written, which HTTP error maps to which gate. Named
identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).
Tables: [persistence.md](persistence.md). HTTP contract: [api.md](api.md).
Assistant look: [design decision record](design-decision-record.md).

Those two files are the contract (fields, errors, columns, indexes). This
file is how the system behaves. Do not retell this file in api or persistence.

## Named identifiers

HTTP (same spelling in spec, Go, and tests):

- `GetAssistantThread` — `GET /v1/assistant/thread`
- `CreateAssistantThread` — `POST /v1/assistant/thread/new`
- `RecordAssistantApply` — `POST /v1/assistant/record-apply`
- `RecordAssistantReject` — `POST /v1/assistant/record-reject`
- `CreateAssistantVoiceRealtimeConnection` —
  `POST /v1/assistant/voice/realtime-connection`
- `CreateAssistantVoiceToolCalls` — `POST /v1/assistant/voice/tool-calls`
- `CreateAssistantVoiceTranscripts` — `POST /v1/assistant/voice/transcripts`
- `CreateAssistantVoiceRecording` — `POST /v1/assistant/voice/recordings`
- `CompleteAssistantVoiceRecording` —
  `POST /v1/assistant/voice/recordings/{id}/complete`

Text WebSocket + in-process agent loop: `StreamAssistantThread`
(`GET /v1/assistant/thread/ws`). Job / in-process compact:
`CompactAssistantThread` ([jobs](../../general-architecture/jobs.md)). DTOs
and Routes: [api.md](api.md).

## Always in context

- Live business profile. Details is not a third registry: `update_details` is
  always allowed.
- Product knowledge: owner-facing markdown compiled into the Go binary. Not RAG.
  Not feature `docs/`. Not `internal/ai` (that package is `LLMProvider` +
  threads + traces). **Exception:** both registries list the product glossary
  (Domain + Enums + Don't say from [glossary](../../glossary.md); not Internal, not Why) so CMS
  text, CMS Voice, and the onboarding voice guide use the same words.

Two knowledge bases, two YAML registries (they do not share `prompts.yaml`):

- CMS: `internal/assistant/knowledge/cms_knowledge_base_registry.yaml` plus
  listed markdown. `go:embed` by `internal/assistant`.
- Onboarding:
  `internal/onboarding/assistant/knowledge/onboarding_knowledge_base_registry.yaml`.
  Onboarding must not import `internal/assistant`.

Both list the **same** product-glossary file (Domain + Enums + Don't say). That
file lives outside `internal/assistant` so onboarding does not import it
(`internal/knowledge/product_glossary.md`, compiled from those glossary
sections). Voice also loads `internal/knowledge/voice_pronunciation.yaml`
(keyterms + `replace`) at connection create — not into text `LLMProvider`
prompts.

YAML fields: `id` (`assistant.knowledge` / `onboarding.assistant.knowledge`),
`format_revision`, ordered `files`. Concatenate
**only listed files, in YAML order**, into the text-turn system prompt and the
voice connection instructions (same text). A missing listed file fails boot.
Record `knowledge_id` + `knowledge_format_revision` on `ai_generations`. YAML +
markdown land with the Go implementation; this feature specifies the contract.

CMS Assistant prompt text (wrap-up notice, reject notice, Voice transcription
notice, compaction, Voice seed prompt) lives in this feature’s `prompts.yaml`
with `{{var}}` / `{{aaa.bbb}}` slots, not in Go. [LLM layer](../../general-architecture/llm-layer.md).

Keep it small enough to inject every turn. `get_context_about_screen` is live
assistant screen context, not this copy.

## Agent loop

The Assistant is an **agent**, not a one-shot completion. After one owner text
send or one owner utterance, the model may call tools, observe results, and
continue.

Named constants (assert in [testing](testing.md), same pattern as 30s Voice
idle):

- **20** tool-using **model turns** after that one owner send / utterance.
- **One model turn** = one model inference (one text `LLMProvider` call, or one
  Voice-model response). Parallel tools in that inference are still one turn.
  Tool results then another inference = turn 2.
- **Owner input is characters:** text `owner_message.body` **4000**; owner Voice
  utterance **5000**.
- **Text agent back and forth is tokens:** **128K** assembled context (Go
  `LLMProvider` prompt); **12K** generation per model turn (assistant copy,
  thinking, tool `summary`). Do not put a 5000-character cap on those as
  generation.
- **Voice:** no Go 128K / 12K on the live Voice connection. Owner utterance
  stays **5000 characters**. Do not treat a character cap as Voice generation.

**Text wrap-up:** when **3** tool-using turns remain (turns 18–20 of 20), inject
a wrap-up notice in prompt assembly — turns are running out, finish work.
**21st text inference:** `tools=[]`, plaintext owner summary (what landed / what
is still Ask-first pending). Then the run ends (`succeeded`). Not **409**. Not a
tool-call. Pending Ask-first tools already `planned` stay pending (Apply /
Reject still work). Instant-apply tools already copied out stay copied out.

**Voice:** the rolling Voice connection is **xAI-owned** after we seed
connection **instructions**. Go counts the 20 on `POST …/voice/tool-calls`.
After 20, Go does not execute more tools (return `function_call_output` that the
budget is done; xAI may still speak). Do **not** rewrite xAI `tools=` /
instructions mid-call. Do **not** inject wrap-up via billed
`conversation.item.create`. No Go 128K / 12K on the live Voice connection.

Onboarding Voice guide: `tools=[]`, so the 20-count is idle. No Go 128K / 12K on
that connection. Onboarding 06 is River job kind `website_copy_generation`
with its own cap (**3 steps / 12
calls / 4 website pages**) — not this 20.

`in_flight_run` locks the **whole** agent run (all those turns), not one
inference.

## Prompt assembly order

Each **CMS text** `LLMProvider` turn concatenates in this order (do not
reorder):

1. Knowledge base (listed files, YAML order)
2. Live business profile
3. Thread items (this thread; compacted tail is one `assistant` summary + last
   3 owner + last 3 assistant items)
4. Current assistant screen context (typed struct)
5. Assistant screen switch notification when the screen changed since the last
   **owner** request
6. Typed Ask-first **reject notice** when a muted reject thread item is pending
   (clock: this **model** turn, not last owner request). Consume once this turn
   starts; do not re-inject. Apply has no parallel notice.
7. **Voice transcription notice** when the most recent completed run on this
   thread is `channel=voice` (**Switch to text mode** / idle / close, then this
   first text send). Owner lines so far were speech-to-text and may contain
   transcription issues; do not always take them literally; this
   `owner_message` (and later typed sends) are typed. Model-only (like step 5),
   not a hydrate item, not billed `conversation.item.create`. After this text
   run completes, the latest run is `channel=text` — do not re-inject on the
   second text send. A later Voice run then text injects again. Not Voice seed.

Plus wrap-up when 3 tool-using turns remain (text only).

Each **CMS voice-connection seed** concatenates **instructions** in this order
(one instructions string, not billed `conversation.item.create`, not a
`thread_item_kind=system` thread item):

1. Knowledge base (includes the product glossary)
2. Live business profile
3. Thread items (compacted tail, same keep-last-3 rule). Voice items in that
   tail are formatted `[m:ss owner]` / `[m:ss assistant]` from typed
   `thread_item_kind` + `offset_seconds` when set (`audio_start_ms` on paired
   `speech_started`), then `body`. Text items have no offset prefix.
4. Current assistant screen context (typed struct)
5. Assistant screen switch notification when the screen changed since the last
   **owner** request

Do **not** put step 6 (reject) or step 7 (STT) on Voice seed. Reject is not
compaction and not voice-connection seed. xAI already heard audio.

Onboarding seed is current step + visible fields + product glossary.
`tools=[]`. No canvas. No step 7 (no text backup). Conversation tail uses the
same `[m:ss owner]` / `[m:ss assistant]` format.

**128K overflow (text assembly only).** If the assembled prompt would exceed
**128K tokens**, compact in place with the **same rules as the 12h River job**,
then assemble again. Not random token trim. The frontend cannot 400 this. If
knowledge + profile + working copy + tail is still over 128K, that **text** turn
fails (WS terminal `error`). Compaction prompt does **not** treat a pending
reject notice as a special case (reject is a thread item and may sit in the kept
tail). Compaction **does** include the Voice transcription notice when the
thread has a `channel=voice` run.

**Voice seed too large.** If instructions would be too large to send, compact
the thread first with those same rules, then seed. If still too large, **Voice
create** fails (not a mid-utterance compact). Same function as text overflow.

After seed, utterances, tool args, and `function_call_output` live in the xAI
Voice connection. Compacting Postgres mid-call does **not** shrink that
connection. xAI’s 120-minute connection cap stays theirs.

## Assistant screen context

Frontend reports the current assistant screen. **CMS v1 closed enum:**
`cms` | `website_editor` | `ads` | `details` | `projects` |
`certifications_and_reviews` | `media_library` | `billing`.
`cms` is `/cms` (two cards), guide-only. Connect (ad accounts) is **not** an
assistant screen.

Write tools: website editor (including projects **write** tools) + Ads
`cleanup_image`. `update_details` is always allowed. Other enum values are
guide. The Assistant **on Projects** is guide-only; `/cms/projects/{id}` writing
is **inline AI assistance**. Cover is pick-only (no generate).

A **website page** change inside the website editor is not an assistant screen
switch (still `website_editor`). The next owner turn carries an updated
unpublished website working copy.

Same assistant screen as last **owner** request: no extra notice. An
**assistant screen switch** is relative to the last owner request, not to clicks
during the current run. Inject an assistant screen switch notification plus that
screen’s assistant screen context (typed per screen, not unconstrained JSON).
Website editor working copy from the frontend (local-first projection). Ads from
Go.
Details: notification only — profile is already loaded.

Do not interrupt an in-flight run. Owner clicks Ads → website editor → Details
while the assistant is still speaking: speech continues; intermediate screens
are discarded; the run keeps the assistant screen context and allowed set it
started with. Agent `switch_assistant_screen` navigates and then follows the new
screen’s allowed set for the rest of that run.

The model is told on the **next owner turn** (next spoken utterance or next text
send), not when the current answer finishes. Do not inject a silent
voice-service item at end of speech. Do not load two assistant screen contexts
by default.

`get_context_about_screen(screen)` returns a **small** struct per enum value. It
does not navigate and does not authorize that screen’s write tools.

- **Ads:** `id`, title, status, `updated_at` (pointer list, not fat ads rows).
- **Website editor:** working copy is already on the turn / voice create; do
  not dump the whole unpublished website again.
- **Details:** notification only.
- **`cms` and other guide screens:** no write context.

`get_ad(ad_id)` is a separate fat read. It is **not** screen-gated (the model
does not know ad ids unless the ads list or this peek gave them). Unknown /
other-tenant id is **404**. `get_website_styles` has no id — tenant website
styles; always allowed. Do not stuff `get_website_styles` into peek.

`switch_assistant_screen(screen)` asks the frontend to open that screen (same
notification + context as left-nav). Do not name the tool
`switch_user_facing_screen`. Optional `open_ad` / `open_website_page` navigate;
they are not a substitute for ids.

**Follow** is always on. Canvas jumps to the website slot or field the agent is
looking at. Owner cannot turn it off. Not a WS / HTTP request field. A request
with `follow: false` → plain **400**.

## Tool registry vs allowed set

**Full CMS `tools=` always loaded.** Every text turn and
`POST /v1/assistant/voice/realtime-connection` gets the entire CMS registry.
Do not swap the list on assistant screen switch. **Always executable** is the
subset Go will run on any screen, not “the only tools the model sees.”

**Always executable:** `update_details`, `switch_assistant_screen`,
`get_context_about_screen`, `get_ad` (404 unknown id), `get_website_styles`.

**Allowed only with that screen loaded** (else **409** `allowed_set_rejected`):

- Website editor write tools (`update_slot`, `update_reviews`, `update_seo`,
  `update_form`, `update_website_styles`, `set_section_visibility`,
  `update_section_design`, `reorder_sections`, `create_section`, `create_page`,
  `update_menus`, `generate_image`, `cleanup_image` on the website editor, and
  the six projects **write** tools: `create_project`, `set_project_title`,
  `set_project_cover`, `patch_project_description`, `archive_project`,
  `unarchive_project`). Off `website_editor` those projects tools are 409
  (including when the Assistant is on Projects).
- Ads: `cleanup_image` only (same media-library function as Review cleanup /
  website editor). Then PATCH that placement on the existing ads caller path.

**Not CMS assistant tools:** ads generate / revise / rewrite (stay Ads UI:
Create ad and generate, Revise, Review **inline AI assistance**). No wrap of ads
HTTP. `generate_image` stays website-editor unless a later pass says otherwise.
Ads generate may use projects as **context** (ads already read the live
`projects` table, including project drafts). When an ad is generated “from” a
project is **TBD**. Do not add projects **write** tools to the Ads allowed set.

`create_project` / first click-off creates a **project draft**.
That id is not in the next website publication bake until **Approve**.

**No union-of-objects tool args.** Models pick the wrong `oneOf` branch. One
action per name (same as website editor tools). OpenAPI `oneOf` on HTTP / text
WebSocket **events** is fine. Do not put destination unions or `extra: str` on
`tools=`. Prefer `get_ad(ad_id)` over `get_context({ screen, extra })`.

**Onboarding `tools=[]` this pass.** Seed carries current step + visible fields.
No `obtained_information` / `end_interview`. Onboarding tools never appear in
the CMS `tools=` array. Client-interview writer tools are not in either
assistant’s registry.

**Principle:** every agent edit is Ctrl+Z’able. Website already: in-memory then
PATCH. Ads agent `cleanup_image` is Ctrl+Z’able. Do not invent undo for ordinary
ads owner PATCH.

## Text vs voice

Go is the only dispatcher. Audio never hits Go.

The text WebSocket is **only** the streaming chat pipe. Do not put hydrate,
`/thread/new`, `/tool-calls`, `/transcripts`, `/recordings`, `/record-apply`,
`/record-reject`, or `/realtime-connection` on that socket.

| Path | Model | Tool ingress | Apply |
| --- | --- | --- | --- |
| Text | Go `LLMProvider` on `GET /v1/assistant/thread/ws` | In-process from that socket (text does **not** call `POST /v1/assistant/voice/tool-calls`) | Frontend in-memory + ordinary website PATCH / `/menus`; `record-apply` / `record-reject` are activity metadata only |
| Voice | Voice service | (1) voice service `function_call` on **its** WS → browser; (2) browser `POST /v1/assistant/voice/tool-calls`, waits for HTTP events; (3) browser writes `function_call_output` on the **same voice-service WS** | Same frontend path. Go does **not** upsert unpublished website rows on tool-calls. |

Voice HTTP is under `/v1/assistant/voice/` (`realtime-connection`, `tool-calls`,
`transcripts`). Voice create includes the unpublished website working copy when
`assistant_screen` is `website_editor`. Other screens omit that working copy.
`POST …/voice/tool-calls` still sends working copy when those tools run (canvas
may have changed). Seed **instructions** (knowledge + profile + screen /
compacted thread tail). Do not replay the thread as billed
`conversation.item.create` items. Pin a dated xAI voice model id (not
`grok-voice-latest`). Live Voice uses the xAI region for the **business
country** ([voice agent](../../general-architecture/voice-agent.md)):
`wss://{region}.api.x.ai/v1/realtime`. Set **`grok-transcribe`**, **keyterms**,
and **`replace`** on create / one opening `session.update` (not mid-call).

Voice create has **no** `plan` / `ask_first` / `follow`. Voice is always **Ask
first** in the run row. Instant apply is not a Voice path. No owner Plan switch
on Voice. The agent may confirm ambiguous changes in conversation, then apply —
informal, not a plan-accept HTTP / WS event. Text Ask first vs Instant apply
stays the website-editor Assistant switch.

`POST …/voice/tool-calls` (and transcripts / recordings): `in_flight_run` is
only a **second start**, not the current voice run.

Both paths append the **assistant thread** as they run. Parallel write:
`ai.ai_generations` (audit, `thread_kind=cms_assistant` thread). Assistant
thinking (lightbulb) is `thread_items.thread_item_kind=thinking` written at turn
time. `ai_generations.internal_reasoning` stays on the audit row only (empty if
the voice service did not emit it). The in-flight run holds the `ai_generations`
id so voice tool-calls can append that audit row; that id is not stored on
thread rows.

When the owner leaves Voice, the thread already has utterances and muted tool
`summary` lines. Frontend POSTs any committed-but-unsent transcripts. Next text
send assembles thread items from **this thread**, not from the voice service and
not from `ai_generations`. Voice → text is always a backup on the same
conversation (CMS: **Switch to text mode**). First text assembly after a
completed voice run injects step 7 (Voice transcription notice). If the browser
refuses the microphone, Voice cannot hear: CMS shows the shared **notification**
([frontend](../../general-architecture/frontend.md); same Ads/Details notice as [`apps/demo/`](../../../apps/demo/README.md) `/cms/ads`):
**Try again** (retry the microphone) and **Switch to text mode**. Copy:
**Allow microphone access in your browser to talk. You can keep typing.**
Onboarding returns to the cue (**Allow microphone access in your browser**);
click retries. Do not create the realtime connection until the microphone is
granted (denied microphone never POSTs `…/realtime-connection`). Onboarding has
**no text backup** (no `GET /v1/onboarding/assistant/thread/ws`).

**Voice idle:** frontend-owned. If the owner does not speak for **30 seconds**
(named constant, asserted in tests), stop the conversation. CMS close path:
leftover transcripts (committed xAI events → `offset_seconds`) + usage,
recording upload (signed URL), drop realtime connection. Onboarding close path:
leftover transcripts (committed xAI events → `offset_seconds`) + usage, drop
realtime connection — **no** recording upload. A warning at **20 seconds** that
it will end — look TBD. Go does not enforce this idle timer.

**Billing:** billed CMS work is a text LLM call, image generate/cleanup, or ads
generate. **Our cost** is the **AI vendor cost** invoice; **their cost** is ×5
on Usage & billing. Voice is **AI voice vendor cost** (audio minutes + text-item
fees), same ×5. Nested
image/cleanup from a voice tool is another billed LLM/image call. **Calls**
`AssertUsageCredit` before the billed text LLM call, before CMS
realtime-connection create, and before a billed tool. Exhausted is **402**
`usage_credit_exhausted`. Drop the CMS realtime connection when usage credit is
exhausted. Transcripts settlement **calls** `RecordAIUseSpend` and stays **200**
so the debit can land. Do not debit wall-clock. Onboarding is not billed.

## When rows are written

Record every conversation for debug / improvement (ops, not Assistant hydrate).
Hydrate and the next text turn read **only** `threads` / `thread_items`. They
do not join `ai_generations`. Hydrate does not return `runs`.

`GET /v1/assistant/thread` **creates if needed**: no `current` → insert empty
`current`, **200** `items: []`. `POST /thread/new` is New thread / clear
context.

- **Text:** persist `thread_items` + `ai_generations` at turn end **in
  process** on the text WebSocket. `ai_generations.input` is the exact
  assembled prompt sent that turn (prompt assembly order above). Do not add a
  browser POST of the whole convo after the socket. Do not dump debug over the
  socket.
- **Voice text:** Go never saw audio. At realtime-connection create, the voice
  run’s `ai_generations.input` is the exact instructions seeded (plus
  keyterms / `replace`). `POST /v1/assistant/voice/transcripts` (and generations
  from `…/voice/tool-calls`) **is** the later text POST. The browser forwards
  committed xAI Voice events already on that socket; Go maps them to typed
  `thread_item_kind` / `body` / `offset_seconds` and stores `provider_event`.
  Reconstruct the conversation from that `input` + thread items +
  `provider_event`. Do not invent a second text dump route. Do not call STT
  again. No `thread_item_kind=system` on the thread.
- **Voice recording (CMS only):** after Voice turns off, the browser asks for a
  signed URL, PUTs **directly to object storage** (R2 in production), then
  `…/complete`. Same `files` table as media library / website-form uploads
  ([files](../../general-architecture/files-and-s3.md)). `visibility=private`. `owner_type=assistant_voice`, `owner_id` =
  that voice `runs.id`. One object per voice run (`runs.recording_file_id`).
  Empty capture (they opened and closed without audio): skip the upload. Failed
  PUT does not fail transcripts or billing settlement. GET thread never returns
  the URL and never plays it. Compaction does **not** delete the object or the
  `files` row. **Onboarding does not store Voice recordings.** Persist committed
  utterance text on `assistant_conversation_items` (`body` + `offset_seconds`
  from `audio_start_ms` when present; `provider_event` jsonb). Reconstruct
  `[m:ss owner]` / `[m:ss assistant]` from typed `thread_item_kind` +
  `offset_seconds`. No `files` row, no `recording_file_id`, no onboarding
  recordings HTTP. `created_at` is the row insert time, not the conversation
  clock.
- **Not in Postgres:** the recording file, PCM, ASR/TTS deltas. Committed xAI
  transcript JSON is `provider_event` jsonb.
- Compaction does **not** delete `ai_generations`. Compaction may shrink
  `thread_items`; debug still has generation `input` / `output` / `tool_calls`.

`last_assistant_edit_at` is written when **tool events** are persisted. Not a
discard timer.

`POST /v1/assistant/thread/new` is one transaction: previous `status=completed`,
insert `status=current` on `ai.threads` (`thread_kind=cms_assistant`). Unique
`(tenant_id) WHERE thread_kind = 'cms_assistant' AND status = 'current'`
violation is **409** `thread_current_exists`. **409** `in_flight_run` while any
CMS run is `running` (text or Voice). Do **not** drop Voice from this POST —
wait until the current run finishes. Pending Ask first keeps the run `running`,
so New thread is 409 until Apply or Reject. There is always a `current` row
(empty `items` until the first turn) — GET thread is not a 404.

## In-flight lock

One run per **CMS** assistant. Unique `(tenant_id) WHERE status = 'running'` on
`runs` is the lock. Voice + text share it: **409** `in_flight_run` on a second
text send or second Voice create. Voice lock **starts** at
`POST /v1/assistant/voice/realtime-connection` (`channel=voice`) and **ends** on
close / usage credit drop / crash (`failed` or `succeeded`). No cancel HTTP.

While `ask_first_status=pending` the run stays `running`. New thread, second
text send, second Voice create → 409. Same Voice connection may continue.
`run_id` + dirty keys in tenant+thread `localStorage`. GET thread still omits
`runs`.

Onboarding 06 while unactivated **does** hold this table’s unique `running` on
the unpaid website-preview thread. After 09 leftover 06 is River with a
`tenant_id` lock only. CMS is not 409-blocked while leftover 06 finishes. Same
website-slot overlap after pay is last-write / website PATCH
`edit_history_conflict`.

Onboarding assistant lock is per onboarding session (not `tenant_id`) — see
[onboarding assistant](../onboarding/assistant.md). Name in-flight 409 on
onboarding realtime-connection create the same way.

Allowed-set reject, **402**, or lock **409**: still write a failed
`function_call_output` on the voice-service socket (body/events from the HTTP
response).

## Apply

CMS writes: frontend in-memory projection + ordinary website PATCH / `/menus`.
`record-apply` / `record-reject` are activity metadata only. Go already saw the
tools (`planned` on that run). Gate is **server** `runs.ask_first_status`: only
if still `pending`. Instant apply never writes `pending` (column stays null).
Never proposed / already `applied` / already `rejected` (second transition
included) → **409** `ask_first_not_pending`. Instant apply: Reject is not
offered; that POST is the same 409.

`record-reject` does **not** upsert unpublished website rows, does **not** call
the LLM, is not 402. It **does** append a muted thread item (owner-facing copy:
edits did not land) so prompt assembly step 6 has a row with no new column.

Ask-first **canvas dirty keys** live in `localStorage` (tenant + thread scoped)
so Apply can PATCH. They are not how Go knows a proposal exists. Missing
`localStorage` is not the server gate. Stale vs live unpublished website: PATCH
`409` `edit_history_conflict`. Apply in one tab: other tabs drop localStorage
when they see terminal.

Onboarding 06 writes unpublished rows headless (River) and, while unactivated,
appends `tool_summary` on the unpaid thread. The website preview follows via
onboarding SSE + unpublished GET, and hydrates those items with
`GET /v1/onboarding/website/assistant/thread` (onboarding session token or
Clerk). That thread is the in-flight copy UI. Do not reparent 06 into the CMS
Assistant HTTP. After 09 it must not append thread items.

Ask first vs Instant apply: **CMS website editor text** only. CMS Voice always
Ask first. Unpaid website preview forces instant apply on text **and** Voice
([website editor](../onboarding/website-editor.md)). Ads: highlight / agent-edited notice on `cleanup_image`;
Review **inline AI assistance** stays. Details screen: Follow. `update_details`
off Details: notification (OK / Revert). No owner Plan switch on Voice.

## Compaction

After 12 hours of inactivity (`ai.threads.last_activity_at`,
`thread_kind=cms_assistant`), River job kind `assistant_thread_compaction`
summarizes older **thread** items in place: keep the last **3 owner** and last
**3 assistant** items (plus `tool_summary` / `thinking` in that tail); older
items become **one** `assistant` summary; `compacted_through_item_id` advances.
Cheap flash model (DeepSeek V4 Flash or current Qwen Flash — **pin a dated
id**, not `*-latest`). New `ai_generations` row for that call; no usage-credit
debit. Does not rewrite existing `ai_generations` rows. Compaction keeps the
thread `id`. Clear context is `POST /v1/assistant/thread/new`, not compaction.

`CompactAssistantThread` also runs when text prompt assembly would exceed 128K
tokens, or when Voice **instructions** would be too large to send (do not wait
12h). Not a live-xAI context trim. There is **no 24h discard job**. Compaction
**skips** threads whose tenant is `status=unactivated` (onboarding website
editor unpaid `current` must not compact).

## Error map

| `code` | Keys off |
| --- | --- |
| `tenant_unactivated` | `tenants.status` not active |
| `usage_credit_exhausted` | billing AI use ledger |
| `in_flight_run` | `assistant.runs` unique running |
| `allowed_set_rejected` | run `assistant_screen` vs that tool’s screen gate |
| `thread_current_exists` | `ai.threads` unique current (`thread_kind=cms_assistant`) |
| `ask_first_not_pending` | `runs.ask_first_status` is not `pending` |

HTTP status for each code: [api.md](api.md). A request with `follow: false` is a
plain **400**, not a named code.

## Lifecycle

Activated owner: **403** on all onboarding routes (Find / Review and onboarding
website editor). Unactivated: **403** `tenant_unactivated` on `/v1/assistant/…`.
Unpaid website preview: [onboarding website editor](../onboarding/website-editor.md). 09 completes unpaid
`current`; do not migrate items onto the CMS thread.
