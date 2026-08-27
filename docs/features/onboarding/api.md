# Onboarding HTTP

Conventions: [HTTP conventions](../../general-architecture/api.md). Business lookup, resume,
client interview, SSE, website activation. Details after website activation:
[details HTTP](../business-profile/details/api.md). Applying the website template is owned by
[website](../website/api.md); this feature only enqueues it.

## Serve only types on HTTP

| Location | Persistence | HTTP |
| --- | --- | --- |
| Company registry / Maps search | raw ETL cache | `*Read` (id, name, address, …). **Omit** `raw`. |
| Business research / ETL fetches | `raw` jsonb | **Omit.** Checklist `*Read` is named keys + status enum. |
| Stripe event body | jsonb | **Omit.** Activation-status is a closed enum + checkout URL. |
| Client interview extra notes | text | `string` + `maxLength`. |
| SSE events | — | Huma `sse.Register` event name → struct. Not an unconstrained `payload`. |

## Complete

Business lookup is **one** command. Collapse predecessor Don't say setup: `POST /setup-sessions` and
`…/from-google-place`. **Do not create** a bare collection `POST /v1/onboarding-sessions`.

### POST /v1/onboarding-sessions/business-lookup

- **Auth:** none
- **Callers:** `frontend-2` `/onboarding/find` once. Mount/keystroke must not POST.
- **Idempotency-Key:** yes (same browser must not insert a second tenant).
- **Request:** country (`ie` / `gb` / `us`; default Ireland), **online research consent**
  (required boolean), company registry record candidate and/or Google Maps `place_id`. Consent
  is this body field, not a `/research-consent` resource.
- **Response:** `{ id, token, status, research_wait_until? }`. Token → `localStorage`. Inserts
  unactivated tenant + onboarding session + empty business profile; enqueues business research
  if under the 5-enqueue cap. Over cap → still 200 with `research_wait_until` (later source change
  that would start `StartRun` is `429`).
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
- **Response:** onboarding session status, checklist `*Read`, research conflicts,
  preview website address when 07 has reserved it, `research_wait_until`. This is **not**
  Details.
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
- **Callers:** attach/change Google Maps listing or company registry record on the **same**
  onboarding session (new `etl.StartRun`, same cap).
- **Idempotency-Key:** yes.
- **Replaces:** predecessor `company-selection` / `imports` / `consents`.
- **Errors:** `429` with `research_wait_until` when the enqueue cap would be exceeded.

### PUT /v1/onboarding-sessions/{id}/text-interview/autosave

- **Auth:** onboarding session token
- **Callers:** text client interview (save on click-off / periodic autosave).
- **Idempotency-Key:** yes.
- **Request:** named answer fields + extra notes (`string` + `maxLength`). Extra keys 4xx.

### POST /v1/onboarding-sessions/{id}/text-interview/submissions

- **Auth:** onboarding session token
- **Callers:** text client interview step submit.
- **Idempotency-Key:** yes.

### POST /v1/onboarding-sessions/{id}/interview/complete

- **Auth:** onboarding session token
- **Callers:** complete gate in [build-profile](pipeline/build-profile.md).
- **Idempotency-Key:** yes.
- **Behavior:** sets `accepted_edit_id`; enqueues apply-the-website-template. **No**
  `generation-runs` from `frontend-2`.

### GET /v1/onboarding-sessions/{id}/events/stream

- **Auth:** onboarding session token
- **Callers:** `/onboarding/preview` in `frontend-2` (and Review while 02 runs). Not the
  contractor host.
- **Transport:** Huma `sse.Register`. Named event structs, for example:
  `checklist_row`, `timeline_step`, `research_wait_until`, `website_preview_ready`.
- **Must not:** unconstrained `payload` object; unknown events parsed as `any` (`frontend-2`
  drops them).

### POST /v1/website-activations/checkout

- **Auth:** Clerk JWT, Host / `website_prefix` (unactivated allowed).
- **Callers:** website-activation strip island on the preview website address.
- **Idempotency-Key:** yes.
- **Response:** checkout URL. **Omit** Stripe bodies.
- **Must not:** website publication; browser Stripe success URL as the source of truth;
  `/v1/website-previews/{token}/…`.

### GET /v1/website-activations/status

- **Auth:** Clerk JWT, Host / `website_prefix` (unactivated allowed).
- **Callers:** poll after checkout.
- **Response:** closed status enum + checkout URL if still needed.

### POST /v1/webhooks/stripe

- **Auth:** Stripe webhook signature
- **Callers:** Stripe. Never `frontend-2`.
- **Behavior:** verify, persist event, enqueue website activation, return. Never trust the
  browser success URL.

## Listed

- `GET /v1/onboarding-sessions/{id}/business-research-runs` (+ get by id) — debug/status.
  Progress is SSE.
- `GET /v1/onboarding-sessions/{id}/apply-website-template-runs` (+ get/cancel) — debug/status.
- Voice realtime connection / events / WebSocket — deferred. First-pass client interview is text.
  [voice agent](../../general-architecture/voice-agent.md).

## Do not create

- Don't say setup: `/setup-sessions`, `…/from-google-place`, `profile/facts`
- separate consents resource, artifacts, contract-versions
- Don't say: preview-packages
- Don't say: `preview/{token}/module/{module}`
- Don't say claim: `…/claim`, `…/claim/checkout`, `…/package`, `approve-publish`, `request-changes`
- sandbox-actions, `generation-runs` from `frontend-2`
- `/v1/preview/{token}/…` and `/v1/website-previews/{token}/…` (pay is Host /
  `website_prefix` on `/v1/website-activations/…`)
- `/v1/onboarding-sessions/confirm` (use `…/business-lookup`)
- bare `POST /v1/onboarding-sessions`
