# Assistant architecture

Logic: what is in context, how tools are allowed, how text and voice share one
dispatcher, when rows are written, which HTTP error maps to which gate. Tables:
[persistence.md](persistence.md). HTTP contract: [api.md](api.md). Overlay:
[design decision record](design-decision-record.md).

Those two files are the contract (fields, errors, columns, indexes). This file
is how the system behaves. Do not retell this file in api or persistence.

## Always in context

- Live business profile. Details is not a third registry: `update_details` is
  always allowed.
- Product knowledge: owner-facing markdown compiled into the Go binary. Not RAG.
  Not `docs/`. Not `internal/ai` (that package is `LLMProvider` + traces).

Two knowledge bases, two YAML registries (they do not share a system prompt):

- CMS: `internal/assistant/knowledge/cms_knowledge_base_registry.yaml` plus
  listed markdown. `go:embed` by `internal/assistant`.
- Onboarding:
  `internal/onboarding/assistant/knowledge/onboarding_knowledge_base_registry.yaml`.
  Onboarding must not import `internal/assistant`.

YAML fields: `id` (`assistant.knowledge` / `onboarding.assistant.knowledge`),
`format_revision`, ordered `files`. Concatenate
**only listed files, in YAML order**, into the text-turn system prompt and the
voice connection instructions (same text). A missing listed file fails boot.
Record `knowledge_id` + `knowledge_format_revision` on `ai_generations`. YAML +
markdown land with the Go implementation; this feature specifies the contract.

Keep it small enough to inject every turn. `get_context_about_screen` is live
assistant screen context, not this copy.

## Prompt assembly order

Each CMS text turn and each CMS voice-connection seed concatenates in this
order (do not reorder):

1. Knowledge base (listed files, YAML order)
2. Live business profile
3. Thread items (this thread; compacted tail is one `assistant` summary + last
   3 owner + last 3 assistant items)
4. Current assistant screen context (typed struct)
5. Assistant screen switch notification when the screen changed since the last
   **owner** request

Onboarding seed is current step + visible fields. `tools=[]`. No canvas.

## Assistant screen context

Frontend reports the current assistant screen. **CMS v1 closed enum:**
`cms` | `website_editor` | `ads` | `details` | `projects` |
`certifications_and_reviews` | `media_library` | `billing`.
`cms` is `/cms` (two cards), guide-only. Connect (ad accounts) is **not** an
assistant screen.

Write tools: website editor + Ads `cleanup_image`. `update_details` is always
allowed. Other enum values are guide.

A **website page** change inside the website editor is not an assistant screen
switch (still `website_editor`). The next owner turn carries an updated
unpublished website working copy.

Same assistant screen as last **owner** request: no extra notice. An
**assistant screen switch** is relative to the last owner request, not to clicks
during the current run. Inject an assistant screen switch notification plus that
screen’s assistant screen context (typed per screen, not a JSON bag). Website
editor working copy from the frontend (local-first projection). Ads from Go.
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

## Tool registry vs allowed set

**Full CMS `tools=` always loaded.** Every text turn and
`POST /v1/assistant/voice/realtime-connection` gets the entire CMS registry.
Do not swap the list on assistant screen switch. “General” is the
**always-executable** subset, not “the only tools the model sees.”

**Always executable:** `update_details`, `switch_assistant_screen`,
`get_context_about_screen`, `get_ad` (404 unknown id), `get_website_styles`.

**Allowed only with that screen loaded** (else **409** `allowed_set_rejected`):

- Website editor write tools (`update_slot`, `update_reviews`, `update_seo`,
  `update_form`, `update_website_styles`, `set_section_visibility`,
  `update_section_design`, `reorder_sections`, `create_section`, `create_page`,
  `update_menus`, `generate_image`, `cleanup_image` on the website editor).
- Ads: `cleanup_image` only (same media-library function as Review cleanup /
  website editor). Then PATCH that placement on the existing ads caller path.

**Not CMS assistant tools:** ads generate / revise / rewrite (stay Ads UI:
Create ad and generate, Revise, Review copy orbs). No wrap of ads HTTP.
`generate_image` stays website-editor unless a later pass says otherwise.

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

Voice HTTP is under `/v1/assistant/voice/` (`realtime-connection`,
`tool-calls`, `transcripts`). Voice create includes the unpublished website
working copy when `assistant_screen` is `website_editor`. Other screens omit
that blob. `POST …/voice/tool-calls` still sends working copy when those tools
run (canvas may have changed). Seed **instructions** (knowledge + profile +
screen). Do not replay the thread as billed `conversation.item.create` items.
Pin a dated xAI voice model id (not `grok-voice-latest`).

Both paths append the **assistant thread** as they run. Parallel write:
`ai.ai_generations` (audit, `thread_id` set). Overlay thinking (lightbulb) is
`thread_items.kind=thinking` written at turn time.
`ai_generations.internal_reasoning` stays on the audit row only (empty if the
voice service did not emit it). The in-flight run holds the `ai_generations` id
so voice tool-calls can append that audit row; that id is not stored on thread
rows.

When the owner leaves Voice, the thread already has utterances and muted tool
`summary` lines. Frontend POSTs any committed-but-unsent transcripts. Next text
send assembles thread items from **this thread**, not from the voice service and
not from `ai_generations`. Voice → text is always a backup on the same
conversation (CMS: **Switch to text mode**). If the browser refuses the
microphone, Voice cannot hear: CMS shows the shared **notification**
([frontend](../../general-architecture/frontend.md); same Ads/Details notice as [ads.html](../../design/ads.html)): **Try again** (retry the
microphone) and **Switch to text mode**. Copy:
**Allow microphone access in your browser to talk. You can keep typing.**
Onboarding returns to the cue (**Allow microphone access in your browser**);
click retries. Do not create the realtime connection until the microphone is
granted (denied microphone never POSTs `…/realtime-connection`).

**Voice idle:** frontend-owned. If the owner does not speak for **30 seconds**
(named constant, asserted in tests), stop the conversation (existing close
path: leftover transcripts + usage, recording upload (signed URL), drop realtime
connection). Same for CMS and onboarding. A warning at **20 seconds** that it
will end — look TBD. Go does not enforce this idle timer.

**Billing:** billed CMS work is a text LLM call, image generate/cleanup, or ads
generate (**×5** our cost). Voice is audio minutes + text-item fees, same ×5.
Nested image/cleanup from a voice tool is another billed LLM/image call. Check
usage credit before the billed text LLM call, before CMS realtime-connection
create, and before a billed tool. Exhausted is **402**
`usage_credit_exhausted`. Drop the CMS realtime connection when usage credit is
exhausted. Transcripts settlement stays **200** so the debit can land. Do not
debit wall-clock. Onboarding is not billed.

## When rows are written

Record every conversation for debug / improvement (ops, not overlay hydrate).
Hydrate and the next text turn read **only** `threads` / `thread_items`. They
do not join `ai_generations`. Hydrate does not return `runs`.

- **Text:** persist `thread_items` + `ai_generations` at turn end **in
  process** on the text WebSocket. Do not add a browser POST of the whole convo
  after the socket. Do not dump debug over the socket.
- **Voice text:** Go never saw audio. `POST /v1/assistant/voice/transcripts`
  (and generations from `…/voice/tool-calls`) **is** the later text POST. Do not
  invent a second text dump route.
- **Voice recording:** after Voice turns off, the browser asks for a signed URL,
  PUTs **directly to object storage** (R2 in production), then
  `…/complete`. Same `files` table as media library / website-form uploads
  ([files](../../general-architecture/files-and-s3.md)). `visibility=private`.
  `owner_type=assistant_voice`, `owner_id` = that voice `runs.id`. One object
  per voice run (`runs.recording_file_id`). Empty capture (they opened and
  closed without audio): skip the upload. Failed PUT does not fail transcripts
  or billing settlement. Overlay / GET thread never return the URL and never
  play it. 24h overlay discard does **not** delete the object or the `files`
  row.
- **Not in Postgres:** the recording file, PCM, ASR/TTS deltas.
- 24h overlay discard does **not** delete `ai_generations`. Compaction may
  shrink `thread_items`; debug still has generation `input` / `output` /
  `tool_calls`.

`POST /v1/assistant/thread/new` is one transaction: previous `status=completed`,
insert `status=current`. Unique `(tenant_id) WHERE status = 'current'`
violation is **409** `thread_current_exists`. Pending Ask-first on that thread
is rejected (`ask_first_status` → `rejected` when `pending`); drop the CMS
voice realtime connection if Voice is on. There is always a `current` row
(empty `items` until the first turn) — GET thread is not a 404.

## In-flight lock

One run per **CMS** assistant. Unique `(tenant_id) WHERE status = 'running'` on
`runs` is the lock. Voice + text share it: **409** `in_flight_run` on a second
text send or second Voice create. Voice lock **starts** at
`POST /v1/assistant/voice/realtime-connection` (`channel=voice`) and **ends** on
close / usage credit drop / crash (`failed` or `succeeded`). No cancel HTTP.

Onboarding 06 is **not** this table. 06 is River with a `tenant_id` lock. CMS
is not 409-blocked while 06 finishes. Same website-slot overlap after pay is
last-write / website PATCH `edit_history_conflict`. Unactivated cannot edit
website slots or call `/v1/assistant/…`.

Onboarding assistant lock is per onboarding session (not `tenant_id`) — see
[onboarding assistant](../onboarding/assistant.md).

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

Ask-first **canvas dirty keys** live in `localStorage` (tenant + thread scoped)
so Apply can PATCH. They are not how Go knows a proposal exists. Missing
`localStorage` is not the server gate. Stale vs live unpublished website: PATCH
`409` `edit_history_conflict`. Apply in one tab: other tabs drop localStorage
when they see terminal.

Onboarding 06 writes unpublished rows headless (River, no chat UI, no
`frontend-2`). Do not reparent 06 into the CMS overlay.

Plan vs continuous and Ask first vs instant apply: **website editor only**. Ads:
highlight / agent-edited notice on `cleanup_image`; Review field orbs stay.
Details screen: Follow. `update_details` off Details: notification (OK /
Revert).

## Compaction and 24h discard

After 12 hours of inactivity (`threads.last_activity_at`), a River job
summarizes older **thread** items in place: keep the last **3 owner** and last
**3 assistant** items (plus `tool_summary` / `thinking` in that tail); older
items become **one** `assistant` summary; `compacted_through_item_id` advances.
Cheap flash model (DeepSeek V4 Flash or current Qwen Flash — **pin a dated
id**, not `*-latest`). New `ai_generations` row for that call; no usage-credit
debit. Does not rewrite existing `ai_generations` rows. Compaction keeps the
thread `id`. Clear context is `POST /v1/assistant/thread/new`, not compaction.

After 24 hours with no assistant edit (`last_assistant_edit_at`), discard the
overlay thread (ADR 4). Do **not** delete `ai_generations`.

## Error map

| `code` | Keys off |
| --- | --- |
| `tenant_unactivated` | `tenants.status` not active / `/me.tenant` null |
| `usage_credit_exhausted` | billing AI use ledger |
| `in_flight_run` | `assistant.runs` unique running |
| `allowed_set_rejected` | run `assistant_screen` vs that tool’s screen gate |
| `thread_current_exists` | `assistant.threads` unique current |
| `ask_first_not_pending` | `runs.ask_first_status` is not `pending` |

HTTP status for each code: [api.md](api.md).

## Lifecycle

Activated owner: **403** on all onboarding routes. Unactivated: **403**
`tenant_unactivated` on `/v1/assistant/…`. Do not migrate the onboarding
conversation onto the CMS thread after website activation.
