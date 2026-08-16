# Architecture

## Stack

| Layer | Choice |
| --- | --- |
| Language | Go (latest stable toolchain) |
| HTTP | `chi` + `net/http` |
| API contract | `huma` v2 (Go-first: structs derive OpenAPI 3.1 + runtime validation) |
| Data access | `sqlc` + `pgx/v5` |
| Migrations | `goose` (plain SQL) |
| Database | PostgreSQL |
| Background jobs | `River` (Postgres-backed, typed args, idempotency keys) |
| Config | env → typed struct, validated once at startup |
| Logging | `log/slog` (structured) + request IDs + Sentry |
| Object storage | S3-compatible (R2 in prod, MinIO/local FS in dev) |
| LLM | OpenRouter behind an internal provider interface |
| Payments | Stripe (activation checkout only) |
| Frontend (private app) | `frontend-2` — Vite + React + TanStack Router/Query + `openapi-typescript`/`openapi-fetch`; reused mostly, adapted to the huma OpenAPI |
| Public site | shared Astro + React runtime (Cloudflare Workers) rendering published manifests |
| IDs | UUID PKs, `timestamptz` defaults |

## Module layout

```text
cmd/
  api/            # HTTP API server
  worker/         # background job worker (River)
internal/
  # shared / cross-cutting (small, few files each)
  config/         # typed config from env
  httpapi/        # router, middleware, error mapping, huma API registration
  auth/           # Clerk SDK (clerk-sdk-go) verification -> Principal
  store/          # pgx pool + sqlc-generated queries (queries/*.sql split by domain)
  ai/             # LLM client, prompt catalog, traceability
  files/          # object storage, signed URLs
  jobs/           # River job args + workers
  audit/          # audit events

  # product domains — feature-nested: one package per feature, split a package
  # only when it grows past ~800 lines (never flat file dumps).
  tenancy/        # tenants.go, memberships.go, domains.go
  onboarding/     # session.go, consent.go, interview.go, orchestrate.go, claim.go
    preview/      #   package.go, events.go (signed preview of the generated site during onboarding)
  research/       # service.go + providers/{googleplaces,registry,facebook,crawl,photo}.go
  profile/        # profile.go, versions.go, services.go, areas.go, hours.go
  website/        # root: types.go, service.go
    pages/        #   handler.go, service.go, model.go
    sections/
    slots/
    assets/
    forms/
    navigation/
    publications/
    projects/
    certifications/
    blueprints/
  ads/            # creativeset.go, variant.go, generate.go, export.go
  billing/        # checkout.go, webhooks.go (Stripe only)
  leads/          # leads.go
migrations/       # goose SQL migrations (greenfield)
catalog/          # blueprints + component JSON Schemas (static, versioned)
docs/
go.mod
```

Rules:

- **Feature-nested, not flat**: one package per feature; a leaf package starts as a single file and
  splits only when it grows. Enforce the file-size guard (< 800 lines warning, > 1200 hard error)
  in CI — never flat file dumps.
- Shared types live in exactly one package — no forked duplicates.
- Route handlers validate input (huma) and call service functions; services own business rules and
  transactions; models are persistence only.
- Service functions accept `tenantID` explicitly; they never infer it from global state.
- See [ci-cd.md](ci-cd.md) for the delivery gates (file-size guard, provider isolation, generated-code freshness).

## Frontend (`frontend-2`)

`frontend-2` is the private client and is **reused mostly** — the rewrite does not rebuild it. It is
adapted only where the huma-derived OpenAPI improves the contract.

- `src/generated/api-types.ts` — regenerated from the served `/openapi.json` via
  `openapi-typescript`; `src/shared/api/` is the typed `openapi-fetch` client + Clerk token provider.
- `src/features/setup/` — onboarding (text interview, sources, research progress, preview).
- `src/features/cms/` — the website + ads parts of the CMS (editor, media, inspector, ads workspace).
- `src/features/preview/` — the signed onboarding preview + public-site module preview.

The client keeps its own feature-local structure and is not folded into `internal/`; the file-size
guard applies to it too (see `ci-cd.md`).

## Runtime

Three runtimes share the API contract:

1. `cmd/api` — the Go HTTP API. Completes requests quickly and persists intent.
2. `cmd/worker` — runs `River` jobs: AI generation, business research, file processing,
   notification delivery, PDF/export generation.
3. `frontend-2` — the private Vite client (CMS, onboarding, preview) built as static assets,
   speaking to the API through the generated `openapi-fetch` client. The public site is a shared
   Cloudflare Worker rendering published manifests.

Webhooks (Stripe) verify signatures, persist raw payloads, enqueue processing, and return quickly.
Every background job is idempotent via an explicit key.

`huma` handles JSON request/response endpoints and serves the derived OpenAPI spec at
`/openapi.json`. The preview **SSE** stream and the voice **WebSocket** (later milestone) are raw
`net/http` handlers outside huma.

## Component contract (single source of truth)

Component schemas (what a `public.hero.image` section accepts) are **one JSON Schema per component**
under `catalog/`, consumed by both the TypeScript public-site renderer and the Go backend for
save/publish validation. Blueprints and component contracts are static, versioned catalog data, not
database rows. The Go backend loads and validates them and must not hand-duplicate their schemas.

## Boundaries

1. `auth` proves identity via the Clerk Go SDK; `tenancy` decides tenant access and permissions.
2. `onboarding` owns research and profile building; it does not write CMS records directly.
3. `blueprint` applies templates into tenant-owned `website_*` rows; it validates component IDs,
   props, design controls, page paths, forms, and navigation before writing.
4. `website` owns the editable content model and publication; a `site_manifest` is only the
   validated read model materialized at publish time.
5. `ads` is a standalone service (the `/cms/ads` workspace is one user). It reads the profile +
   approved media, proposes copy + image galleries, and exports `ready to post` packages — never
   posts.
6. `ai` is propose-only against every domain: it produces reviewable diffs and never writes
   unvalidated state.
7. Integrations (research, LLM, storage, Stripe, email/SMS) are behind interfaces so tests run
   without network calls.

## Deployment

Railway containers for `cmd/api` and `cmd/worker`; `frontend-2` builds to static assets. Cloudflare
for the public-site edge/CDN and R2 object storage. Local infra (Postgres, MinIO) via Docker
Compose; the API, worker, and `frontend-2` run directly for fast iteration.
