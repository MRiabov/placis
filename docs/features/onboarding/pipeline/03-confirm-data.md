# 03 — Review

Frontend noop. Today’s `/onboarding/review`. Not a required gate.
**Skip is expected.** The only product job is extra wall-clock for 02 before the
client interview. Lingering is optional; skip is the normal fast path.

01 business lookup is not this step. This step does not `POST` an onboarding
session.

## Trigger

01 Out navigates here. Resume with `client_interviewing` and no client interview
started (`channel` unset, no autosave) also lands here.

## Pre

- Onboarding session `status=client_interviewing`.
- Stored token restores via `GET /v1/onboarding/profile`.
- 02 may be in flight (`in_progress` rows).

## Must not

- Create or replace an onboarding session.
- Start or cancel 02.
- `POST /v1/onboarding/interview/complete` or select and copy the website
  template.
- Wait for 02 to finish before Continue is enabled.
- A research-wait modal, full-screen stop, or disabled Continue.
- Define a second copy of the complete-gate keys (owned by [build-profile](build-profile.md)).
- Treat skip as Fail.

## Do

1. **Render** found vs missing from build-profile fill status. Conflicts never
   auto-picked; the contractor edits the field on 04a (`algorithm=human`).
2. Legal identity from the registry is shown here; the text client interview
   (04a) does not repeat those fields.
3. Continue is always enabled. Skip = the same Continue with zero dwell.
4. Out → 04a (`/onboarding/interview`). 02 keeps running when an ETL run
   is in flight.

## Persist

None on the server. `localStorage` last-step hint only (Resume).

## Fail

SSE/profile read failure: keep the token, retry, stay on this screen (or loading
placeholder). Do not `POST` a new onboarding session.

## Out

`/onboarding/interview` (04a). 02 still running when an ETL run is in
flight.

## Invariants

- Skip 03 does not skip required complete-gate keys (complete gate unchanged).
- Skip 03 does not stop 02.
- No Review POST.
- No onboarding session status of its own (`client_interviewing` covers
  02+03+04).
