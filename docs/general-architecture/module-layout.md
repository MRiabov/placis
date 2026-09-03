# Module layout

Target Go layout. `cmd/ci` exists today; `internal/` product packages are still
the target.

```text
cmd/
  api/            # HTTP API server + in-process River
  ci/             # CI/dev checks (not deployed); check-dont-say, check-pipeline-tables, check-docs-code, check-happy-path, later folder fan-out, …
internal/
  # shared / cross-cutting (small, few files each)
  config/         # typed config from env
  httpapi/        # router, middleware, error mapping, huma API registration
  auth/           # Clerk SDK (clerk-sdk-go): Sessions().Verify -> Principal; Users().Create; Organizations().Create
  store/          # pgx pool + sqlc-generated queries (queries/*.sql split by domain)
  ai/             # vendor AI interfaces + threads + traces (schema `ai`; same bill_usage enum as ETL; no feature tool registries)
  knowledge/      # shared product glossary + Voice pronunciation (listed by both assistants)
  files/          # object storage, signed URLs
  jobs/           # River job args + workers
  audit/          # audit events

  # product domains — feature-nested: one package per feature, split a package
  # only when it grows past ~800 lines (never flat file dumps).
  tenancy/        # tenants.go, memberships.go
  onboarding/     # onboarding.go, client_interview.go, orchestrate.go, activation.go
    websitepreview/ #   package.go, events.go (08 R2 write + SSE for wait teaser)
    websiteeditor/  #   unpaid website preview HTTP + policy (not CMS /v1/assistant)
    assistant/    #   Find, Review, and client interview (isolated conversation + knowledge)
  etl/            # run.go (StartRun: cap, enqueue_id, insert etl.runs when an ETL run kind can start)
    extract/      #   googlemaps/, facebook/, instagram/, crawl/, traderegistry/,
                  #   websearch/ — each with fakes; worker calls these, does not inline
    transform/    #   googlemaps/, facebook/, instagram/, crawl/,
                  #   projects/ — live business profile, posts,
                  #   Projects from source; after each extract chunk
  profile/        # profile.go, profile_edits.go, services.go, areas.go, hours.go, certifications.go
  website/        # root owns websites.go (parent row + prefix)
    pages/        #   handler.go, service.go, model.go
    sections/
    slots/
    forms/
    topmenu/
    footer/
    publications/
    projects/
    templates/
    assistant/    #   governed website-editor tools (Ask first / instant apply)
    addresses/    #   website_addresses.go (live hostnames; not auth)
  assistant/      # CMS thread, dispatcher, /v1/assistant HTTP, knowledge YAML
  ads/            # ad.go, variant.go, generate.go
  media/          # media_assets
  billing/        # AI use ledger, Usage & billing HTTP
  leads/          # leads.go
migrations/       # goose SQL migrations (greenfield)
apps/
  contractor-website/  # Astro + React islands (Cloudflare Workers); one Worker for every tenant
  placis-website/      # Astro static; R2 origin for placis.com
  demo/                # Look app (Vite + Tailwind). Own lockfile; not a workspace member. Run from apps/demo. Sync: scripts/sync-look-demo.sh
packages/
  website-components/  # website templates, website component renderers + contract.json, website style catalog presets
catalog/          # later: typed structs dumped to JSON; first-pass JSON sidecars live in packages/website-components
frontend-2/       # CMS + onboarding including `/onboarding/preview-and-edit/`
docs/
go.mod
```

Rules:

- **Feature-nested, not flat**: one package per feature; a leaf package starts
  as a single file and splits only when it grows. Enforce the file-size guard (<
  800 lines warning, > 1200 hard error) in CI — never flat file dumps.
  `apps/demo/src` hard-fails at 800 ([CI decision 1](ci-cd.md#decisions)).
- **Folder fan-out** (predecessor `check_folder_fanout`): a nested package dir
  may hold at most **9** entries (tracked files + child dirs). `internal/` root
  may hold at most **15**. Split a fat folder into a nested package. Scope is
  `internal/` (the old `backend/app`); not `docs/`, `frontend-2/`, or
  `packages/` in this pass. See [CI and delivery](ci-cd.md).
- Shared types live in exactly one package — no forked duplicates.
- Each feature that calls the LLM owns `prompts.yaml` in that package, not
  prompt strings in Go. Variables are `{{var}}` and dotted `{{aaa.bbb}}`.
  [LLM layer](llm-layer.md).
- Route handlers validate input (huma) and call service functions; services own
  business rules and transactions; models are persistence only.
- Service functions accept `tenantID` explicitly; they never infer it from
  ambient request data.
- See [CI and delivery](ci-cd.md) for the delivery gates (file-size guard, folder fan-out,
  external API isolation, generated-code freshness).

`frontend-2` keeps its own feature-local structure and is not folded into
`internal/`; the file-size guard applies to it too. Folders: [frontend stack](frontend-stack.md).
