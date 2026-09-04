# ETL pipeline — tests

These are **not** Playwright. They are backend integration tests: real
Go, Testcontainers Postgres, migrations run. Go names:
`TestPipelineHappyPathEtlGoogleMaps` (and the other source stems) plus
`TestPipelineHappyPathEtlFull`. Do not require Vitest (no owner UI).
There is no Worker.

A step does not pass because a collaborator was called. It passes when
**Postgres holds the writes**. ETL has no owner HTTP; there is no
`TestHappyPath*` Route Verify.

## Contract

- **Setup** — tenant + `business_profile.business_profiles` + the
  **Starts when** details (or their absence).
- **Exercise** — the real write path (`StartRun` and/or
  `extract/<pkg>.Run` then `transform/<pkg>.Run`).
- **Verify** — `SELECT` every table this step’s Persist names. Must-not
  tables stay empty / unchanged.
- **Fail** — `insufficient_data_for_lookup` or `status=error`; prior good
  rows kept.
- **Mocked** — Maps / Facebook / Instagram / Parallel / crawl / LLM.
  Not Postgres.

One file per source / operation group:

- [ETL run kind triggers](etl-run-kind-triggers.md)
- [Google Maps](google-maps.md)
- [Facebook](facebook.md)
- [Instagram](instagram.md)
- [Website crawl](website-crawl.md)
- [Projects from source](projects.md)
- [Trade registry](trade-registry.md)
- [Web search](web-search.md)
