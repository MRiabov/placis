# Ads pipeline — integration tests

These are **not** Playwright. They are backend integration tests: real
Go, Testcontainers Postgres, Testcontainers MinIO, migrations run. Go
names:
`TestPipelineHappyPathAds01CreateAd` (and 02–04) plus
`TestPipelineHappyPathAdsFull`. Do not require Vitest per step. Only the
LLM and ad platforms are faked. There is no Worker.

A step does not pass because a collaborator was called. It passes when
**Postgres holds the writes**.

## Contract

- **Setup** — prior pipeline step’s rows already in the DB (or the HTTP
  that produces them).
- **Exercise** — the real write path (handler or River worker).
- **Verify** — `SELECT` every table this step’s Persist names. Must-not
  tables stay empty / unchanged. The handoff the next step Pre reads.
- **Fail** — error status; prior good rows kept; no next-step handoff
  written.
- **Mocked** — LLM, ad platforms. MinIO is real (Testcontainers). Not
  Postgres.

Feature Playwright E2E: [ads testing.md](../testing.md).
