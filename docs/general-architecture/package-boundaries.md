# Package boundaries

Package ownership. Workflows live in the feature docs this list points at.

1. `auth` proves identity via the Clerk Go SDK; `tenancy` decides tenant access
   and permissions. [Auth](../features/other/auth/README.md). Unactivated tenants have no Clerk organization;
   activation upgrades that row.
2. `onboarding` owns the onboarding session, client interview, enqueueing
   apply-the-website-template (05) and website copy generation (06), website
   preview, and website activation. Business research (step 02) only calls
   `etl.StartRun` and mirrors Postgres on SSE (`etl.runs` and the live business
   profile). It does not implement extract or transform. It does not implement
   apply, and it does not do website publication. [Onboarding](../features/onboarding/architecture.md).
3. `etl` owns extract **and** transform. `StartRun` only starts runs (cap,
   `enqueue_id`, `etl.runs`, enqueue). Adapters and fetch / Google Maps listing
   SQL live in `extract/<kind>/`; profile writes live in `transform/<kind>/`.
   Callers pass explicit `kinds` to `StartRun`. The worker calls transform after
   each extract chunk (fast extract, then slow extract); it does not wait for
   the kind to finish. Do not grow `run.go` into every source. [ETL](../features/etl/README.md).
4. `website` owns the editable content model, applying a website template
   (validate website component contracts, write unpublished `website_*` rows),
   and website publication. A `website_manifest` is only the validated read
   model, built at website publication time. [Website architecture](../features/website/architecture.md). Onboarding
   trigger: [05 — Apply the website template](../features/onboarding/pipeline/05-apply-website-template.md). `website/assistant` owns the
   governed website-editor tools, plan vs continuous, and Ask first vs instant
   apply. Tools never do website publication. Onboarding 06 calls those tools
   headless. [Website assistant](../features/website/assistant.md), [website ADR #6](../features/website/ADR.md).
5. `ads` is a standalone service (the `/cms/ads` workspace is one owner). It
   reads the profile + approved media library items, proposes copy + image
   galleries, and exports `ad ready to post` ad sets — never does ad posting.
   Ads tools stay in `ads`. [Ads](../features/ads/README.md).
6. `ai` is the `LLMProvider` interface (and the one implementation behind it):
   generate, open-web search, traces / `ai_generations`. No website or ads
   business rules, and no tool registries that mutate product rows. [LLM layer](llm-layer.md).
7. `billing` owns the AI use ledger and Usage & billing. Stripe website
   activation checkout stays in onboarding. Extra usage credit checkout may live
   here when that slice lands. [Billing](../features/billing/README.md).
8. Integrations (ETL adapters, LLM, storage, Stripe, email/SMS) are behind
   interfaces so tests run without network calls. [CI and delivery](ci-cd.md).
