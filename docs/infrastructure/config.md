# Feature flags

A **feature flag** is a named bool on the typed config struct
(`internal/infrastructure/config`). Env → that field, validated once at startup.
`cmd/api` **reads** it in-process (including River). Flip is a Railway
variable or local env, then process restart. Not HTTP. Not Postgres.
Not per-tenant. Not a percent rollout. Not a remote flag service.

[Glossary](../glossary.md). ADR: [ADR.md](../general-architecture/ADR.md). Config:
[backend stack](../general-architecture/backend-stack.md).

| Name | Default | Reader |
| --- | --- | --- |
| `media_auto_cleanup` | `false` | `DescribeImage`, immediately before it would **call** `CleanupMediaAsset` |

Do not add `internal/flags/`. A new flag is a new row here and a new
field on the config struct.
