# Onboarding — pipeline

Implemented in OnCall and `frontend-2`. The contractor never waits on research or on copy:
confirm returns immediately, research fills the checklist in the background, generation starts
only after the interview completes, and copy generation fills the draft after instantiate
without blocking the preview URL.

**Screens** (`/onboarding/find` → `/review` → `/interview` → `/preview`, then the public preview
URL, then pay):

```text
01a. find the business (country + registry and/or Google Maps, unauthenticated) + consent
     → session created; research starts in the background
02a. research (async, parallel slots, SSE progress) — overlaps review + interview
02b. review the checklist, then interview (fill gaps) — text and/or voice, same profile
03.  build the profile (continuous merge as sources and answers arrive — not a wait step)
04.  generate (after interview complete): one LLM blueprint/style pick, then deterministic draft
05.  copy generation (async): write headlines/body/CTAs/SEO into the draft; does not block preview
06.  preview (signed token, public preview URL) — issued as soon as 04 finishes
07.  claim (pay → activate tenant; site stays a draft until they publish)
```

SSE (`GET /api/v1/onboarding-sessions/{id}/events/stream`) mirrors the DB from confirm through
generate and copy — not only step 06. Postgres is authoritative.

## Session status

`created` (session exists) → `interviewing` (confirmed; research + review + interview) →
`generating` (interview complete; 04 running) → `previewing` (package ready; 05 may still be
writing copy) → `claimed`. `generation_failed` if 04 throws. 05 failing does not change session
status. Preview **packages** expire (`expires_at`); the session has no `expired` status.

## Resume

The frontend stores the session id and step in `localStorage` and restores with
`GET .../profile`. If `active_preview_package` exists, resume on preview. There is no server-side
resume token.

## Steps

- [01a-find-business.md](01a-find-business.md)
- [02a-research.md](02a-research.md)
- [02b-interview.md](02b-interview.md)
- [03-build-profile.md](03-build-profile.md)
- [04-generate.md](04-generate.md)
- [05-refine.md](05-refine.md)
- [06-preview.md](06-preview.md)
- [07-claim.md](07-claim.md)

## Tests

Each step has a matching integration test in [testing/](testing/01a-find-business.md).
