# 04a — Text client interview

v1 writer into the live business profile. Channel is `text`. Voice writer
([04b](04b-voice-client-interview.md)) is **out** — do not implement it this pass.

## Trigger

Contractor is on `/onboarding/interview` with `onboarding_sessions.channel=text`
(setting this unsets voice as the active writer). Autosave:
`PUT .../text-interview/autosave`. Final: `POST .../text-interview/submissions`
then `POST .../interview/complete`.

## Pre

- `status=client_interviewing`.
- 03 may have been skipped.
- Checklist and complete gate: [build-profile](build-profile.md).

## Must not

- Voice realtime connection, realtime tools, transcript replay.
- Parallel / research jobs / photo classification (photo kinds are ETL
  transform).
- `POST` a new onboarding session on Resume.
- Complete while required checklist rows are `empty` / `in_progress` /
  `conflict`.
- Run a second complete (exactly one complete → 05).
- Repeat legal-identity fields (shown on 03).
- A parallel onboarding-only widget for a Details field (services textarea,
  free-text service area, a second hours picker). Onboarding Details ==
  `/cms/details`.
- Combine services or service areas with an LLM in the wait after Continue. 06
  does not invent the service list.

## Do

1. Set `channel=text`. Do not switch to a voice writer this pass; do not
   complete twice.
2. Autosave writes `business_profile_edits` for the fields this save set, plus
   `client_interview_submissions` `kind=autosave` (interview-only: photo
   uploads, optional source-from-internet / AI photo when there are not enough
   photos, reviews unavailable, extra notes).
3. Fields: **Details == `/cms/details`** (identity, contact and presence,
   services, service areas, opening hours — same controls and writes). Do not
   repeat legal identity from 03. Plus interview-only: contact name,
   `emergency_phone`; found photos in the media library plus upload (source from
   the internet / AI photo only if there are not enough); certifications
   (company registry pick locks that business-registry certification) / found
   reviews; extra notes. Paste of one-per-line or comma-separated **service
   names** may split into rows deterministically (no LLM). Do not ask a
   photos-choice question.
4. Final submission `kind=final`, then `POST .../interview/complete` iff the
   complete gate (service and service-area list rows present, or skipped).
5. Contractor may mark a required row `skipped` in this step, then complete.

## Persist

`client_interview_submissions`; `business_profile_edits` via build-profile;
`onboarding_sessions.channel=text`. Complete → `accepted_edit_id=last_edit_id`,
status `applying_website_template`, enqueue 05.

## Fail

Autosave fail keeps the token. Complete rejected if the gate fails; stay
`client_interviewing`.

## Out

Gate pass → 05. 02 may still be running; later 02 writes are new edits after
`accepted_edit_id`.

## Invariants

- Skip 03 does not relax the complete gate.
- Complete path is `POST .../interview/complete` ([build-profile](build-profile.md)).
- Applying the website template never reads a transcript.
- Services and service areas are structured Details rows at complete; the wait
  does not combine them with an LLM.
- Onboarding Details == `/cms/details` for those fields.
