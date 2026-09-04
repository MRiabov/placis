# Persistence conventions

Every tenant-owned row carries `tenant_id`; all primary queries include it. That
is true from business lookup (the tenant may still be `unactivated`).
Cross-tenant isolation is proven by integration tests (two tenants, assert
reads/writes/files are blocked).

Full DDL lives in `migrations/`. `jsonb` is reserved for genuinely polymorphic
dumps: website component `props` / `design`, website slot `value`, ETL fetch
`raw` (one column per extract-type fetch table), Stripe and website preview
event payloads, `ai_generations` traces (`input` / `internal_reasoning` /
`output` / `tool_calls`), audit `before` / `after`, website
edit history `before` / `after` (one field or website slot), and ads
`platform_refs`. `website_manifest` is jsonb because it is a published website
copy (`website.v1`), not because the tree is polymorphic. Structural data is
real columns. Where a website slot or website section value came from is
`origin` (not unstructured jsonb, not profile details). Profile history is typed
`business_profile_edits` increments; the live profile is the current
`business_profiles` row. A media library item records `supplied_by` and, when it
is a copy, `parent_media_asset_id`; its `file_id` is never replaced.

Those jsonb columns are storage. What HTTP returns for them is
[HTTP conventions](api.md) (typed union/struct or omit).

Own ids and foreign keys are `uuid` in Postgres and `uuid.UUID`
(`github.com/google/uuid`) in Go — never strings; they serialize as strings only
at the HTTP boundary. Clerk's own ids (`clerk_org_id`, `clerk_user_id`,
`clerk_subject`) are `text`/`string` — Clerk's opaque ids (`org_…`, `user_…`),
not UUIDs.

Use DB check constraints for stable enums; transition tests before production
use. Do not use Postgres `CREATE TYPE … AS ENUM`
([ADR 1](ADR.md)).

## Postgres schemas (namespaces)

One PostgreSQL database. A **Postgres schema** here is a **namespace** for
tables (a prefix), not OpenAPI, not a website component contract. Do not put
product tables in `public`.

The first goose migration `CREATE SCHEMA`s the namespaces below. sqlc and app
SQL use **qualified names** (`website.website_pages`, `ads.ads`). Do not set
`search_path` to every feature namespace — that would collapse the split.
Cross-namespace foreign keys are allowed (e.g.
`ads.ad_image_placements.media_asset_id` → `media_library.media_assets`). One
pool, one goose migration chain.

Table definitions live with the feature that owns them. Shared tables live in
one owning file — never copied into a second `persistence.md`. Defined
features list tables as `## Tables` / `### \`name\`` with Columns, Enums,
Uniques, Written by, Notes
([docs conventions](../docs-conventions.md#named-identifiers)).

| Owner | Postgres schema (namespace) | Tables |
| --- | --- | --- |
| [auth](../features/other/auth/persistence.md) | `auth` | `tenants`, `tenant_memberships` |
| [onboarding](../features/onboarding/persistence.md) | `onboarding` | onboarding sessions, client interview submissions, website activations, `stripe_events` |
| [ETL](../features/etl/persistence.md) | `etl` | `runs`, `sources`, `llm_source_to_project_classifications`, per-type fetches (including `web_search_fetches`), `google_maps_listings` (hours, reviews, listing photos, review photos), `website_crawl_pages` (+ photos), `imported_media` |
| [details](../features/business-profile/details/persistence.md) | `details` | `business_profiles` and related (services, areas, hours, reviews, `business_profile_review_rankings`, Facebook / Instagram profile and posts, `certification_definitions`, `business_profile_certification_selections`) |
| [projects](../features/business-profile/projects/persistence.md) | `business_profile` | `projects` |
| [website](../features/website/persistence.md) | `websites` | `websites`, `website_addresses`, website pages, website sections, website slots, website forms, website form fields, `menus`, website settings, website edit history, website publications (website versions) |
| [media library](../features/other/media/persistence.md) | `media_library` | `media_assets`, `media_asset_classifications` |
| [ads](../features/ads/persistence.md) | `ads` | `ads`, `ad_variants`, `ad_copy_variants`, `ad_image_placements`, `ad_lead_forms`, `ad_reviews` |
| [leads](../features/other/leads/persistence.md) | `leads` | `leads` |
| [files](files-and-s3.md) | `files` | `files` |
| [audit](audit.md) | `audit` | `audit_events` |
| [LLM layer](llm-layer.md) | `ai` | `threads` (identity for every generate factory), `ai_generations`, `ai_generation_tool_revisions` |
| [Assistant](../features/assistant/persistence.md) | `assistant` | `thread_items`, `runs` (in-flight lock; not hydrate). Thread identity is `ai.threads`. |
| [Billing](../features/billing/persistence.md) | `billing` | `subscriptions`, `ai_use_ledger_entries` |
| [jobs](jobs.md) | `jobs` | River-managed tables |

`tenants` and `media_assets` stay out of `websites` / `ads`. Those are the real
intersections.

## Classifications and predictions

A label, media caption, ranking, usable-as-a-Project verdict, or other
generated prediction **about** a persisted subject is never a column on
that subject. It lives on a dedicated table in the **same feature
Postgres schema**. `ai` is traces only (`threads`, `ai_generations`,
`ai_generation_tool_revisions`) — not product predictions
([LLM layer](llm-layer.md)).

- **Many rows per subject.** Current = latest `created_at` for that
  subject id. No current-id pointer on the subject. HTTP / attach /
  skip hydrate from the join.
- **Insert only.** Never UPDATE an old prediction. A new algorithm,
  `schema_revision`, owner edit (`algorithm=human`), or new
  `content_hash` inserts a row. Previous predictions stay.
- **Trace pointer, not a dump.** Nullable `ai_generation_id` →
  `ai.ai_generations`. Reasoning, output, and tool calls stay on that
  trace.
- **Not this.** Live product rows (unpublished website slots,
  owner-typed details, the Project title/description) **are** the
  stored product. Raw extract dumps stay on fetch `raw`. Transform
  skip keys (`algorithm` / `schema_revision`) on a live profile copy
  are not a prediction-about-raw table.

Examples that already split: `media_library.media_asset_classifications`
(`media_assets`); `etl.llm_source_to_project_classifications`
(`etl.sources`); `details.business_profile_review_rankings`
(`business_profile_reviews`). New prediction tables follow
many-rows-per-subject (the media library shape). Do not add new
prediction columns to the subject.
