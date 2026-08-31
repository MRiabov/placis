# Website pipeline — integration tests

These are **not** Playwright. They are backend integration tests: real Go,
real Postgres, migrations run. Only Google, the LLM, Stripe, the Worker
internal render, R2, and `purge_cache` are faked.

A step does not pass because a collaborator was called. It passes when
**Postgres holds the writes**.

## Contract

- **Setup** — prior pipeline step’s rows already in the DB (or the HTTP
  that produces them). Do not seed unpublished website JSON that 02 would
  have written.
- **Invoke** — the real write path (handler or River worker). Do not call
  a private copier with a fixture dump.
- **Assert** — `SELECT` every table this step’s Persist names. Assert
  intermediary rows (threads, generations, onboarding session status,
  look sections)
  and the **handoff** to the next step (the row or River job that step
  Pre reads). Assert Must-not tables stay empty / unchanged.
- **Fail** — error status on the onboarding session or publication
  blocker; prior good rows kept; no next-step handoff written.
- **Mocked** — paid / external only. The fake records calls; those spies
  are extra, not a substitute for the DB asserts.

Onboarding DAG tests
([05](../../../onboarding/pipeline/testing/05-select-and-copy-website-template.md)
through
[09](../../../onboarding/pipeline/testing/09-website-activation.md))
assert onboarding-owned rows **and** the website tables that step
triggers. They do not say “website N asserts hold”.

Feature Playwright E2E:
[website/testing.md](../../testing.md),
[onboarding/testing.md](../../../onboarding/testing.md).
