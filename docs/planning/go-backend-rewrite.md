# Placis Go Backend — Exhaustive Rewrite Plan

> Status: planning (in discussion). This document is the working plan for the Go rewrite of the
> Placis backend. It supersedes the Python docs (`OnCall/docs/*`), which describe a larger,
> two-track product that was never fully built. Scope decisions below are locked with Maksym.

## 1. Product definition

Placis helps construction companies **not make mistakes with advertisement and marketing**, in a
**done-for-you — delivered into your inbox, so you can DIY too** way. The system researches a
business, builds a business profile, generates a website from a trade website template, lets the owner
edit it (or we do it), and produces ads from the profile and approved media (ad ready to post;
never ad posting).

One loop:

```text
onboard (from their Google Maps listing or company registry record)
  -> a few questions to fill the gaps
  -> business research (Google Places, company registry, Facebook, website crawl, photo classification)
  -> one clear business profile
  -> generate a website from a trade website template (their details fill the blanks)
  -> website copy generation (AI suggests, owner decides)
  -> edit in The CMS (website pages / website sections / website slots / media library / website forms / header/footer)
  -> website publication (a published website copy goes live)
  -> generate ads from the profile + approved media (#403)
```

Cross-cutting: Clerk auth, tenant == Clerk organization (1-1), Postgres multitenancy, LLM + system
auditability, and voice agents as a **separate, optional** channel.

## 2. Scope

### In scope

1. **Identity, auth, tenancy** — Clerk identity + Clerk organizations; tenant == Clerk organization 1-1;
   memberships with roles; domains (generated subdomain + custom website domain).
2. **Onboarding (business research → profile)** — onboarding sessions (start from a Google Maps listing or
   company registry record), client interview, Google Maps / company registry / Facebook / crawl /
   photos, business profile.
3. **Website building from website templates** — trade website templates + website component contracts as static catalog
   data; website template application; website copy generation as governed, propose-only edits.
4. **Website editing (The CMS)** — website pages (kept, never overwritten), website sections, website slots, media
   library, website forms, header/footer, projects, certification selections, website publications.
5. **Contractor website + website lead capture** — resolve active website publication website manifests by host/path; website
   forms persist into a minimal `leads` table.
6. **Website preview + website activation** — website preview links; self-serve Stripe website activation/checkout;
   webhook-driven website activation (safe to replay).
7. **Ad generation (#403)** — ads with per-format variants, copy, and image
   placements built from the profile + approved media; propose-only AI; terminal state is a
   deterministic "ad ready to post" export (no ad posting, no campaign ops — those are future work on
   the same ad service). Spec: `docs/features/ads/ad-generation/`.
8. **Cross-cutting** — AI/LLM layer with mandatory recording of reasoning + output + tool calls;
   files (S3/R2); Stripe payments (activation only); Postgres-backed jobs (River); structured
   logging; audit events.
9. **Voice agents** — separate, optional; swappable voice service; onboarding voice agent.
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
  unshipped `schemas_registry_public.py` API, hard-coded website template imagery as tenant variables.
- **Blog posts and careers** — deferred; `page_type` enum omits `blog_post`; no `website_career_*`
  tables for now.
- **Frontend (`frontend-2`)** — reused mostly, not rebuilt. It is adapted only where the
  huma-derived OpenAPI improves the contract (regenerated `openapi-typescript` types).

### Deferred (later)

Custom-capability coding agents (H7), website component marketplace (L2), QS/tendering (L3), accounting
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
    onboarding/          # session.go, interview.go, orchestrate.go, activation.go
      websitepreview/    #   package.go, events.go (website preview of the unpublished website)
    research/            # service.go + providers/{googleplaces,registry,facebook,crawl,photo}.go
                         # TODO: rename — do not say provider in prose; this folder still does.
    profile/             # profile.go, versions.go, services.go, areas.go, hours.go
    website/             # root types.go, service.go + feature packages
      pages/             #   handler.go, service.go, model.go
      sections/
      slots/
      forms/
      navigation/
      publications/
      projects/
      certifications/
      templates/
    ads/                 # ad.go, variant.go, generate.go, export.go
    media/               # media_assets
    billing/             # checkout.go, webhooks.go (Stripe only)
    leads/               # leads.go
  migrations/            # goose SQL migrations (greenfield)
  catalog/               # website templates + website component contracts (typed structs, kept as catalog versions)
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
| LLM | internal interface; Vercel AI SDK primary, OpenRouter alternative | mandatory recording of reasoning + output + tool calls |
| Payments | Stripe via `stripe-go` SDK | activation checkout only |
| IDs | UUID PKs | `timestamptz` defaults |

`huma` handles JSON request/response endpoints and derives the OpenAPI spec served at
`/openapi.json`. The website preview **SSE** stream and the **voice WebSocket** are raw `net/http`
handlers outside huma.

### Component contract (single source of truth)

Website component contracts (what a `public.hero.image` website section accepts) currently exist twice — TS types
in `packages/public-site-components/` and Python `typed_values.py`. The rewrite uses **one typed
struct per website component, dumped to JSON**, under `catalog/`, consumed by both the TS renderer
(validation) and the Go backend (save and website publication validation). Website templates and website component contracts are
static, versioned catalog data, **not** database rows; the Go backend loads and validates them and
must not hand-duplicate the struct shapes.

### Tenancy and auth rules

- Clerk proves identity + Clerk organization; Placis decides tenant access and permissions.
- `tenants.clerk_org_id` (unique) is the only tenant entry point. No org chooser, no selected-org
  cookie, no client-controlled tenant selector.
- Tenant context is resolved once per request from: authenticated Clerk organization, contractor website hostname,
  preview token, or onboarding session token. Services take `tenantID` explicitly.
- Every tenant-owned row carries `tenant_id`; all primary queries include it; cross-tenant
  isolation is proven by integration tests (create two tenants, assert reads/writes/files blocked).
- Roles (`tenant_memberships.role`): `owner`. Platform admins work across tenants via Clerk native
  impersonation (no custom impersonation).

## 4. Schema (greenfield)

Canonical table definitions live with the feature that owns them — see
[data-model conventions](../general-architecture/data-model.md). Do not copy tables here.

## 5. Workflows and state machines

1. **Onboarding session** — `created → interviewing → generating → previewing → activated`
   (`generation_failed` if applying the website template throws; TODO: rename these statuses).
   Business research runs in the background alongside review/client interview; applying the website
   template starts at client interview complete; website copy generation runs after that and does
   not block website preview or website activation. Website previews expire; the onboarding session
   does not.
2. **Business profile** — profile history; `current_version_id` points at the current row;
   details carry `source_refs` and `created_by`.
3. **Website page** — `unpublished → approved → published`; kept copies are never overwritten; website publication creates a new
   `website_publications` row (profile history untouched).
4. **Website publication** — `published → rolled_back/archived`; website rollback reactivates an earlier published website copy.
5. **Website activation** — `checkout.session.completed` accepted only after Stripe SDK signature
   verification (`webhook.ConstructEvent`) + metadata matching; website activation is safe to replay and
   never driven by a browser success URL alone. It links the onboarding session, ensures the owner
   membership, rebuilds website records as an **unpublished website** from the selected website template (it does **not**
   do website publication), activates the tenant + generated domain, and marks the onboarding session activated. Website publication is
   a separate, later owner action.
6. **Ad** — creation flow `draft → ad_needs_review → ad_ready_to_post → archived`; existing-ad
   statuses `Draft / Creative ready / Published / Archived`. AI is propose-only (drafts copy,
   proposes image galleries from approved media, light cleanup); the owner reviews/edits/approves;
   terminal state is a deterministic export ad set — never actual ad posting.

## 6. API surface (condensed)

Route groups (full struct definitions come with the `huma` types):

- `/api/v1/health`
- `/api/v1/me`, `/api/v1/me/organization` (Clerk organization provisioning)
- `/api/v1/onboarding-sessions` + nested: company-registry search, google-places
  autocomplete/from-google-place, profile (+ checklist/confirmations), client interview, business research runs,
  generation runs, website previews, voice/progress events
- `/api/v1/tenants/{slug}` + business-profile, domains, website (website templates, website pages, website forms,
  website publications, certifications), memberships
- `/api/v1/website/editor` + website pages/website sections/website slots/media assets/projects/website publications/business-profile
- `/api/v1/ads` + ads/export (new)
- `/api/v1/public/site` (resolve/meta/sitemap/assets), `/api/v1/public/forms/{id}/submit`,
  `/api/v1/public/forms/{id}/uploads`
- `/api/v1/preview/{token}` + activate/activation/activation-checkout/activation-status/module/
  website-preview/events/persona/request-changes
- `/api/v1/webhooks/stripe`
- Voice integration boundary (separate service)

## 7. Terminology corrections (apply throughout)

| Old (kill) | New |
| --- | --- |
| `setup`, `setup_session`, `setup_profile` | `onboarding`, `onboarding_session`, `business_profile` |
| loose `fact` | `detail` / `business_profile.*` |
| `cms_projects`, `cms_career_*` | `website_projects`, `website_career_*` |
| `Demo`-prefixed ops; `save` vs `update` | `Create`/`Update`/`Get`/`List`/`Delete`, one `*Read` suffix |
| "OnCall" as the product | "Placis" (keep "OnCall" when naming the predecessor repo) |
| opaque `JsonRecord`/`JsonObjectPayload` wrappers | typed structs; `jsonb` only at persistence/API boundary |

## 8. Rollout phases

Each phase ends with: typed models, migrations applied, integration tests (incl. cross-tenant
isolation), regenerated frontend types, and an E2E test for each major feature.

0. **Foundation** — repo scaffold, `cmd/api` + `cmd/worker`, config, `slog`, Postgres + `goose` +
   `sqlc`, `River`, `huma` skeleton + `/health`, Railway deploy, and CI (CircleCI + GitHub Actions):
   file-size guard, gofmt/vet/lint, build+test (Testcontainers), generated-code freshness
   (sqlc/huma/frontend-typegen), external API isolation, evals local-only.
1. **Auth & tenancy** — Clerk verification → `Principal`, tenant resolution, memberships, domains,
   roles, cross-tenant isolation tests.
2. **Onboarding & business research & profile** — onboarding sessions, client interview, Google Maps /
   company registry / Facebook / crawl / photos
   (Google Places, company registry, Facebook, website crawl, photo classification), business
   profile with profile history.
3. **Website templates & website** — website component/website template catalog loaders + website component contracts, website template
   application, website copy generation (propose-only), CMS CRUD, website publications.
4. **Website preview, website activation, contractor website, website leads** — website previews, Stripe checkout + webhooks +
   website activation, contractor website resolve/website manifest, website lead capture.
5. **Ads (#403)** — ads + variants, propose-only AI, export ad set, ad lead attribution.
6. **Auditability hardening** — audit completeness, AI trace completeness, observability.

Voice is a **later milestone**: the voice service stays swappable, but the onboarding voice
agent is not built in the first pass.

## 9. Locked decisions

- **Module path** — `github.com/MRiabov/placis`.
- **API tooling** — `huma` v2 (Go-first: structs derive OpenAPI 3.1 + runtime validation).
- **Clerk** — official `github.com/clerk/clerk-sdk-go/v2` for session/JWT verification (JWKS,
  clock skew, audience, org claim → `ActiveOrganizationID`) and org provisioning
  (`Organizations().Create`). No hand-rolled JWT/JWKS logic or Clerk data types.
- **Stripe** — official `github.com/stripe/stripe-go` SDK for checkout-session creation and webhook
  signature verification (`webhook.ConstructEvent`). No hand-rolled HMAC/signature code.
- **LLM** — behind an internal interface. Vercel AI SDK is the primary candidate
  (OpenRouter is the alternative — it now adds up to ~15% per transaction). The interface keeps the
  concrete LLM swappable; the Go client choice is an implementation detail behind it.
- **CI/CD** — CircleCI primary (PR-only, path-filtered, non-mutating); GitHub Actions for emergency
  + Cloudflare deploy; file-size guard (< 800 warn / > 1200 hard error); backend tests
  isolated from Google, the LLM, Stripe, and voice; evals local-only. See `docs/ci-cd.md`.
- **Voice** — later milestone; the voice service stays swappable, but the onboarding voice agent
  is deferred.

## 10. Remaining open items

- **Repo remote** — the new `placis/` repo has no `origin` yet; push to GitHub under `MRiabov`
  when scaffolding begins.
- **Blog posts / careers** — deferred by decision; re-add `page_type=blog_post` and
  `website_career_*` tables only when actually needed.
