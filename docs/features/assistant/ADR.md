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
   (2026-08-29): Hydrate when they **call** the assistant (top-right
   **Assistant**), including `/cms`. Visiting `/cms` without calling does not
   hydrate. Overlay-mount hydrate is the old trigger.

5. **Thread is standalone persistence** — Schema `assistant`. Hydrate, overlay,
   voice→text, and the next text turn read **only** thread rows.
   `ai.ai_generations` is audit only (no FK from thread). Website
   `edit_history.ai_generation_id` stays last-writer on website edits.
   Onboarding conversation tables stay under schema `onboarding`. Shared `ai` is
   `LLMProvider` + traces; features own product rows. (2026-08-28)

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
   Overlay does not hydrate or play them. (2026-08-28)

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
   `edit_history_conflict`. (2026-08-28)

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
   not 403. Transcripts settlement stays 200.

10. **Every screen in The CMS can call the assistant** — The owner calls the
    assistant from a top-right **Assistant** button on every screen in The CMS,
    including `/cms`. Default channel is **Voice**. Text is a switch on the same
    thread (Restore chatbot / Voice in the composer), not a second assistant.
    Closed until they call; do not leave the orb or overlay always on. Hydrate
    when they call (open **Assistant**). `/cms` is a guide-only assistant
    screen (`cms` in the CMS v1 enum). Connect (ad accounts) is still not an
    assistant screen. Plan / Ask first stay website editor only. Do not clone
    this button onto onboarding (onboarding stays the bottom-right voice guide).
    Not an **AI tools** left-nav item. Look:
    [design decision 11](design-decision-record.md). (2026-08-29)
