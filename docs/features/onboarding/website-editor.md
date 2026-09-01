# Onboarding website editor

Unpaid website preview on `/onboarding/preview-and-edit/` (app origin only).
Contractor copy is **Assistant**. Spec label is onboarding website editor.
Pipeline step: [07 contractor copy improvement](pipeline/07-contractor-copy-improvement.md).

Never under `{website_prefix}.preview.placis.com`. That host is Cache then R2
(the [preview website address](../website/cloudflare.md)). After **09**, this
route redirects to `/cms/website`.

HTTP: `/v1/onboarding/website-editor/assistant/…` in
`internal/onboarding/websiteeditor`. Package is a **policy wrapper**: same
[website editor tools](../website/assistant.md), same text/Voice transport, same website-editor PATCH,
same `ai.threads` overlay SQL (`thread_kind=cms_assistant`), same 20-turn loop.
It owns auth, knowledge YAML, allowlist, instant apply, 5-prompt cap, skip 402.

CMS [`/v1/assistant/…`](../assistant/api.md) stays **403** `tenant_unactivated`
for unactivated. Do not add unactivated branches there. Do not put this in
`onboarding/websitepreview` (08 / R2) or `onboarding/assistant` (Find,
Review, and client interview, `tools=[]`). 06 and this package import
`website/assistant`. `websitepreview` does not.

Find, Review, and client interview: [onboarding assistant](assistant.md).
CMS Assistant: [assistant](../assistant/README.md).

## Persistence

Same overlay as CMS: `ai.threads` (`thread_kind=cms_assistant`) /
`assistant.thread_items` / `assistant.runs`. Unique `current` / `running` per
`tenant_id`. The unpaid website preview uses that `current` while
`tenants.status=unactivated`. **No new persistence models.** OpenAPI grows
**paths**. Reuse CMS thread/voice `*Read` shapes. GET thread **omits** `runs`.

`ai_generations.thread_id` is required. Owner turns set it to this
`cms_assistant` thread. 06 tool batches use a `website_copy_generation` thread.
Do not add a new FK. Do not use the `onboarding_assistant` thread (Find /
Review).

Voice recordings: CMS `assistant_voice` (`owner_id` = `assistant.runs` id), not
`onboarding_assistant_voice`.

**No compaction** on this unpaid `current` — not the 12h job, not 128K overflow,
not compact-before-seed at Voice create. Any of those would drop
`thread_item_kind=owner` items and refill the five. Unpaid thread is 06 + at
most five owner prompts. If text assembly would exceed 128K or Voice
instructions would not fit, that turn / Voice create fails. No 24h discard.

## HTTP

Prefix `/v1/onboarding/website-editor/assistant`. Same DTO names as
[assistant HTTP](../assistant/api.md) (`AssistantThreadRead`,
`AssistantOwnerMessage`, `AssistantVoiceUsage`, …). Seven routes:

- `GET …/thread` — hydrate; lazy-create empty `current` if needed; omits
  `runs`. Onboarding session token **or** Clerk + unactivated (same as
  unpublished GET). That hydrate is how they see 06 `tool_summary` on first
  land, still unsigned.
- `GET …/thread/ws` — text chat
- `POST …/voice/realtime-connection`
- `POST …/voice/tool-calls`
- `POST …/voice/transcripts`
- `POST …/voice/recordings`
- `POST …/voice/recordings/{id}/complete`

**Do not add** `thread/new`, `record-apply`, `record-reject`.

Auth: **GET `…/thread`** allows the onboarding session token or Clerk +
unactivated tenant (app origin). Send, text `…/thread/ws`, and Voice are
**Clerk JWT** only; tenant from the attached Clerk org; `status=unactivated`;
app origin. Onboarding session token must **not** send, PATCH, or call Voice.
`status=active` → **403** (use `/v1/assistant/…`). The preview website address
never calls this tree. Activated owners **403**. Unactivated **403**
`tenant_unactivated` on `/v1/assistant/…`.

Over five unpaid prompts: **409** `unpaid_prompt_cap`, pay CTA, **not** 402.
Empty / cancelled / `in_flight_run` does not count. Cap is per unpublished
tenant (shared across signed-in contractors). 06 does not count (no owner
items). After pay, CMS Assistant uses usage credit.

`in_flight_run` on Voice `tool-calls` must **not** apply to the current voice
run (same as CMS).

Owner input caps inherit CMS: text **4000** characters, utterance **5000**,
thread items **5000**. Follow always on (`follow: false` → 400). 20 tool-using
turns; text wrap-up on turns 18–20; 21st text inference `tools=[]` plaintext
summary then `succeeded`. 128K / 12K are text `LLMProvider` tokens, not a Voice
Go cap.

## Allowed tools

Owner prompts may run: `update_slot`, `update_reviews`, `update_seo`,
`update_form`, `set_section_visibility`, `reorder_sections`, `create_section`,
`create_page`, `update_menus`, `cleanup_image`, `generate_image`,
`update_details`, `open_website_page`.

**409** `allowed_set_rejected` / omit: `update_section_design`,
`update_website_styles`, `switch_assistant_screen`, all projects writes, Ads
tools, `open_ad`. Peek (`get_website_styles`, `get_context_about_screen`): omit.

`create_page` allowed for owner prompts; 06 still must not. After `create_page`,
the canvas follows `open_website_page` (or the same path the website editor
uses). `generate_image` in the five is **not billed**. `update_details` allowed;
whoever pays owns those profile rows.

## Thread

Same chat-like Assistant thread as CMS website editor
([website frontend](../website/frontend.md)): one list of `thread_items`. Each
tool is the backend `summary` (`Updated heading on Hero`), pencil for
`tool_summary`, lightbulb for `thinking`. Never a tool name. Chevrons
**expand / reduce** the thread (not a hide). **Close** returns to the
**Assistant** call. No Plan, no Ask first, no Clear context, no Apply / Reject
pills. Default **expanded** on land so 06 `tool_summary` is visible (wait-end
is ~15s; copy generation is usually still running). While that run is `running`,
a six-dot spinner sits under the thread (three to four dots lit). Canvas Follow
still snaps to the website section being edited.

## Instant apply

Server **forces instant apply** on text **and** Voice (ignore `ask_first` /
`plan` on the wire). Exception to CMS Voice always Ask first (assistant ADR 17).
Tool results → canvas projection → existing [`PATCH /v1/website/editor/…`](../website/api.md). Go
does not upsert unpublished rows on that turn. No click-to-edit UI. No Content /
website styles rail / design controls / owner Plan switch.

Signed-in unactivated PATCH on the **app** is allowed (this apply path). Do not
403 “human vs Assistant” on that route. Signed-out PATCH **403**. Preview
website address PATCH **403**. Onboarding session token must not PATCH.

Unpublished **GET**: onboarding session (mode 2) and/or Clerk + unactivated
tenant, app origin.

## Five prompts

A prompt is a signed-in contractor’s text send or utterance that starts a run.
Then composer and Voice off until they **pay**. No reset. Not billed before
website activation.

## 06

06 is the first run on this `current`: River still updates unpublished website
rows (cap **3 / 12 / 4**). It appends `tool_summary` as tools apply.
`ai_generations.thread_id` set. While unactivated, 06 holds unique `running` so
an owner prompt is **409** `in_flight_run` until idle.

The website preview follows 06 via **existing onboarding SSE** (same stream as
the wait teaser) plus unpublished **GET** (`edit_history_head` from that GET).
**GET `…/thread`** (onboarding session token or Clerk) hydrates `tool_summary`
items as they land — that is the in-flight copy UI. Do not invent `run_status`
on hydrate. Do not use the Assistant text socket as the 06 progress bus. Owner
send is **409** `in_flight_run` until 06 is idle.

After 09, leftover 06 continues as River-only: lock `tenant_id`, not
`assistant.runs`. It must not append thread items. CMS assistant / PATCH stay
**not** 409 because 06 is running ([assistant testing](../assistant/testing.md)
§15). Same website-slot overlap: last-write / `edit_history_conflict`.

06 still must not `create_page`.

## 09

In the **same transaction** as `tenants.status=active`, complete `current` and
end `running`. CMS `GET /v1/assistant/thread` lazy-creates a new empty
`current`. Do not migrate items. Unpublished website rows persist.

## Knowledge

`internal/onboarding/websiteeditor/knowledge/` YAML + markdown (`go:embed`).
Includes the shared product glossary. Must not import `internal/assistant`.
Voice create still loads `internal/knowledge/voice_pronunciation.yaml`.

## Surfaces

**`/onboarding/preview-and-edit/`** — wait-teaser landing. Signed-out: view the
canvas from the onboarding session token; switch website pages (custom top-left
control); hydrate the Assistant thread (`GET …/thread`); compact text composer
visible; send and Voice need **Sign up with Google**. Signed-in unpaid: live
canvas, nested website page list + canvas top-menu/footer website page clicks
stay on this route, Assistant thread + compact text composer (**Voice** switch),
sticky website-activation strip, **Share**. After **09**, redirect to
`/cms/website`.

Look: custom top-left nested control (this website preview only, titles list —
Services nests website pages; not the CMS Website pages rail). Website page list
and **Share** sit on the canvas corners (no reserved top row). No Find / Review
/ Questions progress, no onboarding Back, no Find/Review Assistant. Pay is the
sticky website-activation strip.
Assistant starts as text (compact docked composer, max-width 32rem on a wide
pane, in front of the website-activation strip’s lift shadow) with the CMS
Assistant thread above it (expand / reduce; no Plan / Ask first / Clear
context). **Voice** is a switch in that composer. Send and Voice need **Sign up
with Google**. No owner Plan switch. Instant apply. 06 `tool_summary` fills the
thread on land. After Sign up, Send and Voice on the look demo snap the canvas
to the website page being edited (Follow) and apply copy. Reuse CMS Assistant
tokens.

**Preview website address** — after Share (or after 09 if they paid without
sharing). Cache then R2 + strip. No website preview, no Assistant, no SPA. Pay
from the strip still works (09). Apex `preview.placis.com` is **404**.

Share: onboarding session token (or Clerk unactivated). Reserves
`website_prefix` if needed and runs [08](pipeline/08-preview-website-address.md)
(strip on). Optional. That host does not follow later 06 or Assistant PATCHes
until they share again (or 09).

Pay does not require a prior share.
