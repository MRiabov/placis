# Background jobs

Slow work runs off-request in `River` (Postgres-backed): AI generation, business research, file
processing, notifications, and export generation. `cmd/worker` runs the jobs. Every job can be
retried safely (an explicit key).

River-managed tables for the job queue.

Stripe webhooks enqueue work and return; see [claim](../features/onboarding/pipeline/07-claim.md).
Onboarding [copy generation](../features/onboarding/pipeline/05-refine.md) is a River job after
instantiate; it must not block the preview URL.
