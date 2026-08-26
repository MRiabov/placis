# Background jobs

Slow work runs off-request in `River` (Postgres-backed): AI generation, business research / ETL
runs, file processing, notifications, and export generation. `cmd/api` runs the jobs in-process.
Every job can be retried safely (an explicit key). The queue is the isolation, not a second
container.

River-managed tables for the job queue. Postgres schema `jobs`.

Onboarding 02, Details URL change, review import, and scheduled listing updates (three times
per UTC week) share [ETL](../features/other/etl/architecture.md) workers. Website activation
starts the periodic for that tenant.

Stripe webhooks enqueue work and return; see [website activation](../features/onboarding/pipeline/08-website-activation.md).
Onboarding [website copy generation](../features/onboarding/pipeline/06-website-copy-generation.md) is a River job after
applying the website template; it must not block the website preview link.
