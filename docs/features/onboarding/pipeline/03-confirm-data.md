# 03 — Review

Today’s `/onboarding/review`. Not a required gate. **Skip is expected.**
The product job is extra wall-clock for 02 before the client interview,
plus **change the business** (01). Lingering is optional; skip is the
normal fast path.

01 business lookup create is not this step. This step does not create an
onboarding session. Change-the-business **calls** `LookupBusiness` (01
owns the write).

## Trigger

01 Out navigates here. Resume with `client_interviewing` and no client
interview started (`channel` unset, no autosave) also lands here.

## Pre

- Onboarding session `status=client_interviewing`.
- Stored token restores via `GET /v1/onboarding/profile`.
- 02 may be in flight (`in_progress` rows).

## Must not

- Create an onboarding session (no onboarding session token, or unknown token).
- Cancel 02. Back and same-keys lookup do not stop it.
- `POST /v1/onboarding/interview/complete` or select and copy the website
  template.
- Wait for 02 to finish before Continue is enabled.
- A research-wait modal, full-screen stop, or disabled Continue.
- Define a second copy of the complete-gate keys (owned by [build-profile](build-profile.md)).
- Treat skip as Fail.

## Do

1. **Render** found vs missing from build-profile fill status. Conflicts
   never auto-picked; the contractor edits the field on 04a
   (`algorithm=human`).
2. Legal identity from the registry is shown here; the text client
   interview (04a) does not repeat those fields.
3. **Change the business** — same pickers as Find (`BusinessSourcePanel`).
   `POST /v1/onboarding/business-lookup` with the stored token. Same attach
   keys → 01 safe to retry; different keys → scratch 01. Stay on Review.
   Hydrate from the 200 body. **429** `onboarding_enqueue_cap` stays on
   Review; keep the current company. Do not re-show the consent
   checkbox; body still sends `online_research_consent=true`.
4. Continue is always enabled. Skip = the same Continue with zero dwell.
5. Out → 04a (`/onboarding/interview`). 02 keeps running when an ETL run
   is in flight.

## Persist

None on this step. Change-the-business persist is 01. `localStorage`
last-step hint only (Resume). Do not keep client interview answers for
prefill after scratch (deferred).

## Fail

SSE/profile read failure: keep the token, retry, stay on this screen (or
loading placeholder). Do not create. **429** on change-the-business: stay
on Review; current company unchanged.

## Out

`/onboarding/interview` (04a). 02 still running when an ETL run
is in flight.

## Invariants

- Skip 03 does not skip required complete-gate keys (complete gate unchanged).
- Skip 03 does not stop 02.
- Continue does not POST lookup. Change-the-business is 01.
- No onboarding session status of its own (`client_interviewing` covers
  02+03+04).
