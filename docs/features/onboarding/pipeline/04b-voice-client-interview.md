# 04b — Voice client interview

Voice writer into the same fold as 04a. Default surface in `frontend-2`. Client interview only —
website assistant / CMS voice stay in [voice-agent.md](../../../general-architecture/voice-agent.md)
(transport) and website docs.

## Trigger

Contractor is on `/onboarding/interview` with `channel=voice`. Mint a realtime connection. Tools
write the profile. `end_interview` then `POST .../interview/complete`.

## Pre

- `status=client_interviewing`.
- 03 may have been skipped.
- Checklist, remaining questions, complete gate: [build-profile](build-profile.md).

## Must not

- Replay the transcript on mint.
- Mint a blank interview.
- `POST` a new onboarding session if mint fails.
- `end_interview` while required rows are `empty` / `in_progress` / `conflict`.
- Complete twice (XOR with 04a).
- Specify Parallel/jobs/photo classification.
- Sketch website-assistant / CMS voice here.

## Do

1. Set `channel=voice`.
2. **Mint** — seed: fold, build-profile checklist projection, extra notes, last
   `update_interview_plan`. Remaining questions = required rows in `empty` | `conflict` |
   `needs_confirmation` | `in_progress`, checklist order. `in_progress` is still a remaining
   question (02 may fill it while they talk).
3. **Tools** (same profile path as 04a): `obtained_information`, `mark_information_status`,
   `request_lookup`, `confirm_conflict`, `update_interview_plan`, `end_interview`.
   Last `update_interview_plan` lands on `onboarding_sessions` (`interview_plan_markdown`,
   `interview_plan_completed`, `interview_plan_next_questions`). Remaining questions for a
   **new** mint are derived from the checklist projection; do not treat the stored plan as
   authority over the checklist.
4. `end_interview` iff the same complete gate as 04a; then `interview/complete` → 05.

Transport: [voice-agent.md](../../../general-architecture/voice-agent.md) only.

## Persist

Same as 04a plus `channel=voice` and last `interview_plan_*` if `update_interview_plan` ran.

## Fail

Mint failure keeps the token; retry mint; no new `POST` onboarding session. Invalid tool call
rejected; fold unchanged.

## Out

Gate pass → 05. Resume: token; mint again from fold + checklist (not transcript).

## Invariants

- New realtime connection is not a blank client interview.
- Same complete path as 04a.
- Skip 03 does not relax the gate.
