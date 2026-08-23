# Architecture

The system is two halves around one contract: the `frontend-2` React app and the Go backend,
joined by the `huma`-derived OpenAPI. That contract is the full-stack spine — the frontend's types
are generated from it, the backend's DTOs define it, and the schema and packages below it are
backend implementation. Go-specific sections (module layout, schema) are the backend half, not the
whole system.

## Stack

| Layer | Choice |
| --- | --- |
| Language | Go (latest stable toolchain) |
| HTTP | `chi` + `net/http` |
| API contract | `huma` v2 (Go-first: structs derive OpenAPI 3.1 + validation when the request is handled) |
| Data access | `sqlc` + `pgx/v5` |
| Migrations | `goose` (plain SQL) |
| Database | PostgreSQL (one database; [Postgres schemas as feature namespaces](general-architecture/data-model.md#postgres-schemas-namespaces)) |
| Background jobs | `River` (Postgres-backed, typed args, safe retries) |
| Config | env → typed struct, validated once at startup |
| Logging | `log/slog` (structured) + request ids |
| Object storage | S3-compatible (R2 in prod, MinIO/local FS in dev) |
| LLM | internal interface; Vercel AI SDK primary, OpenRouter as an alternative |
| Payments | Stripe via `stripe-go` SDK (activation checkout only) |
| Frontend (`frontend-2`) | Vite + React + TanStack Router/Query + `openapi-typescript`/`openapi-fetch`; the CMS, onboarding, website preview; reused mostly, adapted to the huma OpenAPI |
| Contractor website (`apps/contractor-website`) | Astro with React islands (Cloudflare Workers) — shows every contractor’s live website; import this app first when implementation starts |
| IDs | UUID PKs, `timestamptz` defaults |

## Module layout

```text
cmd/
  api/            # HTTP API server
  worker/         # background job worker (River)
  ci/             # CI/dev checks (not deployed); check-dont-say, later file-size guard, …
internal/
  # shared / cross-cutting (small, few files each)
  config/         # typed config from env
  httpapi/        # router, middleware, error mapping, huma API registration
  auth/           # Clerk SDK (clerk-sdk-go) verification -> Principal
  store/          # pgx pool + sqlc-generated queries (queries/*.sql split by domain)
  ai/             # LLM client, prompts, traceability
  files/          # object storage, signed URLs
  jobs/           # River job args + workers
  audit/          # audit events

  # product domains — feature-nested: one package per feature, split a package
  # only when it grows past ~800 lines (never flat file dumps).
  tenancy/        # tenants.go, memberships.go
  onboarding/     # onboarding.go, client_interview.go, orchestrate.go, activation.go
    websitepreview/ #   package.go, events.go (website preview of the unpublished website during onboarding)
  research/       # service.go + googlemaps/, companyregistry/, facebook/, crawl/, photo/ with fakes
  profile/        # profile.go, profile_history.go, services.go, areas.go, hours.go
  website/        # root: types.go, service.go
    pages/        #   handler.go, service.go, model.go
    sections/
    slots/
    forms/
    topmenu/
    footer/
    publications/
    projects/
    certifications/
    templates/
    addresses/    #   website_addresses.go (live hostnames; not auth)
  ads/            # ad.go, variant.go, generate.go, export.go
  media/          # media_assets
  billing/        # checkout.go, webhooks.go (Stripe only)
  leads/          # leads.go
migrations/       # goose SQL migrations (greenfield)
catalog/          # website templates + website component contracts (typed structs, kept as website template catalog revisions)
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
- Service functions accept `tenantID` explicitly; they never infer it from ambient request data.
- **Two type layers by default**: sqlc rows (persistence) and huma DTOs (API). A third "domain
  value" exists only to name a composite of several rows (e.g. the business profile, the website
  manifest) — never to mirror a single table. Reuse one `*Read` per entity and one `*Create`/
  `*Update` per write; don't add a new type per endpoint.
- **Every DTO field is constrained**: strings carry `minLength`/`maxLength`, numbers carry
  `minimum`/`maximum`, fixed sets use `enum` (huma tags). CI checks the generated OpenAPI and fails
  on an unconstrained field — the Go equivalent of the old "strict schema contract" check.
- See [ci-cd.md](ci-cd.md) for the delivery gates (file-size guard, external API isolation, generated-code freshness).

## Frontend (`frontend-2`)

`frontend-2` is **reused mostly** — the rewrite does not rebuild it. It is
adapted only where the huma-derived OpenAPI improves the contract.

- `src/generated/api-types.ts` — regenerated from the served `/openapi.json` via
  `openapi-typescript`; `src/shared/api/` is the typed `openapi-fetch` helper + Clerk token.
- `src/features/onboarding/` — onboarding (sources, client interview, business research progress, website preview).
- `src/features/cms/` — the website + ads parts of the CMS (website editor, `/cms/media`, editing panel, ads workspace).
- `src/features/preview/` — the onboarding website preview (and the website preview shown by the contractor website app).

frontend-2 keeps its own feature-local structure and is not folded into `internal/`; the file-size
guard applies to it too (see `ci-cd.md`).

## Processes

Two backend processes share one database, and two frontend apps talk to the API:

1. `cmd/api` — the Go HTTP API. Completes requests quickly and persists intent.
2. `cmd/worker` — runs `River` jobs: AI generation, business research, file processing,
   notifications, and export generation.
3. `frontend-2` — the CMS, onboarding, and website preview; built as static assets, talking
   to the API through the generated `openapi-fetch` helper.
4. **Contractor website** (`apps/contractor-website`) — Astro with React islands, on Cloudflare
   Workers. Website publication writes HTML to R2 `latest/`; a live GET is Cache then R2 (no Go).
   A single deploy serves all tenants (no per-tenant build). Import this application first when
   implementation starts (it still lives in the predecessor repo today). Locked serve path:
   [website Cloudflare](features/website/cloudflare.md).

Webhooks are verified with the Stripe Go SDK (`webhook.ConstructEvent`), the raw payload saved, the
work enqueued, and the request returned — see
[website activation](features/onboarding/pipeline/07-website-activation.md). Every background job can be retried safely (an
explicit key) — see [jobs](general-architecture/jobs.md).

Website preview progress events stream over SSE — see
[06-website-preview.md](features/onboarding/pipeline/06-website-preview.md).

`huma` handles JSON request/response endpoints and serves the derived OpenAPI spec at
`/openapi.json`. The website preview **SSE** stream and the voice **WebSocket** (later milestone) are raw
`net/http` handlers outside huma. Mutating routes that can be safely retried accept an
`Idempotency-Key` header (checked per tenant) — the Go equivalent of the old API's idempotency
convention.

## Website component contract (single source of truth)

Each website component (what a `public.hero.image` website section accepts) is **one typed struct, dumped to JSON**,
under `catalog/`. That JSON is the contract: the TypeScript renderer for the contractor website
consumes it to
validate and render, and the Go backend loads the same structs for save and website publication validation.
Website templates and website component contracts are static website template catalog data, kept as website template catalog revisions — not database rows.
The Go backend loads and validates them; it must not hand-duplicate the struct shapes.

## Boundaries

1. `auth` proves identity via the Clerk Go SDK; `tenancy` decides tenant access and permissions.
2. `onboarding` owns business research, profile building, the first unpublished website (04), async website copy
   generation (05), and website preview/website activation; it does not do website publication. The website
   assistant (website editor) and website publication live in `website`.
3. `templates` applies website templates into tenant-owned `website_*` rows; it validates website component ids,
   props, design controls, website page paths, website forms, and top menu / footer before writing.
4. `website` owns the editable content model and website publication; a `website_manifest` is only the
   validated read model, built at website publication time.
5. `ads` is a standalone service (the `/cms/ads` workspace is one owner). It reads the profile +
   approved media library items, proposes copy + image galleries, and exports `ad ready to post` ad sets — never
   does ad posting.
6. `ai` suggests but never writes: it proposes edits for an owner to approve, and never changes
   anything without validation.
7. Integrations (business research, LLM, storage, Stripe, email/SMS) are behind interfaces so tests run
   without network calls.

## Deployment

Railway containers for `cmd/api` and `cmd/worker`; `frontend-2` builds to static assets. Cloudflare
Workers + R2 for the contractor website (one Worker, prebuilt HTML in `latest/`). Local infra
(Postgres, MinIO) via Docker; the API, worker, `frontend-2`, and `wrangler dev` (Miniflare R2 on)
run directly. See [website Cloudflare](features/website/cloudflare.md).
