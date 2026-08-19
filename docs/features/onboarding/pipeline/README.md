# Onboarding — pipeline

Implemented in the predecessor (`OnCall`) and `frontend-2`. The contractor never waits on
business research or on copy: confirm returns immediately, business research fills the checklist
in the background, applying the website template starts only after the client interview
completes, and website copy generation fills the unpublished website after that without blocking
the website preview link.

**Screens** (`/onboarding/find` → `/review` → `/interview` → `/preview`, then the website preview
URL, then pay):

```text
01a. find the business (country + company registry and/or Google Maps, unauthenticated) + online research consent
     → onboarding session created; business research starts in the background
02a. business research (async, parallel slots, SSE progress) — overlaps review + client interview
02b. review the checklist, then client interview (fill gaps) — text and/or voice, same profile
03.  build the profile (continuous merge as sources and answers arrive — not a wait step)
04.  apply the website template (after client interview complete): one LLM website template/website styles pick, then unpublished website with placeholders
05.  website copy generation (async): write headlines/body/CTAs/SEO into the unpublished website; does not block the website preview
06.  website preview (website preview link) — issued as soon as 04 finishes
07.  website activation (pay → activate tenant; site stays an unpublished website until website publication)
```

SSE (`GET /api/v1/onboarding-sessions/{id}/events/stream`) mirrors the DB from confirm through
applying the website template and copy — not only step 06. Postgres is authoritative.

## Onboarding session status

`created` (onboarding session exists) → `client_interviewing` (confirmed; business research + review +
client interview) → `applying_website_template` (client interview complete; 04 running)
→ `previewing` (website preview ready; 05 may still be writing copy) → `activated`.
`apply_website_template_failed` if 04 throws.
05
failing does not change onboarding session status. Website previews expire (`expires_at`); the
onboarding session has no `expired` status.

## Resume

The frontend stores the onboarding session id and step in `localStorage` and restores with
`GET .../profile`. If `active_website_preview` exists, resume on the website preview. There is no
server-side resume token.

## Steps

- [01a-find-business.md](01a-find-business.md)
- [02a-business-research.md](02a-business-research.md)
- [02b-client-interview.md](02b-client-interview.md)
- [03-build-profile.md](03-build-profile.md)
- [04-apply-website-template.md](04-apply-website-template.md)
- [05-website-copy-generation.md](05-website-copy-generation.md)
- [06-website-preview.md](06-website-preview.md)
- [07-website-activation.md](07-website-activation.md)

## Tests

Each step has a matching integration test in [testing/](testing/01a-find-business.md).
