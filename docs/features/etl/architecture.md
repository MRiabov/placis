# ETL — Architecture

ETL is extract **and** transform. Extract persists raw fetches and the Google
Maps listing. Transform is business logic: it writes the business profile.
Callers do not inline either step.

```text
StartRun(kinds, trigger, tenant)
  → one etl.runs row per kind (shared enqueue_id)
  → enqueue that kind’s River job
  → extract/<kind> chunk          # not inlined in StartRun
  → transform/<kind> that chunk   # as it arrives; do not wait for slow extract
  → repeat until that kind has no more chunks
       → live business profile / Facebook and Instagram posts / Projects / photo classification
```

`StartRun` (in `internal/etl/run.go`) is orchestration only. It must not contain
Google Maps / Facebook / Instagram / crawl / classifier logic. Per-source
packages match [pipeline](pipeline/README.md). There is no one `Extractor` interface for every kind
(different keys and tables); dispatch is a `kind` switch that **calls** those
packages.

Triggers:

- **Onboarding 02** — `trigger=onboarding`. Kinds that apply for that onboarding
  session (Maps, Facebook, crawl, trade registry, …). Cap: 5 distinct
  `enqueue_id` per tenant per rolling 30 minutes.
- **Monday / Wednesday / Friday** — `trigger=scheduled`. Activated tenants only.
  Kinds: Google Maps, Facebook, Instagram. Stagger tenants. Skip a kind with no
  key.

SSE during onboarding **reads** Postgres: `etl.runs` and the live business
profile transform already wrote. Do not wait for `status=succeeded` to show fast
extract results. After website activation, research conflicts show on Details
(no extra CMS screen in this slice).

Kinds in one `StartRun` may start as soon as their key exists. Web search is not
instant: the first discovered `place_id` or URL unblocks Maps / crawl extract
for already-inserted runs in this enqueue. That is not a new `StartRun`.

Packages: [`module layout`](../../general-architecture/module-layout.md),
[package boundaries](../../general-architecture/package-boundaries.md).
`internal/etl/extract/` and `internal/etl/transform/` are siblings. Root
`internal/research/` does not exist.
