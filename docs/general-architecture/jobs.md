# Background jobs

Slow work runs off-request in `River` (Postgres-backed): AI generation, business research, file
processing, notifications, and export generation. `cmd/worker` runs the jobs. Every job can be
retried safely (an explicit key).

River-managed tables for the job queue.

Stripe webhooks enqueue work and return; see [website activation](../features/onboarding/pipeline/07-website-activation.md).
Onboarding [website copy generation](../features/onboarding/pipeline/05-website-copy-generation.md) is a River job after
applying the website template; it must not block the website preview link.
