# ETL — Architecture

ETL is extract **and** transform. Extract persists raw fetches and the Google
Maps listing. Transform is business logic: it writes the business profile.
Callers do not inline either step. Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).

## Named identifiers

Pipeline **Do** functions (same spelling in spec, Go, and tests):

- `StartRun` — `internal/etl` (`run.go`). `bill_usage: BillUsageMode`
  (same generic spend enum as `ai`; currently `unbilled`; pass through
  to transform LLM and ETL-inserted `describe_image`)
- `extract/googlemaps.Run` —
  [Google Maps](pipeline/google-maps.md)
- `transform/googlemaps.Run` —
  [Google Maps](pipeline/google-maps.md)
- `extract/facebook.Run` — [Facebook](pipeline/facebook.md)
- `transform/facebook.Run` — [Facebook](pipeline/facebook.md)
- `extract/instagram.Run` — [Instagram](pipeline/instagram.md)
- `transform/instagram.Run` — [Instagram](pipeline/instagram.md)
- `extract/crawl.Run` — [website crawl](pipeline/website-crawl.md)
- `transform/crawl.Run` — [website crawl](pipeline/website-crawl.md)
- `extract/websearch.Run` — [web search](pipeline/web-search.md)
- `transform/websearch.Run` — [web search](pipeline/web-search.md)
- `extract/traderegistry.Run` —
  [trade registry](pipeline/trade-registry.md)
- `transform/traderegistry.Run` —
  [trade registry](pipeline/trade-registry.md)
- `transform/projects.Run` —
  [Projects from source](pipeline/projects.md)

River job kinds **call** those functions
([jobs](jobs.md)). Tables:
[persistence.md](persistence.md). `StartRun` is orchestration only (not a
pipeline step file). Transform **inserts** `describe_image`
(media library `DescribeImage`); there is no `transform/photo`.

An **ETL run kind** (`etl.runs.etl_run_kind`) starts when it has the details it
needs. Registry: [ETL run kind triggers](pipeline/etl-run-kind-triggers.md).

```text
StartRun(trigger, tenant, force=false, bill_usage=unbilled)  # onboarding: ETL run kinds; scheduled: Maps/FB/IG
  → enqueue_id; copy 01 attach + live profile details
  → for each ETL run kind that can start: insert etl.runs + **inserts** `{etl_run_kind}_extract`
  → extract/<etl_run_kind> chunk          # not inlined in StartRun
  → **inserts** `{etl_run_kind}_transform` that chunk
  → transform **inserts** the next extract when ETL slow extract chunks remain
  → new details (place_id, website_url, handles) re-check the table (same enqueue)
       → live business profile / Facebook and Instagram posts / Projects
         (etl.sources + typed junctions; Project skip on llm_source_to_project_classifications)
```

`StartRun` (in `internal/etl/run.go`) is orchestration only. It must not contain
Google Maps / Facebook / Instagram / crawl / classifier logic. Per-source
packages match [pipeline](pipeline/README.md). There is no one `Extractor`
interface for every ETL run kind (different keys and tables). Each River job
kind **calls** that package (`google_maps_listing_extract` **calls**
`extract/googlemaps.Run`). Named in
[jobs](jobs.md).

`force` defaults false. Onboarding 02 and Monday / Wednesday / Friday pass
`force=false`.

Triggers:

- **Onboarding 02** — `trigger=onboarding`. ETL run kinds:
  [ETL run kind triggers](pipeline/etl-run-kind-triggers.md) (never `directory`, `review`, or `photo`). Cap: 5
  distinct `enqueue_id` per tenant per rolling 30 minutes. 01 counts first
  (scratch 01 over the cap is **429** `onboarding_enqueue_cap`). `StartRun`
  counts again and inserts nothing if called over the cap. Same attach keys do
  not enqueue. ETL fast extract then ETL slow extract is why ETL run kinds fire
  in parallel from 01 seeds, not a job deadline.
- **Monday / Wednesday / Friday** — `trigger=scheduled`. Activated tenants
  only. ETL run kinds: Google Maps, Facebook, Instagram. Stagger tenants. No
  matching **Starts when** tuple → `status=insufficient_data_for_lookup`
  immediately. Scheduled Maps
  only if `place_id` exists (no Places Find; they may have no Google Maps
  listing). This trigger does not use the onboarding cap.
SSE during onboarding **reads** Postgres: `etl.runs` and the live business
profile transform already wrote. Do not wait for `status=succeeded` to show
ETL fast extract results. After website activation, research conflicts show on
Details (no extra CMS screen in this slice).

Insert an `etl.runs` row when that ETL run kind **starts**. Do not pre-insert
pending rows. 04a URL / handle writes are details; 04a does not enqueue.
Completing the client interview does not stop extract.

Packages: [`module layout`](../../general-architecture/module-layout.md),
[package boundaries](../../general-architecture/package-boundaries.md).
`internal/etl/extract/` and `internal/etl/transform/` are siblings. Root
`internal/research/` does not exist.
