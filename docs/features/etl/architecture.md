# ETL — Architecture

ETL is extract **and** transform. Extract persists raw fetches and the Google
Maps listing. Transform is business logic: it writes the business profile.
Callers do not inline either step.

```text
StartRun(etl_run_kinds, trigger, tenant, force=false)
  → one etl.runs row per ETL run kind (shared enqueue_id; copy keys from the onboarding session)
  → enqueue that ETL run kind’s River job
  → extract/<etl_run_kind> chunk          # not inlined in StartRun; wait if that ETL run kind has no key yet
  → transform/<etl_run_kind> that chunk   # as it arrives; do not wait for ETL slow extract
  → repeat until that ETL run kind has no more chunks
       → live business profile / Facebook and Instagram posts / Projects / photo classification
         (etl.sources + typed junctions; Project skip on llm_source_to_project_classifications)
```

`StartRun` (in `internal/etl/run.go`) is orchestration only. It must not contain
Google Maps / Facebook / Instagram / crawl / classifier logic. Per-source
packages match [pipeline](pipeline/README.md). There is no one `Extractor` interface for every ETL
run kind (different keys and tables); dispatch is an `etl_run_kind` switch that
**calls** those packages.

`force` defaults false. Onboarding 02 and Monday / Wednesday / Friday pass
`force=false`.

Triggers:

- **Onboarding 02** — `trigger=onboarding`. ETL run kinds 02 passes are the closed list
  in [02](../onboarding/pipeline/02-business-research.md) (never `directory`,
  `review`, or `photo`). Cap: 5 distinct `enqueue_id` per tenant per rolling 30
  minutes. 02 counts first (200 + `research_wait_until` on business lookup;
  `429` on a later source change). `StartRun` counts again and inserts nothing
  if called over the cap.
- **Monday / Wednesday / Friday** — `trigger=scheduled`. Activated tenants only.
  ETL run kinds: Google Maps, Facebook, Instagram. Stagger tenants. No key →
  `status=skipped` immediately. This trigger does not use the onboarding cap.

SSE during onboarding **reads** Postgres: `etl.runs` and the live business
profile transform already wrote. Do not wait for `status=succeeded` to show ETL
fast extract results. After website activation, research conflicts show on
Details (no extra CMS screen in this slice).

ETL run kinds in one `StartRun` may start as soon as their key exists. Onboarding
Facebook / Instagram / crawl / Maps with no key yet stay pending; they do not
scrape. Web search is not instant: the first discovered `place_id` or URL
unblocks Maps / crawl extract for already-inserted runs in this enqueue. Maps
Details `website_url` and crawl `facebook.com` / Instagram links do the same for
sibling runs. That is not a new `StartRun`. After Maps, crawl, and web search
have `succeeded` / `error` / `skipped`, a social ETL run kind still missingits key becomes `skipped`.

Packages: [`module layout`](../../general-architecture/module-layout.md),
[package boundaries](../../general-architecture/package-boundaries.md).
`internal/etl/extract/` and `internal/etl/transform/` are siblings. Root
`internal/research/` does not exist.
