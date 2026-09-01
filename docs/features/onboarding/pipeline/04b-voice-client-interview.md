# 04b — Voice client interview (out)

**Out.** Client-interview Voice as a profile writer is out
([ADR](../ADR.md) 2, 2026-08-27). Do not implement this pass. Data
entry is [04a](04a-text-client-interview.md). The onboarding assistant
is a **guide** (`tools=[]`, `/v1/onboarding/assistant/…`), not a
writer. Guide: [onboarding assistant](../assistant.md).

## Trigger

None this pass. Do not create a realtime connection as a profile
writer.

## Pre

None.

## Must not

- Implement writer tools (`obtained_information`,
  `mark_information_status`, `request_lookup`, `confirm_conflict`,
  `update_interview_plan`, `end_interview`).
- Writer DTOs.
- Persist `interview_plan_*` columns (dropped).
- Treat the guide as a profile writer.

## Do

Do not implement.

## Persist

None.

## Fail

N/A.

## Out

04a remains the only client-interview writer.

## Invariants

- Guide Voice stays in; this writer does not.
- Matching [testing/04b](testing/04b-voice-client-interview.md) does
  not run.
