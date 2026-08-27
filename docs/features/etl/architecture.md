# ETL — Architecture

ETL is extract **and** transform. Extract persists raw fetches and the Google Maps listing.
Transform is business logic: it writes the business profile. Callers do not inline either step.

```text
StartRun(kinds, trigger, tenant)
  → one etl.runs row per kind (shared enqueue_id)
  → extract job per kind (fetch + listing upsert)
  → transform job per kind when extract succeeded
       → live business profile / Facebook and Instagram posts / photo classification
```

Triggers:

- **Onboarding 02** — `trigger=onboarding`. Kinds that apply for that onboarding session (Maps,
  Facebook, crawl, trade registry, …). Cap: 5 distinct `enqueue_id` per tenant per rolling 30
  minutes.
- **Monday / Wednesday / Friday** — `trigger=scheduled`. Activated tenants only. Kinds: Google
  Maps, Facebook, Instagram. Stagger tenants. Skip a kind with no key.

SSE during onboarding **reads** `etl.runs`. Postgres is authoritative. After website activation,
research conflicts show on Details (no extra CMS screen in this slice).

Packages: [`module layout`](../../general-architecture/module-layout.md),
[package boundaries](../../general-architecture/package-boundaries.md).
`internal/etl/extract/` and `internal/etl/transform/` are siblings. Root `internal/research/`
does not exist.
