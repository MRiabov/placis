# Sep 3 issue list — Onboarding

Reclassified 2026-09-03 against [ADR.md](ADR.md) and
[../assistant/ADR.md](../assistant/ADR.md). Not a drop list. Bold
numbers are original audit ids (not compacted). Fix the cited spec,
then delete the item. Delete this file when empty.

Later dated ADR / design decision is source of truth. Missing reader is
usually a **doc gap**, not a drop.

## Keep (ADR)

- **12. `channel` stays (04b Voice client interview out tombstone)**
  Comment: [ADR.md](ADR.md) 2: voice is a channel; 04b writer is out.
  `assistant.md` already says the column stays. Resume uses `channel`
  unset vs `text`. Keep the `voice` enum value as the 04b tombstone.

- **17. `visible_fields` on the guide realtime connection**
  Comment: [ADR.md](ADR.md) 14 seeds current step + visible fields.
  That is the guide (no writer tools). Keep `step` and
  `visible_fields`.

## False alarms (closed)

- **10. Two website preview routes** — ADR 21 and design decision 13:
  wait teaser then `/onboarding/preview-and-edit/`. Do not merge them.

## Keep (scope)

- Core loop 01–09. 04b Voice client interview files as **out**
  tombstones.
- Complete gate, research conflicts, derived fill status.
- Unpaid website editor as a policy wrapper.
- Stripe: checkout POST, status GET, signed webhook.
- `POST /v1/onboarding/projects/{projectId}/archive`.
