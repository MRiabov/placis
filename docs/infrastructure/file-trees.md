# File trees — infrastructure

Supporting packages under `internal/infrastructure/`. High-level tree:
[module layout](../general-architecture/module-layout.md).
[ADR](../general-architecture/ADR.md) 4–7.
Fakes sit beside the collaborator (`fake.go` in that package). Omit
`*_test.go`. Not a substitute for the package docs.

Mux is `httpapi/` (no dedicated doc). HTTP conventions:
[api.md](../general-architecture/api.md). River index: [jobs.md](jobs.md)
(workers live in feature `pipeline/` or `jobs.go`; each feature that
owns a River job kind lists it in that feature’s `jobs.md`).

## Backend

```text
internal/infrastructure/
  config/
    config.go                 # env → typed struct; media_auto_cleanup
  httpapi/
    mux.go                    # chi, errors, GET /v1/health, GET /openapi.json
                              # Only cmd/api imports this. Features do not.
  tenancy/
    tenants.go                # AttachClerkOrganization, ResolveTenantFrom*
                              # RequireActiveTenant
    memberships.go            # InsertOwnerMembership
    api.go                    # GET /v1/me Register (picks Clerk helper)
    dto.go                    # MeRead / TenantRead
    store/                    # sqlc for auth.tenants / tenant_memberships
      queries.sql
    auth/
      clerk.go                # VerifySession → Principal; CreateClerkUser;
                              # CreateClerkOrganization
      fake.go                 # Clerk SDK boundary (integration default)
      helpers.go              # Register picks one: none; onboarding session
                              # token; Clerk JWT active; Clerk JWT Host /
                              # website_prefix; Stripe webhook signature.
                              # Unactivated Clerk on the app origin is mode 3
                              # without the active gate — not a sixth helper.
  store/
    pool.go                   # one pgx pool
    tx.go                     # Tx helper
    sqlc.yaml                 # schema = all goose SQL; per-feature packages
    migrations/               # goose chain (not a repo-root migrations/)
      001_schemas.sql         # CREATE SCHEMA auth, onboarding, etl, …
  ai/
    llm.go                    # LLMProvider generate (Vercel AI Gateway)
    voice.go                  # Voice adapter (xAI realtime)
    image.go                  # image generate / cleanup on that generate
    traces.go                 # writes ai.threads / ai_generations / revisions
    knowledge.go              # load + interpolate {{var}} / {{aaa.bbb}} only
    fake.go                   # LLM / Voice / image (always in integration)
    store/                    # sqlc for schema ai
      queries.sql
  files/
    object.go                 # R2 / MinIO / local FS; signed URLs
    store/                    # sqlc for schema files
      queries.sql

cmd/api/
  main.go                     # process; in-process River; RegisterWorkers
```

`infrastructure/` = **6** dirs (cap 9). `tenancy/` = `auth/` + `store/` +
files. `ai/` and `files/` each have `store/` because they own tables.
`cmd/api` is the only importer of `httpapi`.
