# ETL jobs

Conventions and index: [jobs](../../infrastructure/jobs.md). Named
identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers). Closed
`## Workflows` and `## Jobs`. Overflow is `###` with a backticked River
job kind under Jobs.

ETL workflow names are the [ETL run kind](../../glossary.md) values.
Each is extract-to-raw then transform-to-profile, per chunk, same
`etl.runs.id`. `StartRun` **inserts** that ETL run kind’s extract River
job kind. The extract worker **inserts** transform; transform
**inserts** the next extract when ETL slow extract chunks remain. Sources
fire in parallel (one `etl.runs` row per ETL run kind). Photo
classification and Projects are not workflows; transform **calls** those
packages. Transform **inserts** `describe_image`
([media library jobs](../other/media/jobs.md)).

`scheduled_etl` **calls** `StartRun(trigger=scheduled)`, which
**inserts** the extract River job kind that can start. It is not an
extract/transform step.

Crawl / Maps scrape stay in-process inside that River job kind’s extract
worker; API p90-delta during scrape:
[processes.md](../../general-architecture/processes.md).

Extract **must not** write `business_profile_*`. Transform **must not**
call source networks. Retry of this `run_id` reuses a fetch that already
landed for that chunk. Transform skip is `algorithm` +
`schema_revision`.

After a scheduled run **succeeds** and new `in_pool` rows landed,
**inserts** `reviews_ranking_for_display` **once** (not per chunk):
[business profile jobs](../business-profile/jobs.md).

## Workflows

| Workflow | Steps |
| --- | --- |
| `google_maps_listing` | `google_maps_listing_extract`, `google_maps_listing_transform` |
| `web_search` | `web_search_extract`, `web_search_transform` |
| `website_crawl` | `website_crawl_extract`, `website_crawl_transform` |
| `facebook` | `facebook_extract`, `facebook_transform` |
| `instagram` | `instagram_extract`, `instagram_transform` |
| `trade_registry` | `trade_registry_extract`, `trade_registry_transform` |
| `scheduled_etl` | `scheduled_etl` |

## Jobs

| River job kind | Args | Unique key | Do |
| --- | --- | --- | --- |
| `google_maps_listing_extract` | `run_id` | `run_id` while pending/running | **calls** `extract/googlemaps.Run` |
| `google_maps_listing_transform` | `run_id` | `run_id` while pending/running | **calls** `transform/googlemaps.Run` |
| `web_search_extract` | `run_id` | `run_id` while pending/running | **calls** `extract/websearch.Run` |
| `web_search_transform` | `run_id` | `run_id` while pending/running | **calls** `transform/websearch.Run` |
| `website_crawl_extract` | `run_id` | `run_id` while pending/running | **calls** `extract/crawl.Run` |
| `website_crawl_transform` | `run_id` | `run_id` while pending/running | **calls** `transform/crawl.Run` |
| `facebook_extract` | `run_id` | `run_id` while pending/running | **calls** `extract/facebook.Run` |
| `facebook_transform` | `run_id` | `run_id` while pending/running | **calls** `transform/facebook.Run` |
| `instagram_extract` | `run_id` | `run_id` while pending/running | **calls** `extract/instagram.Run` |
| `instagram_transform` | `run_id` | `run_id` while pending/running | **calls** `transform/instagram.Run` |
| `trade_registry_extract` | `run_id` | `run_id` while pending/running | **calls** `extract/traderegistry.Run` |
| `trade_registry_transform` | `run_id` | `run_id` while pending/running | **calls** `transform/traderegistry.Run` |
| `scheduled_etl` | none | `tenant_id` while pending/running | **calls** `StartRun(trigger=scheduled)` |

### `scheduled_etl`

Worker: `internal/etl/jobs.go`. Monday / Wednesday / Friday. Stagger
activated tenants. **Calls**
`StartRun(trigger=scheduled)` ([ETL](README.md)). Does not inline
extract.
