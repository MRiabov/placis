# Package boundaries

Package ownership. Workflows live in the feature docs this list points at.

1. `auth` proves identity via the Clerk Go SDK; `tenancy` decides tenant access and permissions.
   [Auth](../features/other/auth/README.md). Unactivated tenants have no Clerk organization;
   activation upgrades that row.
2. `onboarding` owns the onboarding session, profile building, enqueueing apply-the-website-template (05)
   and website copy generation (06), website preview, and website activation. It enqueues the
   first [ETL](../features/other/etl/README.md) run (02); it does not own adapters, fetches, or
   listing tables. It does not implement apply, and it does not do website publication.
   [Onboarding](../features/onboarding/architecture.md).
3. `etl` owns public-source extract (Maps, Facebook including posts, crawl, photo classification),
   append-only fetches, watermarks, and load into the fold / media library. Scheduled runs
   continue after website activation. [ETL](../features/other/etl/architecture.md).
4. `website` owns the editable content model, applying a website template (validate website component
   contracts, write unpublished `website_*` rows), and website publication. A `website_manifest` is
   only the validated read model, built at website publication time.
   [Website architecture](../features/website/architecture.md). Onboarding trigger:
   [05 — Apply the website template](../features/onboarding/pipeline/05-apply-website-template.md).
   `website/assistant` owns the governed website-editor tools, plan vs continuous, and Ask first vs
   instant apply. Tools never do website publication. Onboarding 06 calls those tools headless.
   [Website assistant](../features/website/assistant.md), [website ADR #6](../features/website/ADR.md).
5. `ads` is a standalone service (the `/cms/ads` workspace is one owner). It reads the profile +
   approved media library items, proposes copy + image galleries, and exports `ad ready to post`
   ad sets — never does ad posting. Ads tools stay in `ads`. [Ads](../features/ads/README.md).
6. `ai` is the `LLMProvider` interface (and the one implementation behind it): generate, open-web
   search, traces / `ai_generations`. No website or ads business rules, and no tool registries that
   mutate product rows. [LLM layer](llm-layer.md).
7. Integrations (business research, LLM, storage, Stripe, email/SMS) are behind interfaces so tests
   run without network calls. [CI and delivery](ci-cd.md).
