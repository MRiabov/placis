# 04a — Text client interview

v1 writer into the live business profile. Channel is `text`. Voice writer
([04b](04b-voice-client-interview.md)) is **out** — do not implement it this pass.

## Trigger

Contractor is on `/onboarding/interview` with `onboarding_sessions.channel=text`
(setting this unsets voice as the active writer). Click-off:
`PUT /v1/onboarding/interview`. Continue:
`POST /v1/onboarding/interview/complete`.

## Pre

- `status=client_interviewing`.
- 03 may have been skipped.
- Complete gate: [build-profile](build-profile.md).

## Must not

- Voice realtime connection, realtime tools, transcript replay.
- Parallel / research jobs (`DescribeImage` is the media library, not
  this interview). The onboarding **guide** does not Archive or edit
  Project cards (`tools=[]`).
- Edit title / description / cover on interview Project cards. No Approve.
  Archive is the contractor click below, not `/v1/projects/{id}/archive`.
- `POST` a new onboarding session on Resume.
- Complete while required keys are `empty` / `in_progress` /
  `conflict`.
- Run a second complete (exactly one complete → 05).
- Repeat registry legal identity (`legal_name`, `company_number`,
  `registered_office` — shown on 03 Review). VAT is not registry-won;
  interview writes `vat_registration_status` / `vat_number`.
- A parallel onboarding-only control for a Details field (services textarea,
  free-text service area, a second hours picker). Onboarding Details ==
  `/cms/details`.
- Combine services or service areas with an LLM in the wait after Continue. 06
  does not invent the service list.
- Overwrite a control the contractor is editing or has already saved
  (`algorithm=human`, or dirty on this visit and not yet autosaved). Live fill
  is empty / enrich only ([Do — live fill](#do--live-fill-while-02-runs)).

## Do

`SaveTextClientInterview` persists click-off. `CompleteClientInterview`
is Continue (submit): optional last answers, complete gate, **inserts**
`select_and_copy_website_template`.

1. Set `channel=text`. Do not switch to a voice writer this pass; do not
   complete twice.
2. Click-off writes `business_profile_edits` for the fields this save set, plus
   `client_interview_submissions` `submission_kind=autosave` (interview-only:
   extra notes). Photo uploads use the onboarding media library wrapper
   ([api](../api.md)), not this body.
3. Fields: **Details == `/cms/details`** (identity, contact and presence,
   services, service areas, opening hours, VAT — same controls and writes). Do
   not repeat registry legal identity from 03. VAT uses the Details legal
   controls already on `/cms/details`. Plus interview-only: contact name;
   found photos in the media library plus **Upload photos**
   (always available; complete does not require photos); certifications (company
   registry pick locks that business-registry certification) / found reviews;
   **Projects** if nested `profile.projects` is non-empty (ranked top 4
   `active` business research origin; [build-profile](build-profile.md)) —
   same look as `/cms/projects` (cover from `cover_media_asset_id`, title,
   description), no Project draft badge, not editable, **Archive** on the card
   (`POST /v1/onboarding/projects/{projectId}/archive` returns
   `OnboardingProfileRead`). Zero `active` → omit the whole block.
   Cards may appear / reorder over SSE while 02 business research is still
   running. Extra notes.
   Paste of one-per-line or comma-separated **service names** may split into
   rows deterministically (no LLM). Do not ask a photos-choice question. Do not
   offer Find more online / Create a stand-in. Complete does not inspect photo
   count (the no-photos warning is frontend-only).
4. While they stay on this screen, apply [live fill](#do--live-fill-while-02-runs) from the onboarding session
   SSE (Postgres is authoritative). Photos are not on that event — re-GET
   `/v1/onboarding/media-assets` on enter, resume, and each `business_profile`
   event. Project cards are on `OnboardingLiveBusinessProfileRead.projects`.
5. `POST /v1/onboarding/interview/complete` (optional last dirty answers on
   the same body) iff the complete gate (service and service-area list rows
   present, or skipped). May persist `submission_kind=final`. One hop — not
   PUT-then-POST.
6. Contractor may mark a required row `skipped` in this step, then complete.

## Do — live fill (while 02 runs)

Business research writes the live business profile as chunks land
([02](02-business-research.md), [build-profile](build-profile.md)). The client
interview **shows** those writes so they do not fill a gap research already
closed. Same SSE as Review; this screen is also a consumer.

- **Untouched scalar / whole control** (trade, description, marketing phone,
  marketing email, existing site URL, founder, hours they have not
  edited): if empty and winning `algorithm` is not `human`, paint the live
  value. A control they typed into this visit (dirty, even before autosave)
  or already autosaved as `human` does not change.
- **Enrichable lists** — insert new rows; do not delete contractor rows; do
  not rewrite a row they edited:
  services and service areas (new names / localities they have not entered);
  opening-hours days still empty; certifications they did not `removed`;
  reviews; media library photos (re-GET `/v1/onboarding/media-assets`);
  Projects on the nested live profile (ranked top 4, Archive stays
  archived). A `source_id` that already has a yes verdict does not add a
  second Project (ETL skip).
- Extra notes are contractor-only. `emergency_phone` is a Details
  Contact field; business research does not write it.
- Research conflict on a field they already saved stays a conflict (show
  both); do not silently take the research value.

## Persist

`client_interview_submissions`; `business_profile_edits` via build-profile;
`onboarding_sessions.channel=text`; interview Archive on Projects. Complete →
`accepted_edit_id=last_edit_id`, status
`selecting_and_copying_website_template`, enqueue 05.

## Fail

Save fail keeps the token. Complete rejected if the gate fails; stay
`client_interviewing`.

## Out

Gate pass → 05. 02 may still be running on this screen; live fill continues
until complete. After complete, later 02 writes are new edits after
`accepted_edit_id` (they do not rewrite the 05 gallery).

## Invariants

- Skip 03 does not relax the complete gate.
- Complete path is `POST /v1/onboarding/interview/complete` ([build-profile](build-profile.md)).
- Applying the website template never reads a transcript.
- Services and service areas are structured Details rows at complete; the wait
  does not combine them with an LLM.
- Onboarding Details == `/cms/details` for those fields.
- Live fill never overwrites a dirty or `human` control; lists only enrich.
