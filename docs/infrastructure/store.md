# Store

One PostgreSQL database, one pgx pool, one goose migration chain. The
pool, `Tx`, `sqlc.yaml`, and SQL migrations live in
`internal/infrastructure/store/`. Not a repo-root `migrations/` dump.
Not every query — sqlc queriers are per feature
([module layout](../general-architecture/module-layout.md),
[file trees](file-trees.md)).
[ADR](../general-architecture/ADR.md) 6.

Table **index** (which schema owns which tables, jsonb rules, classifications):
[persistence conventions](../general-architecture/persistence.md). Table **definitions** stay in the owning feature (or
tenancy) `persistence.md`.

`sqlc.yaml` schema is **all** goose migrations. Feature packages import
their own generated querier (`onboarding/store/`, `website/store/`,
`profile/store/`, `profile/media/store/`, `ads/generation/store/`,
`etl/store/`, plus `store/` on packages that own tables:
`assistant/`, `billing/`, `leads/`, `infrastructure/tenancy/`,
`infrastructure/ai/`, `infrastructure/files/`). Callers **call** that
feature’s public Dos (`profile` `service.go`, `profile/media`); they do
not import another feature’s `store/` (sqlc types do not leak).

Pipeline step files **call** sqlc in that feature’s `store/`. Do not put SQL in
`pipeline/` files. CI: [API home check](../general-architecture/ci-cd.md).
