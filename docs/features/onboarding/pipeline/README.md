# Onboarding — pipeline

Executable spec. Each step file uses Trigger / Pre / Must not / Do / Persist / Fail / Out /
Invariants. This README is the index: status machine, screens, Resume, business-lookup-once, DAG. It does
not retell the steps.

The contractor never waits on business research or on copy. Business lookup returns immediately; business
research fills the checklist in the background; applying the website template starts only after
the client interview completes; website copy generation fills the unpublished website after that
without blocking the website preview link.

## DAG

Numbers follow what **starts first**, not the order of screens. 01 business lookup returns → **02
business research is already running** before the contractor sees Review.

```text
01.  find the business + online research consent
     → unactivated tenant + onboarding session; 02 starts; UI → 03
02.  business research (async) — overlaps 03 and 04a/04b
03.  Review (frontend noop, skip expected) — extra seconds for 02 before 04
04a. text client interview
04b. voice client interview
     build the profile — concurrent persist, not a wait
05.  apply the website template (after client interview complete)
06.  website copy generation (async; does not block 07 or 08)
07.  website preview (website preview link)
08.  website activation (pay → activate tenant; unpublished until website publication)
```

```text
01 business lookup
  ├─► 02 business research ──► build-profile (fold)
  └─► 03 Review (skip ok) ─► 04a XOR 04b ──► 05 ─► 07 ─► 08
                                      │              └─► 06 (async)
                                      └─► build-profile
```

SSE (`GET /v1/onboarding-sessions/{id}/events/stream`) mirrors the DB from business lookup through
applying the website template and copy. Postgres is authoritative.

## Onboarding session status

`created` → `client_interviewing` (after business lookup; 02 + 03 + 04a/04b) → `applying_website_template`
(client interview complete; 05 running) → `previewing` (website preview ready; 06 may still write
copy) → `activated`.
`apply_website_template_failed` if 05 throws.
06 failing does not change onboarding session status. The website preview link has no TTL; 410
only when the token is unknown, superseded, or already activated. The onboarding session has no
`expired` status. Review (03) does not get its own status.

## Resume

Same browser only. `localStorage` holds the onboarding session **token**
(`onboarding_sessions.token`) plus last UI step. Restore is `GET .../profile`. The stored step is
a hint; status and `active_website_preview` win. There is no second token and no server-side
resume token.

| Onboarding session | Screen |
| --- | --- |
| No stored token | `/onboarding/find` |
| Token present, `GET .../profile` failing | stay on a loading placeholder; keep the token; retry. Do not go to Find and do not `POST` |
| `client_interviewing`, no client interview started | `/onboarding/review` (Review) |
| `client_interviewing`, interview in progress (`channel` set or an autosave exists) | `/onboarding/interview` |
| `applying_website_template` or `apply_website_template_failed` | short progress screen in `frontend-2` |
| `previewing` / active website preview | `/preview/{token}/` on the contractor website; the website preview link still works without `localStorage` |
| `activated` | clear storage; `/cms/website` |

Business lookup creates the onboarding session **once** (01), when this browser has no token. Opening Find
with nothing stored must not `POST` an onboarding session. Opening `/onboarding/find` with a stored
token restores (same table as reload); it does not submit business lookup again. Restore failure keeps the token
and retries `GET .../profile` on a loading placeholder — do not drop the pointer and do not `POST`
a replacement.

Voice minting seeds the new realtime connection from the profile fold, checklist projection, extra
notes, and last `update_interview_plan`. Live audio is gone; structured answers are not. Canonical
detail: [frontend.md](../frontend.md), [04b](04b-voice-client-interview.md).

## Steps

- [01-find-business.md](01-find-business.md)
- [02-business-research.md](02-business-research.md)
- [03-confirm-data.md](03-confirm-data.md)
- [04a-text-client-interview.md](04a-text-client-interview.md)
- [04b-voice-client-interview.md](04b-voice-client-interview.md)
- [build-profile.md](build-profile.md)
- [05-apply-website-template.md](05-apply-website-template.md)
- [06-website-copy-generation.md](06-website-copy-generation.md)
- [07-website-preview.md](07-website-preview.md)
- [08-website-activation.md](08-website-activation.md)

## Tests

Each step has a matching integration test in [testing/](testing/01-find-business.md).
