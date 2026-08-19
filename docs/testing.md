# Testing

## Test types

Three tiers, and they are not interchangeable:

- **Unit** — one function/service in isolation; internal collaborators are faked. No DB, no network.
- **Integration** — asserts the API on one side, with **internal services real, not mocked**:
  **backend-only** (handler → service → sqlc → real Postgres, no frontend) or **frontend-only** (the
  frontend asserting against the API). Only Google, the LLM, voice, and Stripe are faked.
- **E2E** — **both sides real**: Playwright drives `frontend-2` against the real Go API + real
  Postgres. A full contractor/owner/website-visitor journey.

Agents must not substitute a unit test where an integration or E2E test is required — stubbing an
E2E with unit tests is a failure, not a pass.

## The rule

At least **one E2E test per feature** — a "feature" is a directory under `docs/features/`. E2E is
**full-stack**: a Playwright test drives `frontend-2` (the real UI) against the real Go API and a
real Postgres (Testcontainers), with migrations run. Only Google, the LLM, and voice are faked.
Each E2E asserts both the UI state and the DB rows. A feature does
not pass without its E2E test green.

Each feature defines its E2E test in its own `testing.md`, spelling out the exact tables read and
written at each step (names come from that feature's `data-model.md`):

- [onboarding](features/onboarding/testing.md)
- [website](features/website/testing.md)
- [ads](features/ads/ad-generation/testing.md)
- [auth](features/other/auth/testing.md)

## Notes

- **Clerk** is the one external dependency that is *not* faked: it has real testing tokens (signed
  with a test key, verifiable against the test JWKS). Use them through the real SDK — never a fake
  verifier. Fiddly to set up once, then reusable.
- **Stripe** uses test mode the same way: real SDK + test keys, no real charge.
- Fakes for Google, the LLM, Stripe, and voice live in the repo (see `ci-cd.md`); tests never
  spend money or reach production APIs.
