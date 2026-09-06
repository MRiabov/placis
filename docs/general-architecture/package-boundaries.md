# Package boundaries

Package ownership. Workflows live in the feature docs this list points
at. Trees: [module layout](module-layout.md). [ADR](ADR.md) 4–6.

1. `infrastructure/tenancy` decides tenant access and permissions.
   `infrastructure/tenancy/auth` proves identity via the Clerk Go SDK
   (`VerifySession` → `Principal`) and hosts Auth-mode helpers every
   `Register` **picks**. [Tenancy](../infrastructure/tenancy/README.md).
   Unactivated tenants may have a Clerk organization after checkout
   attach; activation upgrades that same row (`status=active`). Tenant ↔
   Clerk org is 1-1. Clerk users on that tenant are 1-many. A Clerk user
   is on at most one tenant (`clerk_user_id` unique).
2. `onboarding` owns the onboarding session, client interview, enqueueing
   select-and-copy website template (05) and automatic website copy
   generation (06), the wait teaser, contractor copy improvement,
   on-demand 08 share (preview website address), and website activation.
   `onboarding/websiteeditor` owns unpaid website-preview Assistant HTTP
   (`/v1/onboarding/website/assistant/…`) and unpaid policy (5-cap,
   instant apply, allowlist). It **calls** website editor Dos
   (`editor.go`) and `website/assistant` tools and reuses `ai.threads`
   (`thread_kind=cms_assistant`) overlay SQL. CMS `assistant` HTTP must
   not import it. `onboarding/assistant` is Find, Review, and client
   interview only (`tools=[]`). `onboarding/media` wraps
   `/v1/onboarding/media-assets` (token only; no crop / replace /
   cleanup) and **calls** `profile/media`.
   `onboarding/details` wraps unactivated PATCH/undo and **calls**
   `profile` `service.go`. Business research (step 02) only **calls**
   `etl.StartRun` and mirrors Postgres on SSE (`etl.runs` and the live
   business profile). It does not implement extract or transform. It
   does not implement select or copy of the website template, and it
   does not do website publication.
   [Onboarding](../features/onboarding/architecture.md).
3. `etl` owns extract **and** transform. `StartRun` (`service.go`) only
   starts runs (cap, `enqueue_id`, insert `etl.runs` when an ETL run
   kind can start, enqueue). Adapters and fetch / Google Maps listing
   SQL live in `extract/<etl_run_kind>/`; profile writes **call**
   `profile` `service.go` from `transform/<etl_run_kind>/`. Callers pass
   `trigger` and the enabled ETL run kinds; the evaluator starts
   matching rows. The worker calls transform after each extract chunk
   (ETL fast extract, then ETL slow extract); it does not wait for the
   ETL run kind to finish. Do not grow `run.go` into every source. `etl`
   must not import onboarding.
   [ETL](../features/etl/README.md),
   [ETL run kind triggers](../features/etl/pipeline/etl-run-kind-triggers.md).
4. `profile` owns the live business profile. Outsiders **call**
   `service.go` (and `profile/media` for the library) with `tenantID` +
   shared `pgx.Tx`. They do not copy `business_profile` SQL and do not
   import `profile/store` or `profile/media/store`. CMS `details/` HTTP
   **calls** `service.go` too. Certifications and reviews are separate
   Registers (`profile/certifications/`, `profile/reviews/`) on one
   screen. [Details](../features/business-profile/details/architecture.md).
5. `website` owns the editable content model, selecting a website
   template and copying its pages onto the unpublished website (validate
   website component contracts, write unpublished `website_*` rows), and
   website publication. A `website_manifest` is only the validated read
   model, built at website publication time.
   [Website architecture](../features/website/architecture.md).
   Onboarding trigger:
   [05 — Select and copy the website template](../features/onboarding/pipeline/05-select-and-copy-website-template.md).
   `website/assistant` owns the governed website-editor tools, plan vs
   continuous, and Ask first vs instant apply. Tools never do website
   publication. Onboarding 06 calls those tools headless. Website editor
   Dos (`editor.go`) must not import `website/assistant`.
   [Website editor tools](../features/website/assistant.md),
   [website ADR #6](../features/website/ADR.md).
6. `assistant` owns the CMS overlay (hydrate, dispatcher, allowed set,
   `thread_items` / `runs`, `/v1/assistant/…` HTTP). Thread **identity**
   is `ai.threads` (`thread_kind=cms_assistant`). Unactivated tenants get
   403 `tenant_unactivated` on `/v1/assistant/…`. The dispatcher
   **calls** `website/assistant` and `ads/assistant`; it does not import
   those pipelines. `onboarding/assistant` owns the onboarding guide HTTP
   (`/v1/onboarding/assistant/…`, thread
   `thread_kind=onboarding_assistant`) and writes the shared overlay SQL.
   Knowledge YAML lives in that assistant’s `knowledge/` (`go:embed`).
   Assistants must not import each other’s knowledge folders.
   `infrastructure/ai` load/interpolate only.
   [Assistant](../features/assistant/README.md).
   [Onboarding website editor](../features/onboarding/website-editor.md).
7. `ads` is a standalone service (the `/cms/ads` workspace is one
   owner). Day-one product lives in `ads/generation/`. CMS Ads tools
   live in `ads/assistant/` (`cleanup_image`). It reads the profile +
   approved media library items (**calls** `profile` / `profile/media`),
   proposes copy + image galleries, and exports `ad ready to post` ad
   sets — never does ad posting. Ads generate / revise stay in
   `ads/generation`. **Inline AI assistance** is those screens’ control,
   not a second dispatcher. [Ads](../features/ads/README.md).
8. `infrastructure/ai` is every vendor AI interface (`LLMProvider`
   generate, Voice adapter, image generate/cleanup on that generate):
   `thread_id`, `bill_usage` (same
   [`BillUsageMode`](../glossary.md#billusagemode) as ETL `StartRun` and
   any external spend), traces / `ai_generations`. Open-web search is a
   tool on generate. The implementation **calls** `AssertUsageCredit` /
   `RecordAIUseSpend`. No website or ads business rules, no tool
   registries that mutate product rows, and no product prompt prose
   (`prompts.yaml` lives in the feature that calls the LLM). Postgres
   schema `ai`. [AI layer](../infrastructure/ai/README.md).
9. `billing` owns the AI use ledger, the Stripe Subscription after 09,
   the Price cache, and Usage & billing. Stripe website activation
   Checkout (activation Price plus Placis Pro plan / month) stays in
   onboarding. Extra usage credit checkout, pay-again, cancel, and keep
   live here. Change plan while `active` is deferred. `billing` must not
   import `ai`. [Billing](../features/billing/README.md).
10. `leads` owns website-form contacts. Website and ads **call**
    `service.go`. [Leads](../features/other/leads/README.md).
11. Integrations (ETL adapters, LLM, storage, Stripe, email/SMS) are
    behind interfaces so tests run without network calls. Fakes sit
    beside the collaborator (`fake.go` in that package). No
    `onboarding/research/`.
    [CI and delivery](ci-cd.md).

Forbidden compile-time edges: `profile` → onboarding / website / ads;
`etl` → onboarding; `billing` → `ai`; website editor Dos →
`website/assistant`; `onboarding/assistant` → `internal/assistant`;
`pipeline/` → `api/` or `httpapi`; both Contractor copy improvement →
`websiteeditor` and reverse (wrapper HTTP **calls** that pipeline step
only). Features do not import `httpapi`. CI:
[import DAG check](ci-cd.md).
