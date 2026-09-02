# Onboarding pipeline — integration tests

These are **not** Playwright. They are backend integration tests: real
Go, Testcontainers Postgres, Testcontainers MinIO, migrations run. Go
names: `TestPipelineHappyPathOnboarding01FindBusiness` (and 02, 04a,
build-profile, 05–09) plus `TestPipelineHappyPathOnboardingFull`. Skip
**Do not run** (`04b`). Skip Persist none (`03`). Do not require Vitest
per step.

Worker **container** only when that step **calls** `websiteRender` /
`websitePublication` (06/08/09). Do not start it from the general
backend job. Do not `wrangler deploy`. Do not fake the Worker when it
is in the write path.

A step does not pass because a collaborator was called. It passes when
**Postgres holds the writes** (and 06 got a website image render / 08/09
wrote MinIO keys). Route HappyPath (`TestHappyPath*`) Verify through
HTTP lives in [onboarding testing.md](../../testing.md).

## Contract

- **Setup** — prior pipeline step’s rows already in the DB (or the HTTP
  that produces them).
- **Exercise** — the real write path (handler or River worker). Do not
  call a private copier with a fixture dump. List Method+path when the
  step is HTTP.
- **Verify** — `SELECT` every table this step’s Persist names.
  Intermediary rows and the **handoff** to the next step. Must-not
  tables stay empty / unchanged.
- **Fail** — error status on the onboarding session; prior good rows
  kept; no next-step handoff written.
- **Mocked** — paid / external only: Google, registry, Facebook, crawl,
  the LLM, Stripe, `purge_cache`. MinIO is real (Testcontainers). Not
  the Worker when the step calls it.

05–09 name onboarding-owned rows **and** the website tables that step
triggers. They do not say “website N asserts hold”.

Feature tests: [onboarding/testing.md](../../testing.md).
