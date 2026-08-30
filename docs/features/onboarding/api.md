# Onboarding HTTP

Conventions: [HTTP conventions](../../general-architecture/api.md). Business lookup, resume, client interview, SSE,
website activation. Details after website activation: [details HTTP](../business-profile/details/api.md). Applying
the website template is owned by [website](../website/api.md); this feature only enqueues it.

## Serve only types on HTTP

| Location | Persistence | HTTP |
| --- | --- | --- |
| Company registry / Maps search | raw ETL cache | `*Read` (id, name, address, …). **Omit** `raw`. |
| Business research / ETL fetches | `raw` jsonb | **Omit.** Checklist `*Read` is named keys + status enum. |
| Stripe event body | jsonb | **Omit.** Activation-status is a closed enum + checkout URL. |
| Client interview extra notes | text | `string` + `maxLength`. |
| SSE events | — | Huma `sse.Register` event name → struct. Not an unconstrained `payload`. |

## Complete

Business lookup is **one** command. Collapse predecessor Don't say setup:
`POST /setup-sessions` and `…/from-google-place`. **Do not create** a bare
collection `POST /v1/onboarding-sessions`.

### POST /v1/onboarding-sessions/business-lookup

- **Auth:** none
- **Callers:** `frontend-2` `/onboarding/find` once. Mount/keystroke must not
  POST.
- **Idempotency-Key:** yes (same browser must not insert a second tenant).
- **Request:** country (`ie` / `gb` / `us`; default Ireland),
  **online research consent** (required boolean), company registry record
  candidate and/or Google Maps `place_id`. Consent is this body field, not a
  `/research-consent` resource. Country is persisted on `tenants.country`
  (Voice region fallback).
- **Response:** `{ id, token, status, research_wait_until? }`. Token →
  `localStorage`. Inserts unactivated tenant + onboarding session + empty
  business profile; enqueues business research if under the 5-enqueue cap. Over
  cap → still 200 with `research_wait_until` (later source change that would
  start `StartRun` is `429`).
- **Must not:** apply the website template; wait for business research.

### GET /v1/onboarding-sessions/company-registry/search

- **Auth:** none
- **Callers:** Find typeahead (debounced).
- **Query:** country + search string (`minLength`/`maxLength`).
- **Response:** company registry `*Read` list. **Omit** `raw`.

### GET /v1/onboarding-sessions/google-maps-listings/autocomplete

- **Auth:** none
- **Callers:** Find typeahead (debounced).
- **Response:** Google Maps listing `*Read` list. **Omit** Maps `raw`.

### GET /v1/onboarding-sessions/{id}/profile

- **Auth:** onboarding session token
- **Callers:** Resume and Review. Restore failure does not POST.
- **Response:** onboarding session status, checklist `*Read`, research
  conflicts, preview website address when 07 has reserved it,
  `research_wait_until`. This is **not** Details.
- **Must not:** return ETL fetch `raw`.

### GET /v1/onboarding-sessions/{id}/profile/checklist

- **Auth:** onboarding session token
- **Callers:** Review / client interview.
- **Response:** named checklist keys + status enum (`in_progress` / `conflict` /
  `needs_confirmation` / `filled_by_user` / `filled_by_research` / `skipped` /
  `not_applicable` / `empty` — [build-profile](pipeline/build-profile.md)).

### POST /v1/onboarding-sessions/{id}/profile/confirmations

- **Auth:** onboarding session token
- **Callers:** contractor picks a research conflict.
- **Idempotency-Key:** yes.
- **Request:** checklist key + chosen value (named fields, extra keys 4xx).

### PATCH /v1/onboarding-sessions/{id}/sources

- **Auth:** onboarding session token
- **Callers:** attach/change Google Maps listing or company registry record on
  the **same** onboarding session (new `etl.StartRun`, same cap).
- **Idempotency-Key:** yes.
- **Replaces:** predecessor `company-selection` / `imports` / `consents`.
- **Errors:** `429` with `research_wait_until` when the enqueue cap would be
  exceeded.

### PUT /v1/onboarding-sessions/{id}/text-interview/autosave

- **Auth:** onboarding session token
- **Callers:** text client interview (save on click-off / periodic autosave).
- **Idempotency-Key:** yes.
- **Request:** named answer fields + extra notes (`string` + `maxLength`). Extra
  keys 4xx.

### POST /v1/onboarding-sessions/{id}/text-interview/submissions

- **Auth:** onboarding session token
- **Callers:** text client interview step submit.
- **Idempotency-Key:** yes.

### POST /v1/onboarding-sessions/{id}/interview/complete

- **Auth:** onboarding session token
- **Callers:** complete gate in [build-profile](pipeline/build-profile.md).
- **Idempotency-Key:** yes.
- **Behavior:** sets `accepted_edit_id`; enqueues apply-the-website-template.
  **No** `generation-runs` from `frontend-2`.

### GET /v1/onboarding-sessions/{id}/events/stream

- **Auth:** onboarding session token
- **Callers:** `/onboarding/preview` in `frontend-2` (and Review while 02 runs).
  Not the contractor host.
- **Transport:** Huma `sse.Register`. Named event structs, for example:
  `checklist_row`, `timeline_step`, `research_wait_until`,
  `website_preview_ready`.
- **Must not:** unconstrained `payload` object; unknown events parsed as `any`
  (`frontend-2` drops them).

### POST /v1/website-activations/checkout

- **Auth:** Clerk JWT, Host / `website_prefix` (unactivated allowed).
- **Callers:** website-activation strip island on the preview website address.
- **Idempotency-Key:** yes.
- **Response:** checkout URL. **Omit** Stripe bodies.
- **Must not:** website publication; browser Stripe success URL as the source of
  truth; `/v1/website-previews/{token}/…`.

### GET /v1/website-activations/status

- **Auth:** Clerk JWT, Host / `website_prefix` (unactivated allowed).
- **Callers:** poll after checkout.
- **Response:** closed status enum + checkout URL if still needed.

### POST /v1/webhooks/stripe

- **Auth:** Stripe webhook signature
- **Callers:** Stripe. Never `frontend-2`.
- **Behavior:** verify, persist event, enqueue website activation, return. Never
  trust the browser success URL.

## Complete — onboarding assistant (guide)

Auth is the onboarding session token, not Clerk `/me.tenant`. Activated owner:
**403** on all `/v1/onboarding/assistant/…`. Onboarding session
`GET /v1/onboarding-sessions/{id}/events/stream` is **SSE** (pipeline progress),
not this assistant. Isolation and `tools=[]`: [onboarding assistant](assistant.md).

### POST /v1/onboarding/assistant/voice/realtime-connection

- **Auth:** onboarding session token
- **Callers:** contractor turns the **voice guide** on (not Find mount).
- **Idempotency-Key:** yes.
- **Request:** current onboarding step + visible fields. No unpublished website
  working copy.
- **Response:** browser-safe secret + expiry + **realtime URL** (`string` +
  `maxLength`, `wss://…` for the xAI region Go picked). Audio is browser ↔
  that URL, not this socket. Go picks the region from the business country
  ([voice agent](../../general-architecture/voice-agent.md)).
- **Errors:** **403** if the tenant is already activated; **409**
  `in_flight_run` if a guide run is already `running` for this onboarding
  session.
- **Must not:** return the long-lived voice API key; accept a browser-chosen
  region or host.

### POST /v1/onboarding/assistant/voice/transcripts

- **Auth:** onboarding session token
- **Callers:** committed utterances onto the one thread; usage-only when Voice
  turns off.
- **Idempotency-Key:** yes.
- **Request:** same shape as CMS transcripts (owner visible text `maxLength`
  **5000 characters**; assistant visible text storage `maxLength`, not a
  5000-character generation cap; **`offset_seconds`** per utterance; optional
  reasoning; audio seconds + `billed_text_item_count` when present). Go sets
  `created_at` on insert (row time). **Omit** PCM.
- **Errors:** **403** if activated. Settlement stays **200**.
- **Must not:** accept PCM, ASR/TTS deltas, or the recording file; use
  `created_at` as the conversation clock.

### GET /v1/onboarding/assistant/thread

- **Auth:** onboarding session token
- **Callers:** reload, resume, later Voice turn.
- **Response:** the one conversation `*Read` + ordered `items` (`kind`, `body`,
  `icon`, `offset_seconds`, `created_at`). Empty is `200`
  with `items: []`.
- **Errors:** **403** if activated.
- **Must not:** return `thread_items` as the field name; return runs, audit
  blobs, or recording URLs.

## Listed

- `GET /v1/onboarding-sessions/{id}/business-research-runs` (+ get by id) —
  debug/status. Progress is SSE.
- `GET /v1/onboarding-sessions/{id}/apply-website-template-runs` (+ get/cancel)
  — debug/status.
- Voice realtime connection — **onboarding assistant (guide):**
  `POST /v1/onboarding/assistant/voice/realtime-connection`. Created when they
  turn the **voice guide** on and the microphone is granted, not on Find mount.
  A prerecorded intro file plays after that grant; live audio after.
  [onboarding assistant](assistant.md). Activated
  owners **403**. First-pass client interview **data entry** is still text
  ([04a](pipeline/04a-text-client-interview.md)). Agent writer
  ([04b](pipeline/04b-voice-client-interview.md)) is out.

## Do not create

- Don't say setup: `/setup-sessions`, `…/from-google-place`, `profile/facts`
- separate consents resource, artifacts, contract-versions
- Don't say: preview-packages
- Don't say: `preview/{token}/module/{module}`
- Don't say claim: `…/claim`, `…/claim/checkout`, `…/package`,
  `approve-publish`, `request-changes`
- sandbox-actions, `generation-runs` from `frontend-2`
- `/v1/preview/{token}/…` and `/v1/website-previews/{token}/…` (pay is Host /
  `website_prefix` on `/v1/website-activations/…`)
- `/v1/onboarding-sessions/confirm` (use `…/business-lookup`)
- `/v1/onboarding/assistant/…` after website activation (403)
- leftover `/v1/onboarding-sessions/…` with an onboarding session token after
  website activation (403)
- `POST /v1/onboarding/assistant/thread/new` (CMS only)
- `POST /v1/onboarding/assistant/tool-calls`
- `POST /v1/onboarding/assistant/voice/tool-calls` this pass (`tools=[]`)
- `POST /v1/onboarding/assistant/turns`
- `POST /v1/onboarding/assistant/thread/clear`
- `GET /v1/onboarding/assistant/thread/ws` (no text backup)
- `POST /v1/onboarding/assistant/voice/recordings` and
  `…/recordings/{id}/complete` (onboarding does not store Voice recordings)
- unprefixed `POST /v1/onboarding/assistant/realtime-connection` /
  `…/transcripts` / `…/recordings`
