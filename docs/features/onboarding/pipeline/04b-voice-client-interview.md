# 04b — Voice client interview

Voice writer into the same live business profile as 04a. Listed; first-pass is text (04a). Client interview only —
website assistant / CMS voice stay in [voice-agent.md](../../../general-architecture/voice-agent.md)
(transport) and website docs.

## Trigger

Contractor is on `/onboarding/interview` with `channel=voice`. Create a realtime connection. Tools
write the profile. `end_interview` then `POST .../interview/complete`.

## Pre

- `status=client_interviewing`.
- 03 may have been skipped.
- Checklist, remaining questions, complete gate: [build-profile](build-profile.md).

## Must not

- Replay the transcript when creating the realtime connection.
- Create a blank interview.
- `POST` a new onboarding session if creating the realtime connection fails.
- `end_interview` while required rows are `empty` / `in_progress` / `conflict`.
- Complete twice (XOR with 04a).
- Specify Parallel / jobs / photo classification (photo kinds are ETL transform).
- Sketch website-assistant / CMS voice here.

## Do

1. Set `channel=voice`.
2. **Create the realtime connection** — seed: live business profile, build-profile checklist projection, extra notes, last
   `update_interview_plan`. Remaining questions = required rows in `empty` | `conflict` |
   `needs_confirmation` | `in_progress`, checklist order. `in_progress` is still a remaining
   question (ETL transform may fill it while they talk).
3. **Tools** (same profile path as 04a): `obtained_information`, `mark_information_status`,
   `request_lookup`, `confirm_conflict`, `update_interview_plan`, `end_interview`.
   Last `update_interview_plan` lands on `onboarding_sessions` (`interview_plan_markdown`,
   `interview_plan_completed`, `interview_plan_next_questions`). Remaining questions for a
   **new** realtime connection are derived from the checklist projection; do not treat the stored plan as
   authority over the checklist.
4. `end_interview` iff the same complete gate as 04a; then `interview/complete` → 05.

Transport: [voice-agent.md](../../../general-architecture/voice-agent.md) only.

## Persist

Same as 04a plus `channel=voice` and last `interview_plan_*` if `update_interview_plan` ran.

## Fail

If creating the realtime connection fails, keep the token; retry creating it; no new `POST`
onboarding session. Invalid tool call rejected; live business profile unchanged.

## Out

Gate pass → 05. Resume: token; create the realtime connection again from live business profile + checklist (not
transcript).

## Invariants

- New realtime connection is not a blank client interview.
- Same complete path as 04a.
- Skip 03 does not relax the gate.
