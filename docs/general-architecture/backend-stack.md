# Backend stack

The full-stack spine is the `huma`-derived OpenAPI: `frontend-2` types are generated from it,
backend DTOs define it. Go-specific choices below are the backend half.

Go module path: `placis` ([go.mod](../../go.mod)). Do not assume a GitHub module path until
`go.mod` says so.

| Layer | Choice |
| --- | --- |
| Language | Go (latest stable toolchain) |
| HTTP | `chi` + `net/http` |
| API contract | `huma` (Go-first: structs derive OpenAPI + validation when the request is handled) |
| Data access | `sqlc` + `pgx` |
| Migrations | `goose` (plain SQL) |
| Database | PostgreSQL (one database; [Postgres schemas as feature namespaces](persistence.md#postgres-schemas-namespaces)) |
| Background jobs | `River` (Postgres-backed, typed args, safe retries) |
| Config | env → typed struct, validated once at startup |
| Logging | `log/slog` (structured) + request ids |
| Object storage | S3-compatible (R2 in prod, MinIO/local FS in dev) |
| LLM | `LLMProvider`; Vercel AI SDK for generation; open-web search is Parallel as a Vercel AI Gateway server tool ([LLM layer](llm-layer.md)) |
| Payments | Stripe via `stripe-go` SDK (activation checkout only) |
| Frontend (`frontend-2`) | CMS + onboarding. Stack: [frontend stack](frontend-stack.md) |
| Contractor website (`apps/contractor-website`) | Astro with React islands — that app renders website HTML; live GET is CDN cache then R2 (Worker is write-thin, never Go). Website preview is the only per-request render. Serve path: [website Cloudflare](../features/website/cloudflare.md). Website components in `packages/website-components` |
| Placis website (`apps/placis-website`) | Astro `output: 'static'` — Placis’s own site; `astro build` uploaded to R2. Serve path: [Placis website Cloudflare](../features/placis-website/cloudflare.md) |
| IDs | UUID PKs, `timestamptz` defaults |

`huma` handles JSON request/response endpoints and serves the derived OpenAPI spec at
`/openapi.json`. Onboarding session progress uses Huma `sse.Register`
([HTTP conventions](api.md)). The website preview itself is not an SSE endpoint
([07-website-preview.md](../features/onboarding/pipeline/07-website-preview.md)). Voice audio does
not go through a Go WebSocket — the browser connects to the voice service with a minted secret
([voice agent](voice-agent.md)).

HTTP conventions (prefix, opacity, auth modes, errors, `Idempotency-Key`):
[api.md](api.md).

## Dependencies

The rewrite is greenfield. Default to the **latest stable** of each chosen library and of the Go
toolchain. Names in this file (`huma`, `pgx`, `chi`, `River`, Clerk, Stripe, …) identify the
library, not a frozen major or minor. When a new stable major lands, take it on the next upgrade
pass; do not keep an old import path in these docs as policy.

Do **not** add Dependabot, Renovate, or other automated upgrade PRs. Upgrade on a regular
cadence — about every two weeks — as a deliberate pass (`go get -u ./...`, toolchain bump,
lockfile refresh). Goose SQL migrations stay manual and reviewed; this cadence is for
dependencies, not schema automigration.

## Type layers

**Two type layers by default**: sqlc rows (persistence) and huma DTOs (API). A third "domain
value" exists only to name a composite of several rows (e.g. the business profile, the website
manifest) — never to mirror a single table. Reuse one `*Read` per entity and one `*Create` /
`*Update` per write; don't add a new type per endpoint.

**Every DTO field is constrained**: strings carry `minLength`/`maxLength`, numbers carry
`minimum`/`maximum`, fixed sets use `enum` (huma tags). CI checks the generated OpenAPI and fails
on an unconstrained field, including `map[string]any` / `json.RawMessage` /
`additionalProperties: true` on DTOs ([HTTP conventions](api.md)).

Don't say: Opaque freeform-JSON wrappers (`JsonRecord`, `JsonObjectPayload`, `map[string]any` /
`json.RawMessage` in domain code) are out. `jsonb` is persistence-only — not on huma DTOs.

Module layout and file-size guard: [module layout](module-layout.md). Delivery gates:
[CI and delivery](ci-cd.md).
