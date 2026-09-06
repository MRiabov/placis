# Background jobs

Slow work runs off-request in `River` (Postgres-backed). `cmd/api` runs the
jobs in-process. The queue is the isolation, not a second container. Every
job can be retried safely (an explicit unique key). River-managed tables:
Postgres schema `jobs`. Workers live in the owning pipeline step file or
feature `jobs.go`. There is no `internal/jobs/` package.

There is no paid River workflows module and no workflow util. A **River
workflow** is the named sequence in that feature’s `jobs.md`
`## Workflows`. The worker persists the chunk, **inserts** the next
River job kind, and completes the current job in one transaction. Feature
rows (`etl.runs`, `tenant_id`) are the instance.

Named identifiers:
[docs conventions](../docs-conventions.md#named-identifiers). This file
is River conventions and the index of per-feature `jobs.md` files. Each
feature that owns a River job kind lists it there (`## Workflows` /
`## Jobs`). Overflow is `###` with a backticked River job kind under
Jobs. Do not copy a River job kind into a second `jobs.md`.

Feature `jobs.md` files:

- [Onboarding](../features/onboarding/jobs.md) — `website_activation`
- [Website](../features/website/jobs.md) — `website_generation`
- [ETL](../features/etl/jobs.md) — extract / transform + `scheduled_etl`
- [Business profile](../features/business-profile/jobs.md) —
  `reviews_ranking_for_display`
- [Ads](../features/ads/jobs.md) — `ads_generate`
- [Assistant](../features/assistant/jobs.md) —
  `assistant_thread_compaction`
- [Billing](../features/billing/jobs.md)
- [Media library](../features/other/media/jobs.md) — `describe_image`,
  `sweep_stale_media_uploads`

Crawl / Maps scrape stay in-process inside that River job kind’s extract
worker; API p90-delta during scrape:
[processes.md](../general-architecture/processes.md).
