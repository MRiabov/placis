# Onboarding — pipeline

Executable spec. Each step file uses Trigger / Pre / Must not / Do / Persist /
Fail / Out / Invariants. This README is the index: status machine, screens,
Resume, business-lookup-once, DAG. It does not retell the steps.

The contractor never waits on business research. Business lookup returns
immediately; business research fills the checklist in the background;
selecting and copying the website template starts only after the client
interview completes.
`/onboarding/preview` waits until the **home** website page has automatic
website copy generation, or the wait cap (~15s). Other website pages finish
in parallel. Then wait-end navigates to `/onboarding/preview-and-edit/`.
08 share is optional.
09 does not wait for 06 and does not require 08.

## DAG

Numbers follow what **starts first**, not the order of screens. 01 business
lookup returns → **02 business research is already running** before the
contractor sees Review.

```text
01.  find the business + online research consent
     → unactivated tenant + onboarding session; 02 starts; UI → 03
02.  business research (async) — overlaps 03 and 04a
03.  Review (frontend noop, skip expected) — extra seconds for 02 before 04
04a. text client interview (v1 writer)
04b. voice client interview — **out**; do not implement
     build the profile — concurrent persist, not a wait
05.  select then copy the website template’s pages (after client interview complete)
06.  automatic website copy generation (async; wait teaser waits until the
     home website page has copy, or the wait cap; other website pages
     finish in parallel; does not block 09)
07.  contractor copy improvement (Assistant on the website preview; five unpaid prompts; does not block 09)
08.  preview website address share (optional; reserve website prefix + preview website address; website publication + R2 strip on)
09.  website activation (pay → activate tenant; complete unpaid Assistant thread; live R2 no strip)
```

```text
01 business lookup
  ├─► 02 business research ──► build-profile (live business profile)
  └─► 03 Review (skip ok) ─► 04a ──► 05 ─► wait teaser ─► website preview
                                      │                      ├─► 07 contractor copy improvement
                                      │                      ├─► 08 share (optional)
                                      │                      └─► 09
                                      └─► 06 (async)
```

SSE (`GET /v1/onboarding-sessions/{id}/events/stream`) mirrors the DB from
business lookup through selecting and copying the website template and copy.
Postgres is
authoritative. Business research progress reads `etl.runs`.

## Onboarding session status

`created` → `client_interviewing` (confirmed; 02 + 03 + 04a) →
`selecting_and_copying_website_template` (client interview complete; 05 running)
→ `preview_and_edit` (wait-end; `/onboarding/preview-and-edit/`; 06 may still
write copy; 07 may run; 08 share is optional) → `activated`.
`select_and_copy_website_template_failed` if 05 throws. 06 failing does not
change onboarding session status. The preview website address has no token and
no TTL. The onboarding session has no `expired` status. Review (03) does not get
its own status.

## Resume

Same browser only. `localStorage` holds the onboarding session **token**
(`onboarding_sessions.token`) plus last UI step. Restore is `GET .../profile`.
The stored step is a hint; status and whether `latest/` exists win. There is no
second token and no server-side resume token.

| Onboarding session | Screen |
| --- | --- |
| No stored token | `/onboarding/find` |
| Token present, `GET .../profile` failing | stay on a loading placeholder; keep the token; retry. Do not go to Find and do not `POST` |
| `client_interviewing`, no client interview started | `/onboarding/review` (Review) |
| `client_interviewing`, interview in progress (`channel` set or an autosave exists) | `/onboarding/interview` |
| `selecting_and_copying_website_template` or `select_and_copy_website_template_failed` | `/onboarding/preview` (SSE carousel; same wait) |
| `preview_and_edit` | `/onboarding/preview-and-edit/` |
| `activated` | clear storage; `/cms/website` |

Business lookup creates the onboarding session **once** (01), when this browser
has no token. Opening Find with nothing stored must not `POST` an onboarding
session. Opening `/onboarding/find` with a stored token restores (same table as
reload); it does not submit business lookup again. Restore failure keeps the
token and retries `GET .../profile` on a loading placeholder — do not drop the
pointer and do not `POST` a replacement.

Creating a realtime connection seeds the **onboarding assistant guide** from
current step + visible fields. Live audio is the guide, not a profile writer.
Canonical detail: [frontend.md](../frontend.md), [onboarding assistant](../assistant.md). 04b writer: [04b](04b-voice-client-interview.md)
(**out**).

## Steps

- [01-find-business.md](01-find-business.md)
- [02-business-research.md](02-business-research.md)
- [03-confirm-data.md](03-confirm-data.md)
- [04a-text-client-interview.md](04a-text-client-interview.md)
- [04b-voice-client-interview.md](04b-voice-client-interview.md)
- [build-profile.md](build-profile.md)
- [05-select-and-copy-website-template.md](05-select-and-copy-website-template.md)
- [06-website-copy-generation.md](06-website-copy-generation.md)
- [07-contractor-copy-improvement.md](07-contractor-copy-improvement.md)
- [08-preview-website-address.md](08-preview-website-address.md)
- [09-website-activation.md](09-website-activation.md)

## Tests

Each step has a matching integration test in
[testing/](testing/01-find-business.md). Those tests are backend
integration (real Go + real Postgres). Prior-step rows are already in
Postgres. Assert is every table that step writes, plus the next-step
handoff in Postgres. Paid / external collaborators are faked. They do
not defer to another file with “asserts hold”. Playwright E2E is
[onboarding/testing.md](../testing.md).
