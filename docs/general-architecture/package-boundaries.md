# Package boundaries

Package ownership. Workflows live in the feature docs this list points at.

1. `auth` proves identity via the Clerk Go SDK; `tenancy` decides tenant access
   and permissions. [Auth](../features/other/auth/README.md). Unactivated tenants may have a Clerk organization
   after checkout attach; activation upgrades that same row (`status=active`).
   Tenant ↔ Clerk org is 1-1. Clerk users on that tenant are 1-many. A Clerk
   user is on at most one tenant (`clerk_user_id` unique).
2. `onboarding` owns the onboarding session, client interview, enqueueing
   select-and-copy website template (05) and automatic website copy generation
   (06),
   the wait teaser, contractor copy improvement, on-demand 08 share (preview
   website address), and website activation. `onboarding/websiteeditor` owns
   unpaid website-preview Assistant HTTP
   (`/v1/onboarding/website/assistant/…`) and unpaid policy (5-cap,
   instant apply, allowlist). It reuses `website/assistant` tools and
   `ai.threads` (`thread_kind=cms_assistant`) overlay SQL. CMS `assistant` HTTP
   must not import it. `onboarding/assistant` is Find, Review, and client
   interview only (`tools=[]`). Business research (step 02) only calls
   `etl.StartRun` and mirrors Postgres on SSE (`etl.runs` and the live business
   profile). It does not implement extract or transform. It does not implement
   select or copy of the website template, and it does not do website
   publication. [Onboarding](../features/onboarding/architecture.md).
3. `etl` owns extract **and** transform. `StartRun` only starts runs (cap,
   `enqueue_id`, insert `etl.runs` when an ETL run kind can start, enqueue).
   Adapters and fetch / Google Maps listing SQL live in
   `extract/<etl_run_kind>/`; profile writes live in
   `transform/<etl_run_kind>/`. Callers pass `trigger` and the enabled ETL run
   kinds; the evaluator starts matching rows. The worker calls transform after
   each extract chunk (ETL fast extract, then ETL slow extract); it does not
   wait for the ETL run kind to finish. Do not grow `run.go` into every source.
   [ETL](../features/etl/README.md), [ETL run kind triggers](../features/etl/pipeline/etl-run-kind-triggers.md).
4. `website` owns the editable content model, selecting a website template and
   copying its pages onto the unpublished website (validate website component
   contracts, write unpublished `website_*` rows), and website publication. A
   `website_manifest` is only the validated read model, built at website
   publication time. [Website architecture](../features/website/architecture.md). Onboarding trigger:
   [05 — Select and copy the website template](../features/onboarding/pipeline/05-select-and-copy-website-template.md). `website/assistant` owns the
   governed website-editor tools, plan vs continuous, and Ask first vs instant
   apply. Tools never do website publication. Onboarding 06 calls those tools
   headless. [Website editor tools](../features/website/assistant.md), [website ADR #6](../features/website/ADR.md).
5. `assistant` owns the CMS overlay (hydrate, dispatcher, allowed set,
   `thread_items` / `runs`, `/v1/assistant/…` HTTP). Thread **identity** is
   `ai.threads` (`thread_kind=cms_assistant`). Unactivated tenants get 403
   `tenant_unactivated` on `/v1/assistant/…`. `onboarding/assistant` owns the
   onboarding guide HTTP and knowledge (`/v1/onboarding/assistant/…`, thread
   `thread_kind=onboarding_assistant`) and writes the shared overlay SQL
   (`assistant.thread_items` / `assistant.runs`). `onboarding/websiteeditor`
   owns unpaid website preview Assistant HTTP. Knowledge YAML lives in those
   packages (`go:embed`). Shared product glossary and Voice pronunciation live
   in `internal/knowledge/` (onboarding must not import `internal/assistant`).
   [Assistant](../features/assistant/README.md). [Onboarding website editor](../features/onboarding/website-editor.md).
6. `ads` is a standalone service (the `/cms/ads` workspace is one owner). It
   reads the profile + approved media library items, proposes copy + image
   galleries, and exports `ad ready to post` ad sets — never does ad posting.
   Ads generate / revise stay in `ads`. Ads Assistant write is `cleanup_image`.
   **Inline AI assistance** is those screens’ control, not a second dispatcher.
   Ads tools stay in `ads`. [Ads](../features/ads/README.md).
7. `ai` is every vendor AI interface (`LLMProvider` generate, Voice
   adapter, image generate/cleanup on that generate): `thread_id`,
   `bill_usage` (same [`BillUsageMode`](../glossary.md#billusagemode)
   as ETL `StartRun` and any external spend), traces /
   `ai_generations`. Open-web search is a tool on generate. The
   implementation **calls** `AssertUsageCredit` / `RecordAIUseSpend`.
   No website or ads business rules, no tool registries that mutate
   product rows, and no product prompt prose (`prompts.yaml` lives in
   the feature that calls the LLM). Postgres schema `ai`.
   [AI layer](ai-layer.md).
8. `billing` owns the AI use ledger, the Stripe Subscription after 09,
   the Price cache, and Usage & billing. Stripe website activation
   Checkout (activation Price plus Placis Pro plan / month) stays in onboarding.
   Extra usage credit checkout, pay-again, cancel, and keep live here.
   Change plan while `active` is deferred.
   [Billing](../features/billing/README.md).
9. Integrations (ETL adapters, LLM, storage, Stripe, email/SMS) are behind
   interfaces so tests run without network calls. [CI and delivery](ci-cd.md).
