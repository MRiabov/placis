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
- Stored token restores via `GET .../profile`.
- 02 may be in flight (`in_progress` rows), or `research_wait_until` may be in
  the future.

## Must not

- Create or replace an onboarding session.
- Start or cancel 02.
- `POST .../interview/complete` or apply the website template.
- Wait for 02 to finish before Continue is enabled.
- Turn the research wait into a modal, a full-screen stop, or a disabled
  Continue.
- Define a second copy of the closed checklist (owned by [build-profile](build-profile.md)).
- Treat skip as Fail.

## Do

1. **Render** the derived checklist projection from build-profile (found vs
   missing). Conflicts never auto-picked.
2. Legal identity from the registry is shown here; the text client interview
   (04a) does not repeat those fields. 04b may still `confirm_conflict` on a
   legal row if 02 later disagrees.
3. Continue is always enabled. Skip = the same Continue with zero dwell.
4. If `research_wait_until` is in the future, show a **quiet inline wait** on
   this screen (and on 04 if they Continue): we’ll look the business up again
   then; not a modal, not a full-screen block, not a disabled Continue. Copy
   stays product language (“We’ll look the business up again in a few minutes”)
   — see [frontend.md](../frontend.md).
5. Out → 04a or 04b (`/onboarding/interview`). 02 keeps running when an ETL run
   is in flight.

## Persist

None on the server. `localStorage` last-step hint only (Resume).

## Fail

SSE/profile read failure: keep the token, retry, stay on this screen (or loading
placeholder). Do not `POST` a new onboarding session.

## Out

`/onboarding/interview` (04a or 04b). 02 still running when an ETL run is in
flight.

## Invariants

- Skip 03 does not skip required checklist rows (complete gate unchanged).
- Skip 03 does not stop 02.
- No Review POST.
- No onboarding session status of its own (`client_interviewing` covers
  02+03+04).
