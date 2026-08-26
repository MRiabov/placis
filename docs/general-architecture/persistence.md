# Persistence conventions

Every tenant-owned row carries `tenant_id`; all primary queries include it. That is true from
business lookup (the tenant may still be `unactivated`). Cross-tenant isolation
is proven by integration tests (two tenants, assert reads/writes/files are blocked).

Full DDL lives in `migrations/`. `jsonb` is reserved for genuinely polymorphic dumps: website component
`props` / `design`, website slot `value`, ETL fetch bodies (`etl.fetches.raw`; kinds with no
listing table also copy onto `etl.business_research_sources.raw`), Stripe and ETL /
website preview event payloads, `ai_generations` traces (`input` / `internal_reasoning` /
`output` / `tool_calls` / `applied_changes`), audit `before` / `after`, website edit history
`before` / `after` (one field or website slot), and ads `platform_refs`.
`website_manifest` is jsonb because it is a published website copy (`website.v1`), not because
the tree is polymorphic. Structural data is real columns. Where a website slot or website section value came from is
`origin` (not a blob, not profile details). Profile history is typed `business_profile_edits`
increments; the live profile is the fold. A media library item records `supplied_by` and, when it
is a copy, `parent_media_asset_id`; its `file_id` is never replaced.

Those jsonb columns are storage. What HTTP returns for them is
[HTTP conventions](api.md) (typed union/struct or omit).

Own ids and foreign keys are `uuid` in Postgres and `uuid.UUID` (`github.com/google/uuid`) in Go —
never strings; they serialize as strings only at the HTTP boundary. Clerk's own ids (`clerk_org_id`,
`clerk_user_id`, `clerk_subject`) are `text`/`string` — Clerk's opaque ids (`org_…`, `user_…`), not
UUIDs.

Use DB check constraints for stable enums; transition tests before production use.

## Postgres schemas (namespaces)

One PostgreSQL database. A **Postgres schema** here is a **namespace** for tables (a prefix), not
OpenAPI, not a website component contract. Do not put product tables in
`public`.

The first goose migration `CREATE SCHEMA`s the namespaces below. sqlc and app SQL use
**qualified names** (`website.website_pages`, `ads.ads`). Do not set `search_path` to every
feature namespace — that would collapse the split. Cross-namespace foreign keys are allowed
(e.g. `ads.ad_image_placements.media_asset_id` → `media_library.media_assets`). One pool, one
goose migration chain.

Table definitions live with the feature that owns them. Shared tables live in one owning file —
never copied into a second `persistence.md`.

| Owner | Postgres schema (namespace) | Tables |
| --- | --- | --- |
| [auth](../features/other/auth/persistence.md) | `auth` | `tenants`, `tenant_memberships` |
| [onboarding](../features/onboarding/persistence.md) | `onboarding` | onboarding sessions, client interview, website previews, website activations, `stripe_events` |
| [ETL](../features/other/etl/persistence.md) | `etl` | runs, sources, append-only `fetches`, watermarks, `google_maps_listings`, `facebook_pages` / reviews / posts, `imported_media` mapping |
| [details](../features/other/details/persistence.md) | `details` | `business_profiles` and related (services, areas, hours, reviews) |
| [website](../features/website/persistence.md) | `website` | `website_addresses`, website pages, website sections, website slots, website forms, website form fields, `menus`, website settings, website edit history, website publications (website versions), projects, certifications |
| [media library](../features/other/media/persistence.md) | `media_library` | `media_assets` |
| [ads](../features/ads/persistence.md) | `ads` | `ads`, `ad_variants`, `ad_copy_variants`, `ad_image_placements`, `ad_lead_forms`, `ad_reviews` |
| [leads](../features/other/leads/persistence.md) | `leads` | `leads` |
| [files](files-and-s3.md) | `files` | `files` |
| [audit](audit.md) | `audit` | `audit_events` |
| [LLM layer](llm-layer.md) | `llm` | `ai_generations`, `ai_generation_tool_revisions` |
| [jobs](jobs.md) | `jobs` | River-managed tables |

`tenants` and `media_assets` stay out of `website` / `ads`. Those are the real intersections.
