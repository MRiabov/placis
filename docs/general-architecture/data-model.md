# Data model conventions

Every tenant-owned row carries `tenant_id`; all primary queries include it. Cross-tenant isolation
is proven by integration tests (two tenants, assert reads/writes/files are blocked).

Full DDL lives in `migrations/`. `jsonb` is reserved for genuinely polymorphic content (component
props, slot values, research raw payloads, manifests); structural data is real columns. Columns
named `source_refs` record where each value came from; `provenance` records where an asset came
from and how it was edited.

Own ids and foreign keys are `uuid` in Postgres and `uuid.UUID` (`github.com/google/uuid`) in Go —
never strings; they serialize as strings only at the HTTP boundary. Clerk's own ids (`clerk_org_id`,
`clerk_user_id`, `clerk_subject`) are `text`/`string` — Clerk's opaque ids (`org_…`, `user_…`), not
UUIDs.

Use DB check constraints for stable enums; state-transition tests before production use.

Table definitions live with the feature that owns them. Shared tables live in one owning file —
never copied into a second `data-model.md`.

| Owner | Tables |
| --- | --- |
| [auth](../features/other/auth/data-model.md) | `tenants`, `tenant_memberships`, `tenant_domains` |
| [onboarding](../features/onboarding/data-model.md) | sessions, research, preview, claim, `stripe_events` |
| [details](../features/other/details/data-model.md) | `business_profiles` and related |
| [website](../features/website/data-model.md) | pages, sections, slots, forms, navigation, publications, projects, certifications |
| [media](../features/other/media/data-model.md) | `website_assets` |
| [ads](../features/ads/data-model.md) | `ad_*` |
| [leads](../features/other/leads/data-model.md) | `leads` |
| [files](files.md) | `files` |
| [audit](audit.md) | `audit_events` |
| [LLM layer](llm-layer.md) | `ai_generations` |
| [jobs](jobs.md) | River-managed tables |
