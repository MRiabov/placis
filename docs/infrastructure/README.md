# Infrastructure

Supporting Go packages that are not owner surfaces. Product features stay
under [features/](../features/). Trees:
[module layout](../general-architecture/module-layout.md),
[file-trees.md](file-trees.md). [ADR](../general-architecture/ADR.md) 4.

- [tenancy/](tenancy/README.md) — Clerk, tenants, memberships, `GET /v1/me`.
  Auth-mode helpers: `internal/infrastructure/tenancy/auth/`.
- [config.md](config.md) — typed config from env; named feature-flag bools
- [store.md](store.md) — pgx pool, goose, `sqlc.yaml`
- [ai/](ai/README.md) — vendor AI interfaces, traces, knowledge loaders.
  Voice: [voice-agent.md](ai/voice-agent.md)
- [files.md](files.md) — object storage and the `files` row
- [jobs.md](jobs.md) — River job kind index (workers live in feature
  `pipeline/` or `jobs.go`)

No dedicated `httpapi/` doc. Mux rules:
[module layout](../general-architecture/module-layout.md). HTTP
conventions: [api.md](../general-architecture/api.md).
