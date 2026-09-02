# Website pipeline — integration tests

These are **not** Playwright. They are backend integration tests: real Go,
Testcontainers Postgres, Testcontainers MinIO, migrations run. Go names:
`TestPipelineHappyPathWebsite01SelectWebsiteTemplate` (and 02–04) plus
`TestPipelineHappyPathWebsiteFull`. Do not require Vitest per step.

Worker **container** only when that step **calls** `websiteRender` /
`websitePublication` (03/04 and [worker-internal.md](worker-internal.md)).
Do not start it from the general backend job. Do not `wrangler deploy`.
Do not fake the Worker when it is in the write path.

A step does not pass because a collaborator was called. It passes when
**Postgres holds the writes** (and 03 got a website image render / 04
wrote MinIO keys).

## Contract

- **Setup** — prior pipeline step’s rows already in the DB (or the HTTP
  that produces them). Do not seed unpublished website JSON that 02 would
  have written.
- **Exercise** — the real write path (handler or River worker). Do not call
  a private copier with a fixture dump. List Method+path when the step is
  HTTP.
- **Verify** — `SELECT` every table this step’s Persist names.
  Intermediary rows (threads, generations, onboarding session status,
  look sections) and the **handoff** to the next step (the row or River
  job that step Pre reads). Must-not tables stay empty / unchanged. 03:
  website image render back; unpublished slots still tokens; no
  `website_publications` / object keys.
  04: publication rows + MinIO keys; unpublished slots still tokens.
- **Fail** — error status on the onboarding session or publication
  blocker; prior good rows kept; no next-step handoff written.
- **Mocked** — paid / external only: Google, the LLM, voice, Stripe,
  `purge_cache`. MinIO is real (Testcontainers). Not the Worker when the
  step calls it.

Worker-only DTO cases (OpenAPI 1:1 `TestHappyPathInternal…`, not
Pipeline): [worker-internal.md](worker-internal.md).

Onboarding DAG tests
([05](../../../onboarding/pipeline/testing/05-select-and-copy-website-template.md)
through
[09](../../../onboarding/pipeline/testing/09-website-activation.md))
name onboarding-owned rows **and** the website tables that step
triggers. They do not say “website N asserts hold”.

Feature tests:
[website/testing.md](../../testing.md),
[onboarding/testing.md](../../../onboarding/testing.md).
