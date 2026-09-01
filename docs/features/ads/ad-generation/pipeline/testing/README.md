# Ads pipeline — integration tests

These are **not** Playwright. They are backend integration tests: real
Go, real Postgres, migrations run. Only the LLM and ad platforms are
faked. There is no Worker.

A step does not pass because a collaborator was called. It passes when
**Postgres holds the writes**.

## Contract

- **Setup** — prior pipeline step’s rows already in the DB (or the HTTP
  that produces them).
- **Invoke** — the real write path (handler or River worker).
- **Assert** — `SELECT` every table this step’s Persist names. Assert
  Must-not tables stay empty / unchanged. Assert the handoff the next
  step Pre reads.
- **Fail** — error status; prior good rows kept; no next-step handoff
  written.
- **Mocked** — LLM, ad platforms. Not Postgres.

Feature Playwright E2E: [ads testing.md](../testing.md).
