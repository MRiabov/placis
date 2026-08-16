# Placis Go Backend — Exhaustive Rewrite Plan

> Status: planning (in discussion). This document is the working plan for the Go rewrite of the
> Placis backend. It supersedes the Python docs (`OnCall/docs/*`), which describe a larger,
> two-track product that was never fully built. Scope decisions below are locked with Maksym.

## 1. Product definition

Placis helps construction companies **not make mistakes with advertisement and marketing**, in a
**done-for-you — delivered into your inbox, so you can DIY too** way. The system researches a
business, builds a versioned profile, generates a website from a trade blueprint, lets the owner
edit it (or we do it), and produces — and runs — ads from the profile and approved media.

One loop:

```text
onboard (voice / text / web)
  -> consent
  -> research the business (Google Places, company registry, Facebook, website crawl, photo classification)
  -> build a versioned business profile
  -> generate a website from a trade blueprint (facts resolve into templates)
  -> LLM refinement (propose-only, governed edits)
  -> edit in the CMS (pages / sections / slots / assets / forms / navigation)
  -> publish (materialized site manifest)
  -> generate ad creatives from the profile + approved media (#403)
```

Cross-cutting: Clerk auth, tenant == Clerk org (1-1), Postgres multitenancy, LLM + system
auditability, and voice agents as a **separate, optional** channel.

## 2. Scope

### In scope

1. **Identity, auth, tenancy** — Clerk identity + organizations; tenant == Clerk org 1-1;
   memberships with roles; domains (generated subdomain + custom).
2. **Onboarding (research → profile)** — onboarding sessions (voice/text/web), per-purpose consent,
   text interview, voice observability, research providers, versioned business profile.
3. **Website building from blueprints** — trade blueprints + component contracts as static catalog
   data; blueprint application; LLM refinement as governed, propose-only edits.
4. **Website editing (CMS)** — pages (+ immutable versions), sections, content slots, assets/media
   library, forms, navigation, projects, certification selections, publications.
5. **Public website + lead capture** — resolve active publication manifests by host/path; public
   forms persist into a minimal `leads` table.
6. **Preview + claim/activation** — signed preview packages; self-serve Stripe claim/checkout;
   idempotent webhook-driven activation.
7. **Ad generation (#403)** — creative sets (the "ad") with per-format variants, copy, and image
   placements built from the profile + approved media; propose-only AI; terminal state is a
   deterministic "ready to post" export (no posting, no campaign ops — those are future work on
   the same creative service). Spec: `docs/ads/ad-generation/`.
8. **Cross-cutting** — AI/LLM layer with mandatory recording of reasoning + output + tool calls;
   files (S3/R2); Stripe payments (activation only); Postgres-backed jobs (River); structured
   logging; audit events.
9. **Voice agents** — separate, optional; provider-agnostic interface; onboarding voice agent +
   operator console. Kept only as a communication channel into the system.

### Out of scope (do not rebuild)

- **CRM / operations** — customers, quotes (+ versions), invoices, jobs, scheduling, checklists,
  crew packets, reminders, workflows, calendar, AI receptionist, missed-call CRM capture.
  (Retired in the Python codebase by `0024_drop_crm_tables`; cut from Go entirely.)
- **App-modification surface** — `tenant_app_configs`, `tenant_app_change_requests`, module
  definitions, "Modify App" flow, omission/declined-module machinery.
- **Deprecated tenant/org management** — org chooser, selected-org cookie, `/me/orgs`,
  `/me/tenants`, `POST /api/v1/tenants`, `PATCH /api/v1/tenants/{slug}`, `.../memberships/*` CRUD.
- **Freeform-JSON islands** — opaque `JsonRecord`/`JsonObjectPayload` wrappers, the planned-but-
  unshipped `schemas_registry_public.py` API, hard-coded template imagery as tenant variables.
- **Blog posts and careers** — deferred; `page_type` enum omits `blog_post`; no `website_career_*`
  tables for now.

### Deferred (later)

Custom-capability coding agents (H7), component marketplace (L2), QS/tendering (L3), accounting
integrations (L4), native mobile app (L1).

## 3. Architecture

### Module layout (domain-oriented)

```text
placis/
  cmd/
    api/                 # HTTP API server (wiring, middleware, handlers)
    worker/              # background job worker (River)
  internal/
    # shared / cross-cutting
    config/              # env -> typed config, validated once at startup
    httpapi/             # router, middleware, error/response mapping, huma API registration
    auth/                # Clerk Go SDK (clerk-sdk-go) verification -> Principal{userID, orgID, platformRole}
    store/               # pgx pool + sqlc-generated queries (queries/*.sql split by domain)
    ai/                  # LLM client, prompt catalog, schema-shaped output, traceability
    files/               # object storage, signed URLs, scan status
    jobs/                # River job args + workers
    audit/               # audit events

    # product domains — feature-nested (one package per feature)
    tenancy/             # tenants.go, memberships.go, domains.go
    onboarding/          # session.go, consent.go, interview.go, orchestrate.go, claim.go
      preview/           #   package.go, events.go (signed preview of the generated site)
    research/            # service.go + providers/{googleplaces,registry,facebook,crawl,photo}.go
    profile/             # profile.go, versions.go, services.go, areas.go, hours.go
    website/             # root types.go, service.go + feature packages
      pages/             #   handler.go, service.go, model.go
      sections/
      slots/
      assets/
      forms/
      navigation/
      publications/
      projects/
      certifications/
      blueprints/
    ads/                 # creativeset.go, variant.go, generate.go, export.go
    billing/             # checkout.go, webhooks.go (Stripe only)
    leads/               # leads.go
  migrations/            # goose SQL migrations (greenfield)
  catalog/               # blueprints + component JSON Schemas (static, versioned)
  docs/                  # rescoped canonical docs
  go.mod
```

Packages are feature-nested, never flat: a leaf package starts as a single file and splits only
when it grows. Enforce the file-size guard (< 800 lines warning, > 1200 hard error) in CI — see
`docs/ci-cd.md`. Shared types live in exactly one package — no forked duplicates.

### Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Language | Go (latest stable toolchain) | |
| HTTP | `chi` + `net/http` | stdlib `http.ServeMux` is the zero-dep alternative |
| API contract | **Go-first**: `huma` v2 (locked) | structs + tags derive OpenAPI 3.1 + runtime validation; frontend regenerates via `openapi-typescript` |
| Data access | `sqlc` + `pgx/v5` | `jsonb` -> typed Go structs via custom mapping at the boundary only |
| Migrations | `goose` | plain SQL, embedded |
| Jobs | `River` | Postgres-backed, typed args, explicit idempotency keys |
| Config | env -> typed struct, validated at startup | |
| Logging | `log/slog` | structured, request IDs, Sentry |
| Storage | `aws-sdk-go-v2/service/s3` | R2 in prod, MinIO/local FS in dev |
| LLM | OpenRouter behind an interface | mandatory recording of reasoning + output + tool calls |
| Payments | Stripe | activation checkout only |
| IDs | UUID PKs | `timestamptz` defaults |

`huma` handles JSON request/response endpoints and derives the OpenAPI spec served at
`/openapi.json`. The preview **SSE** stream and the **voice WebSocket** are raw `net/http`
handlers outside huma.

### Component contract (single source of truth)

Component schemas (what a `public.hero.image` section accepts) currently exist twice — TS types in
`packages/public-site-components/` and Python `typed_values.py`. The rewrite uses **one JSON Schema
per component** under `catalog/`, consumed by both the TS renderer (validation) and the Go backend
(save/publish validation). Blueprints and component contracts are static, versioned catalog data,
**not** database rows; the Go backend loads and validates them and must not hand-duplicate their
schemas.

### Tenancy and auth rules

- Clerk proves identity + organization; Placis decides tenant access and permissions.
- `tenants.clerk_org_id` (unique) is the only tenant entry point. No org chooser, no selected-org
  cookie, no client-controlled tenant selector.
- Tenant context is resolved once per request from: authenticated Clerk org, public site hostname,
  signed preview token, or onboarding session token. Services take `tenantID` explicitly.
- Every tenant-owned row carries `tenant_id`; all primary queries include it; cross-tenant
  isolation is proven by integration tests (create two tenants, assert reads/writes/files blocked).
- Roles (`tenant_memberships.role`): `owner`, `admin`, `office`, `crew`, `read_only`. Platform
  admins bypass via an explicit impersonation/audit flow.

## 4. Schema (greenfield)

Every tenant-owned row carries `tenant_id`. `jsonb` only for genuinely polymorphic content
(component props, slot values, research raw payloads, manifests); structural data is real columns.
Full DDL lands in `migrations/`.

### Identity & tenancy

- `tenants` — `id` uuid pk, `clerk_org_id` unique, `slug` unique, `name`, `status`
  (`draft`/`active`/`suspended`), `created_at`, `updated_at`
- `tenant_memberships` — `id`, `tenant_id` fk, `clerk_user_id`, `role`
  (`owner`/`admin`/`office`/`crew`/`read_only`), `created_at`; unique `(tenant_id, clerk_user_id)`
- `tenant_domains` — `id`, `tenant_id` fk, `hostname` unique, `type` (`subdomain`/`custom`),
  `status` (`reserved`/`pending`/`active`/`failed`), `dns_verified_at`, `activated_at`, `created_at`

### Onboarding (research → profile)

- `onboarding_sessions` — `id`, `tenant_id` nullable fk, `channel` (`voice`/`text`/`web`),
  `status` (`created`/`consenting`/`interviewing`/`researching`/`generating`/`previewing`/
  `claimed`/`expired`), `token` unique, `clerk_user_id` nullable, timestamps
- `consent_records` — `id`, `onboarding_session_id` fk, `purpose`
  (`recording`/`transcription`/`ai_enrichment`/`research`), `status` (`granted`/`withdrawn`),
  `version`, `granted_at`, `withdrawn_at`; unique `(session_id, purpose, version)`
- `text_interview_submissions` — `id`, `onboarding_session_id` fk, `version`, `payload` jsonb,
  `created_at`
- `voice_observability_events` — `id`, `onboarding_session_id` fk, `event_type`, `payload` jsonb
  (sanitized: no raw audio, secrets, or WS headers), `created_at`
- `research_sessions` — `id`, `onboarding_session_id` fk, `status`, `created_at`
- `research_runs` — `id`, `research_session_id` fk, `provider`, `status`, `started_at`, `finished_at`
- `research_events` — `id`, `research_run_id` fk, `event_type`, `payload` jsonb, `created_at`
- `research_sources` — `id`, `research_run_id` fk, `kind`
  (`google_places`/`company_registry`/`facebook`/`website_crawl`/`photo`), `external_id`,
  `source_ref`, `raw` jsonb, `normalized` jsonb, `confidence`, `created_at`
- `google_places_cache` — `id`, `place_id` unique, `payload` jsonb, `cached_at`

### Business profile

- `business_profiles` — `id`, `tenant_id` fk unique, `trade`
  (`roofing`/`landscaping_paving`/`bathroom_renovation`/`kitchen_installation`/`general_builder`/
  `property_maintenance`), `legal_name`, `display_name`, `phone`, `email`, `website`, `brand` jsonb
  (colors/logo_asset_id/tone/typography), `current_version_id` nullable, `created_at`, `updated_at`
- `business_profile_versions` — `id`, `business_profile_id` fk, `version_number`, `facts` jsonb
  (full snapshot), `source_refs` jsonb, `created_by` (`research`/`voice`/`text`/`human`/`llm`),
  `created_at`; unique `(business_profile_id, version_number)`
- `business_profile_services` — `id`, `business_profile_id` fk, `name`, `description`, `slug`,
  `created_at`
- `business_profile_service_areas` — `id`, `business_profile_id` fk, `locality`, `created_at`
- `business_profile_opening_hours` — `id`, `business_profile_id` fk, `day_of_week`, `opens_at`,
  `closes_at`, `closed`

### Website CMS

- `website_pages` — `id`, `tenant_id` fk, `path`, `title`, `page_type`
  (`standard`/`service`/`landing`/`legal`), `status` (`draft`/`published`/`archived`),
  `current_version_id` nullable, `published_version_id` nullable, `seo` jsonb, timestamps;
  unique `(tenant_id, path)`
- `website_page_versions` — `id`, `tenant_id` fk, `page_id` fk, `version_number`, `status`
  (`draft`/`approved`/`published`/`rejected`), `content_snapshot` jsonb, `validation_errors` jsonb,
  `source_refs` jsonb, `created_by`, `created_at`; unique `(page_id, version_number)`
- `website_sections` — `id`, `tenant_id` fk, `page_id` fk, `component_id`, `component_version`,
  `position`, `status` (`visible`/`hidden`), `props` jsonb, `design` jsonb, `source_refs` jsonb;
  unique `(page_id, position)`
- `content_slots` — `id`, `tenant_id` fk, `section_id` fk, `slot_key`, `slot_type`
  (`text`/`rich_text`/`image`/`link`/`list`/`json`), `value` jsonb, `status`
  (`draft`/`reviewed`/`approved`/`rejected`), `source_refs` jsonb, `validation_errors` jsonb;
  unique `(section_id, slot_key)`
- `website_assets` — `id`, `tenant_id` fk, `asset_type` (`image`/`logo`/`document`/
  `generated_image`), `source` (`upload`/`generated`/`imported`/`external`), `status`
  (`draft`/`active`/`archived`), `file_id` nullable, `source_url`, `alt_text`, `focal_point` jsonb,
  `crop` jsonb, `provenance` jsonb, `review_status` (`pending_review`/`approved`/`rejected`),
  `created_at`
- `website_forms` — `id`, `tenant_id` fk, `form_key`, `title`, `status` (`active`/`disabled`),
  `submit_action` (`create_lead`), `fields` jsonb, `privacy_notice`, `created_at`;
  unique `(tenant_id, form_key)`
- `navigation_items` — `id`, `tenant_id` fk, `parent_id` nullable fk, `page_id` nullable fk,
  `location` (`primary`/`footer`/`campaign`), `label`, `path`, `url`, `position`, `status`
  (`visible`/`hidden`)
- `website_publications` — `id`, `tenant_id` fk, `version_number`, `status`
  (`published`/`archived`/`rolled_back`), `active`, `manifest_version`, `site_manifest` jsonb,
  `validation_report` jsonb, `published_by`, `rollback_of_publication_id` nullable, `published_at`;
  unique `(tenant_id, version_number)`
- `website_projects` — `id`, `tenant_id` fk, `title`, `description`, `cover_asset_id` nullable fk,
  `status` (`draft`/`published`), `created_at`, `updated_at`
- `website_certification_selections` — `id`, `tenant_id` fk, `certification_id`, `status`
  (`selected`/`removed`), `created_at`

### Ads (#403)

- `ad_creative_sets` — `id`, `tenant_id` fk, `name`, `status` (`draft`/`needs_review`/
  `ready_to_post`/`archived`), `offer`, `ad_goal` (`more_calls`/`more_quotes`/`promote_service`),
  `service_focus_id` nullable fk, `destination_page_id` nullable fk, `destination_path`, `icp`
  jsonb, `review_status`, `source_refs` jsonb, `created_by`, `updated_by`, `platform_refs` jsonb,
  `platform_status` (`not_connected`/`synced`/`needs_sync`/`error`), timestamps
- `ad_variants` — `id`, `tenant_id` fk, `creative_set_id` fk, `format` (`feed_square`/
  `feed_portrait`/`carousel`/`story`), `status` (`draft`/`needs_review`/`approved`/`hidden`/
  `archived`), `copy_variant_id` fk, `position`, `review_status`, `platform_refs` jsonb, timestamps
- `ad_copy_variants` — `id`, `tenant_id` fk, `headline`, `primary_text`, `description`, `cta_label`
  (`learn_more`/`get_quote`/`call_now`/`message`), `source` (`ai_proposal`/`owner_edit`/
  `operator_edit`/`manual`), `ai_generation_ref`, timestamps
- `ad_image_placements` — `id`, `tenant_id` fk, `variant_id` fk, `media_asset_id` fk, `format`,
  `crop` jsonb, `focal_point` jsonb, `position`, `alt_text`
- `ad_lead_forms` — `id`, `tenant_id` fk, `creative_set_id` fk, `title`, `questions` jsonb,
  timestamps
- `ad_reviews` — review/approval trail (actor, transition, note); sensitive mutations also write
  `audit_events`

### Preview & claim

- `preview_packages` — `id`, `onboarding_session_id` fk, `token` unique, `status`
  (`draft`/`claimed`/`expired`), `personas` jsonb, `unresolved_fields` jsonb, `created_at`
- `preview_events` — `id`, `preview_package_id` fk, `event_type`, `payload` jsonb, `created_at`
- `preview_claims` — `id`, `preview_package_id` fk, `clerk_subject`, `checkout_session_id`,
  `payment_state` (`pending`/`paid`/`failed`/`refunded`), `tenant_id` nullable fk, `activated_at`,
  `created_at`; unique idempotency key

### Leads

- `leads` — `id`, `tenant_id` fk, `source` (`public_form`), `form_id` nullable fk, `contact` jsonb
  (name/phone/email), `message`, `status` (`new`/`contacted`/`closed`), `created_at`

### Cross-cutting

- `ai_generations` — `id`, `tenant_id` nullable fk, `generation_type`, `model`, `prompt_id`,
  `prompt_version`, `input` jsonb, `internal_reasoning` jsonb, `output` jsonb, `tool_calls` jsonb,
  `usage` jsonb, `status` (`running`/`succeeded`/`failed`), `error` nullable, `created_at`
- `files` — `id`, `tenant_id` fk, `owner_type`, `owner_id`, `storage_key`, `original_filename`,
  `content_type`, `byte_size`, `checksum`, `visibility` (`private`/`customer_visible`/`public`),
  `scan_status` (`pending`/`clean`/`failed`/`skipped`), `created_at`
- `audit_events` — `id`, `tenant_id` nullable fk, `actor`, `action`, `entity_type`, `entity_id`,
  `before` jsonb, `after` jsonb, `request_id`, `created_at`
- `stripe_events` — `id`, `event_id` unique, `type`, `payload` jsonb, `processed`, `created_at`
  (webhook idempotency)
- River-managed tables for the job queue.

### Required indexes & constraints (add before production data)

Unique: `tenants.clerk_org_id`, `tenants.slug`, `(tenant_id, website_pages.path)`,
`(tenant_id, website_forms.form_key)`, `(tenant_id, website_publications.version_number)`,
webhook idempotency (`stripe_events.event_id`). Lookup: `(tenant_id, status, created_at)` on
sessions/pages/leads; `(tenant_id, owner_type, owner_id)` on files; `(tenant_id, entity_type,
entity_id, created_at)` on audit. Use DB check constraints for stable enums; state-transition tests
before production use.

## 5. Workflows and state machines

1. **Onboarding session** — `created → consenting → interviewing → researching → profile_draft →
   generating → previewing → claimed/expired`. Research and generation run in parallel where
   possible.
2. **Business profile** — immutable versions; `current_version_id` points at the live version;
   facts carry `source_refs` and `created_by`.
3. **Website page** — `draft → approved → published`; versions are immutable; publish materializes
   a new `website_publications` row (no mutation of history).
4. **Publication** — `published → rolled_back/archived`; rollback reactivates an earlier snapshot.
5. **Claim/activation** — `checkout.session.completed` accepted only after Stripe signature
   verification + metadata matching; activation is idempotent and never driven by a browser success
   URL alone. It links the onboarding session, ensures the owner membership, rebuilds CMS records
   from the selected blueprint, validates + publishes a snapshot, activates the tenant + generated
   domain, and marks the session claimed.
6. **Ad creative** — creation flow `draft → needs_review → ready_to_post → archived`; existing-ad
   statuses `Draft / Creative ready / Published / Archived`. AI is propose-only (drafts copy,
   proposes image galleries from approved media, light cleanup); the owner reviews/edits/approves;
   terminal state is a deterministic export package — never actual posting.

## 6. API surface (condensed)

Route groups (full struct definitions come with the `huma` types):

- `/api/v1/health`
- `/api/v1/me`, `/api/v1/me/organization` (Clerk org provisioning)
- `/api/v1/onboarding-sessions` + nested: company-registry search, google-places
  autocomplete/from-google-place, profile (+ checklist/confirmations/facts), consents, text
  interview, research runs, generation runs, artifacts, preview packages, voice/progress events
- `/api/v1/tenants/{slug}` + business-profile, domains, website (blueprints, pages, forms,
  publications, certifications), memberships
- `/api/v1/website/editor` + pages/sections/slots/assets/projects/publications/business-profile
- `/api/v1/ads` + packages/creatives/export (new)
- `/api/v1/public/site` (resolve/meta/sitemap/assets), `/api/v1/public/forms/{id}/submit`,
  `/api/v1/public/forms/{id}/uploads`
- `/api/v1/preview/{token}` + activate/approve-publish/claim/claim-checkout/claim-status/module/
  package/events/persona/request-changes
- `/api/v1/webhooks/stripe`
- Voice integration boundary (separate service)

## 7. Terminology corrections (apply throughout)

| Old (kill) | New |
| --- | --- |
| `setup`, `setup_session`, `setup_profile` | `onboarding`, `onboarding_session`, `business_profile` |
| `setup_voice_observability_events` | `voice_observability_events` |
| loose `fact` | `profile fact` / `business_profile.*` |
| `cms_projects`, `cms_career_*` | `website_projects`, `website_career_*` |
| `Demo`-prefixed ops; `save` vs `update` | `Create`/`Update`/`Get`/`List`/`Delete`, one `*Read` suffix |
| "OnCall" anywhere | "Placis" only |
| opaque `JsonRecord`/`JsonObjectPayload` wrappers | typed structs; `jsonb` only at persistence/API boundary |

## 8. Rollout phases

Each phase ends with: typed models, migrations applied, integration tests (incl. cross-tenant
isolation), regenerated frontend types, and an E2E test for each major feature.

0. **Foundation** — repo scaffold, `cmd/api` + `cmd/worker`, config, `slog`, Postgres + `goose` +
   `sqlc`, `River`, `huma` skeleton + `/health`, Railway deploy, and CI (CircleCI + GitHub Actions):
   file-size guard, gofmt/vet/lint, build+test (Testcontainers), generated-code freshness
   (sqlc/huma/frontend-typegen), provider isolation, evals local-only.
1. **Auth & tenancy** — Clerk verification → `Principal`, tenant resolution, memberships, domains,
   roles, impersonation/audit, cross-tenant isolation tests.
2. **Onboarding & research & profile** — sessions, consent, text interview, research providers
   (Google Places, company registry, Facebook, website crawl, photo classification), business
   profile with versioned facts.
3. **Blueprints & website** — component/blueprint catalog loaders + JSON Schemas, blueprint
   application, LLM refinement (propose-only), CMS CRUD, publications.
4. **Preview, claim, public site, leads** — preview packages, Stripe checkout + webhooks +
   activation, public resolve/manifest runtime, lead capture.
5. **Ads (#403)** — ad creative sets + variants, propose-only AI, export package, lead attribution.
6. **Auditability hardening** — audit completeness, AI trace completeness, observability.

Voice is a **later milestone**: the provider-agnostic boundary and `voice_observability_events`
table stay in the schema, but the onboarding voice agent + operator console are not built in the
first pass.

## 9. Locked decisions

- **Module path** — `github.com/MRiabov/placis`.
- **API tooling** — `huma` v2 (Go-first: structs derive OpenAPI 3.1 + runtime validation).
- **Clerk** — official `github.com/clerk/clerk-sdk-go/v2` for session/JWT verification (JWKS,
  clock skew, audience, org claim → `ActiveOrganizationID`) and org provisioning
  (`Organizations().Create`). No hand-rolled JWT/JWKS logic or Clerk data types.
- **CI/CD** — CircleCI primary (PR-only, path-filtered, non-mutating); GitHub Actions for emergency
  + Cloudflare deploy; file-size guard (< 800 warn / > 1200 hard error); backend tests
  provider-isolated; evals local-only. See `docs/ci-cd.md`.
- **Voice** — later milestone; provider-agnostic boundary + `voice_observability_events` table are
  kept in the schema, but the onboarding voice agent + operator console are deferred.

## 10. Remaining open items

- **Repo remote** — the new `placis/` repo has no `origin` yet; push to GitHub under `MRiabov`
  when scaffolding begins.
- **Blog posts / careers** — deferred by decision; re-add `page_type=blog_post` and
  `website_career_*` tables only when actually needed.
