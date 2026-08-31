# ETL — Architecture

ETL is extract **and** transform. Extract persists raw fetches and the Google
Maps listing. Transform is business logic: it writes the business profile.
Callers do not inline either step.

Means start when an **input set** of **identity keys** is met. Registry:
[means](pipeline/means.md).

```text
StartRun(trigger, tenant, force=false)  # onboarding: means set; scheduled: Maps/FB/IG
  → enqueue_id; copy identity keys (Find attach + live profile)
  → for each means whose input set is met: insert etl.runs + enqueue River job
  → extract/<etl_run_kind> chunk          # not inlined in StartRun
  → transform/<etl_run_kind> that chunk   # as it arrives; do not wait for ETL slow extract
  → new identity keys (place_id, website_url, handles) re-check the registry (same enqueue)
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

- **Onboarding 02** — `trigger=onboarding`. Means set: [means registry](pipeline/means.md) (never
  `directory`, `review`, or `photo`). Cap: 5 distinct `enqueue_id` per tenant
  per rolling 30 minutes. 02 counts first (200 + `research_wait_until` on
  business lookup; `429` on a later source change). `StartRun` counts again and
  inserts nothing if called over the cap. The ~60s client-interview window is
  why means fire in parallel from 01 seeds, not a job deadline.
- **Monday / Wednesday / Friday** — `trigger=scheduled`. Activated tenants only.
  Means: Google Maps, Facebook, Instagram. Stagger tenants. Input set unmet →
  `status=skipped` immediately. This trigger does not use the onboarding cap.

SSE during onboarding **reads** Postgres: `etl.runs` and the live business
profile transform already wrote. Do not wait for `status=succeeded` to show ETL
fast extract results. After website activation, research conflicts show on
Details (no extra CMS screen in this slice).

Insert an `etl.runs` row when that means **starts**. Do not pre-insert pending
rows for unmet input sets. 04a URL / handle writes are identity keys; 04a does
not enqueue. Completing the client interview does not stop extract.

Packages: [`module layout`](../../general-architecture/module-layout.md),
[package boundaries](../../general-architecture/package-boundaries.md).
`internal/etl/extract/` and `internal/etl/transform/` are siblings. Root
`internal/research/` does not exist.
