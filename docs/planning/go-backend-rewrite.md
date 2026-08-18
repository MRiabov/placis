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
onboard (from their Google Maps listing or company-registry record)
  -> a few questions to fill the gaps
  -> research the business (Google Places, company registry, Facebook, website crawl, photo classification)
  -> one clear business profile
  -> generate a website from a trade template (their details fill the blanks)
  -> LLM refinement (AI suggests, owner decides)
  -> edit in the CMS (pages / sections / slots / assets / forms / navigation)
  -> publish (a frozen copy goes live)
  -> generate ads from the profile + approved media (#403)
```

Cross-cutting: Clerk auth, tenant == Clerk org (1-1), Postgres multitenancy, LLM + system
auditability, and voice agents as a **separate, optional** channel.

## 2. Scope

### In scope

1. **Identity, auth, tenancy** — Clerk identity + organizations; tenant == Clerk org 1-1;
   memberships with roles; domains (generated subdomain + custom).
2. **Onboarding (research → profile)** — onboarding sessions (start from a Google Maps listing or
   company-registry record), interview, research providers, business profile.
3. **Website building from blueprints** — trade blueprints + component contracts as static catalog
   data; blueprint application; LLM refinement as governed, propose-only edits.
4. **Website editing (CMS)** — pages (+ immutable versions), sections, content slots, assets/media
   library, forms, navigation, projects, certification selections, publications.
5. **Public website + lead capture** — resolve active publication manifests by host/path; public
   forms persist into a minimal `leads` table.
6. **Preview + claim/activation** — signed preview packages; self-serve Stripe claim/checkout;
   webhook-driven activation (safe to replay).
7. **Ad generation (#403)** — creative sets (the "ad") with per-format variants, copy, and image
   placements built from the profile + approved media; propose-only AI; terminal state is a
   deterministic "ready to post" export (no posting, no campaign ops — those are future work on
   the same creative service). Spec: `docs/features/ads/ad-generation/`.
8. **Cross-cutting** — AI/LLM layer with mandatory recording of reasoning + output + tool calls;
   files (S3/R2); Stripe payments (activation only); Postgres-backed jobs (River); structured
   logging; audit events.
9. **Voice agents** — separate, optional; provider-agnostic interface; onboarding voice agent.
   Kept only as a communication channel into the system.

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
- **Frontend (`frontend-2`)** — reused mostly, not rebuilt. It is adapted only where the
  huma-derived OpenAPI improves the contract (regenerated `openapi-typescript` types).

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
    onboarding/          # session.go, interview.go, orchestrate.go, claim.go
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
  catalog/               # blueprints + component contracts (typed structs, versioned)
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
| Jobs | `River` | Postgres-backed, typed args, safe retries |
| Config | env -> typed struct, validated at startup | |
| Logging | `log/slog` | structured, request IDs |
| Storage | `aws-sdk-go-v2/service/s3` | R2 in prod, MinIO/local FS in dev |
| LLM | provider interface; Vercel AI SDK primary, OpenRouter alternative | mandatory recording of reasoning + output + tool calls |
| Payments | Stripe via `stripe-go` SDK | activation checkout only |
| IDs | UUID PKs | `timestamptz` defaults |

`huma` handles JSON request/response endpoints and derives the OpenAPI spec served at
`/openapi.json`. The preview **SSE** stream and the **voice WebSocket** are raw `net/http`
handlers outside huma.

### Component contract (single source of truth)

Component contracts (what a `public.hero.image` section accepts) currently exist twice — TS types
in `packages/public-site-components/` and Python `typed_values.py`. The rewrite uses **one typed
struct per component, dumped to JSON**, under `catalog/`, consumed by both the TS renderer
(validation) and the Go backend (save/publish validation). Blueprints and component contracts are
static, versioned catalog data, **not** database rows; the Go backend loads and validates them and
must not hand-duplicate the struct shapes.

### Tenancy and auth rules

- Clerk proves identity + organization; Placis decides tenant access and permissions.
- `tenants.clerk_org_id` (unique) is the only tenant entry point. No org chooser, no selected-org
  cookie, no client-controlled tenant selector.
- Tenant context is resolved once per request from: authenticated Clerk org, public site hostname,
  signed preview token, or onboarding session token. Services take `tenantID` explicitly.
- Every tenant-owned row carries `tenant_id`; all primary queries include it; cross-tenant
  isolation is proven by integration tests (create two tenants, assert reads/writes/files blocked).
- Roles (`tenant_memberships.role`): `owner`, `admin`, `office`, `crew`, `read_only`. Platform
  admins work across tenants via Clerk native impersonation (no custom impersonation).

## 4. Schema (greenfield)

Canonical table definitions live with the feature that owns them — see
[data-model conventions](../general-architecture/data-model.md). Do not copy tables here.

## 5. Workflows and state machines

1. **Onboarding session** — `created → interviewing → generating → previewing → claimed`
   (`generation_failed` if generate throws). Research runs in the background alongside
   review/interview; generate starts at interview complete; copy generation runs after
   instantiate and does not block preview or claim. Preview packages expire; the session does not.
2. **Business profile** — immutable versions; `current_version_id` points at the live version;
   details carry `source_refs` and `created_by`.
3. **Website page** — `draft → approved → published`; versions are immutable; publish creates a new
   `website_publications` row (history untouched).
4. **Publication** — `published → rolled_back/archived`; rollback reactivates an earlier version.
5. **Claim/activation** — `checkout.session.completed` accepted only after Stripe SDK signature
   verification (`webhook.ConstructEvent`) + metadata matching; activation is safe to replay and
   never driven by a browser success URL alone. It links the onboarding session, ensures the owner
   membership, rebuilds CMS records as a **draft** from the selected blueprint (it does **not**
   publish), activates the tenant + generated domain, and marks the session claimed. Publishing is
   a separate, later user action.
6. **Ad creative** — creation flow `draft → needs_review → ready_to_post → archived`; existing-ad
   statuses `Draft / Creative ready / Published / Archived`. AI is propose-only (drafts copy,
   proposes image galleries from approved media, light cleanup); the owner reviews/edits/approves;
   terminal state is a deterministic export package — never actual posting.

## 6. API surface (condensed)

Route groups (full struct definitions come with the `huma` types):

- `/api/v1/health`
- `/api/v1/me`, `/api/v1/me/organization` (Clerk org provisioning)
- `/api/v1/onboarding-sessions` + nested: company-registry search, google-places
  autocomplete/from-google-place, profile (+ checklist/confirmations), interview, research runs,
  generation runs, artifacts, preview packages, voice/progress events
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
   roles, cross-tenant isolation tests.
2. **Onboarding & research & profile** — sessions, interview, research providers
   (Google Places, company registry, Facebook, website crawl, photo classification), business
   profile with history.
3. **Blueprints & website** — component/blueprint catalog loaders + component contracts, blueprint
   application, LLM refinement (propose-only), CMS CRUD, publications.
4. **Preview, claim, public site, leads** — preview packages, Stripe checkout + webhooks +
   activation, public resolve/manifest runtime, lead capture.
5. **Ads (#403)** — ad creative sets + variants, propose-only AI, export package, lead attribution.
6. **Auditability hardening** — audit completeness, AI trace completeness, observability.

Voice is a **later milestone**: the provider-agnostic boundary stays, but the onboarding voice
agent is not built in the first pass.

## 9. Locked decisions

- **Module path** — `github.com/MRiabov/placis`.
- **API tooling** — `huma` v2 (Go-first: structs derive OpenAPI 3.1 + runtime validation).
- **Clerk** — official `github.com/clerk/clerk-sdk-go/v2` for session/JWT verification (JWKS,
  clock skew, audience, org claim → `ActiveOrganizationID`) and org provisioning
  (`Organizations().Create`). No hand-rolled JWT/JWKS logic or Clerk data types.
- **Stripe** — official `github.com/stripe/stripe-go` SDK for checkout-session creation and webhook
  signature verification (`webhook.ConstructEvent`). No hand-rolled HMAC/signature code.
- **LLM provider** — behind an internal provider interface. Vercel AI SDK is the primary candidate
  (OpenRouter is the alternative — it now adds up to ~15% per transaction). The interface keeps the
  concrete provider swappable; the Go client choice is an implementation detail behind it.
- **CI/CD** — CircleCI primary (PR-only, path-filtered, non-mutating); GitHub Actions for emergency
  + Cloudflare deploy; file-size guard (< 800 warn / > 1200 hard error); backend tests
  provider-isolated; evals local-only. See `docs/ci-cd.md`.
- **Voice** — later milestone; provider-agnostic boundary is kept, but the onboarding voice agent
  is deferred.

## 10. Remaining open items

- **Repo remote** — the new `placis/` repo has no `origin` yet; push to GitHub under `MRiabov`
  when scaffolding begins.
- **Blog posts / careers** — deferred by decision; re-add `page_type=blog_post` and
  `website_career_*` tables only when actually needed.
