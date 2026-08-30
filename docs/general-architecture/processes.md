# Processes and deployment

One Go process shares one database. `frontend-2` and the contractor website talk
to the API. The Placis website is a separate static origin and does not call Go.

1. `cmd/api` — the Go HTTP API and in-process `River` workers. Completes
   requests quickly, persists intent, and runs background jobs in the same
   process: AI generation, business research, file processing, notifications,
   and export generation.
2. `frontend-2` — the CMS and onboarding; built as static assets, talking to the
   API through the generated `openapi-fetch` helper. Stack: [frontend stack](frontend-stack.md). UI
   rules: [frontend](frontend.md).
3. **Contractor website** (`apps/contractor-website`) — Astro with React
   islands, on Cloudflare Workers. Website publication writes HTML to R2
   `latest/`; a live GET is Cache then R2 (no Go). A single deploy serves all
   tenants (no per-tenant build). The website component package is keep-and-cut;
   the Worker is write-thin (live GET never calls Go). Remaining cuts:
   [contractor-website-debloat.md](../features/website/contractor-website-debloat.md). API cutover: [port-contractor-website.md](../features/website/port-contractor-website.md).
   Website preview is this host while unactivated (FQDN in [website Cloudflare](../features/website/cloudflare.md),
   strip on). After website activation the same host stays up without the strip.
   Locked serve path: [website Cloudflare](../features/website/cloudflare.md).
4. **Placis website** (`apps/placis-website`) — Astro static build uploaded to
   R2; hostname `placis.com`. No Worker. Locked serve path:
   [Placis website Cloudflare](../features/placis-website/cloudflare.md).

Webhooks are verified with the Stripe Go SDK (`webhook.ConstructEvent`), the raw
payload saved, the work enqueued, and the request returned — see
[website activation](../features/onboarding/pipeline/08-website-activation.md). Every background job can be retried safely (an explicit
key) — see [jobs](jobs.md).

Onboarding session progress events stream over SSE — see [07-website-preview.md](../features/onboarding/pipeline/07-website-preview.md)
and [onboarding frontend](../features/onboarding/frontend.md). Anyone with the host URL opens the preview website
address (Cache then R2). The contractor host is not an SSE endpoint.

HTTP conventions: [api.md](api.md). Huma vs streaming: [backend stack](backend-stack.md).

River is required: slow work must not sit on an HTTP request. A second always-on
Go process is not. Jobs are Postgres rows in schema `jobs`; the worker is a loop
that claims them. At this size, that loop runs inside `cmd/api`. Split into a
`cmd/worker` container only if job CPU/RAM or webhook latency actually shows up.

Website crawl (HTML GET, goquery, image GETs, Apify fallback) and Maps scrape
wait stay in this process. **SLO:** while they run, API p90 must not increase
by more than **1s** vs idle on the same instance (authenticated / onboarding
HTTP; not the Cloudflare contractor website). Bound image-GET concurrency (8),
timeouts, and body size. If an implementing agent cannot keep that without a
worker split or unbounded GETs, **stop and tell the owner**. Do not add
Prometheus or CI p90 tests for this unless that alert fires.

## Deployment

One Railway container for `cmd/api`; `frontend-2` builds to static assets.
Cloudflare Workers + R2 for the contractor website (one Worker, prebuilt HTML in
`latest/`). The Placis website is an Astro static build uploaded to its own R2
buckets; `placis.com` is the hostname on that bucket (no Worker). Local infra
(Postgres, MinIO) via Docker; `cmd/api`, `frontend-2`, and `wrangler dev`
(Miniflare R2 on) run directly. See [website Cloudflare](../features/website/cloudflare.md) and
[Placis website Cloudflare](../features/placis-website/cloudflare.md).
CI and upload workflows: [CI and delivery](ci-cd.md).
