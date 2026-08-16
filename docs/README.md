# Placis Documentation

Docs for the Placis backend (Go) and the shared contracts it owns. The product: a
**done-for-you — delivered into your inbox, so you can DIY too** — marketing and advertising
service for construction companies. We research a business, build a profile, generate and edit a
website from trade blueprints, and suggest and run ads; the owner can do the same edits and ads
themselves through the CMS.

## Reading order

1. [Architecture](architecture.md) — stack, module layout, runtime, boundaries
2. [Tenancy, auth, and data model](tenancy-auth-and-data-model.md) — Clerk auth, tenant isolation, full schema
3. [Onboarding](onboarding.md) — research and business-profile building
4. [Website CMS](website-cms.md) — blueprints, generation, editing, publication
5. [Ads](ads.md) — ad generation (#403); the authoritative spec is in [ads/ad-generation/](ads/ad-generation/ADR.md)
6. [AI, audit, and jobs](ai-audit-jobs.md) — LLM traceability, audit events, background jobs, files, payments

## Canonical references

| Topic | Doc |
| --- | --- |
| Stack, module layout, runtime | [architecture.md](architecture.md) |
| Auth, tenancy, schema | [tenancy-auth-and-data-model.md](tenancy-auth-and-data-model.md) |
| Onboarding loop (research → profile) | [onboarding.md](onboarding.md) |
| Website building + editing | [website-cms.md](website-cms.md) |
| Ad generation | [ads.md](ads.md) |
| AI trace, audit, jobs, files, payments | [ai-audit-jobs.md](ai-audit-jobs.md) |
| Exhaustive rewrite plan | [planning/go-backend-rewrite.md](planning/go-backend-rewrite.md) |

## Product boundary

One product, one loop:

```text
onboard (voice / text / web) -> consent -> research -> business profile
  -> website (blueprint + LLM refinement) -> edit (CMS) -> publish
  -> ads from the profile + approved media
```

Done-for-you + DIY: the managed team can research, build, tweak, and run ads; the owner can do
the website edits and ad creation themselves through the CMS.

There is **no** CRM/operations track (leads/quotes/invoices/jobs/workflows). Public-site forms
persist a minimal `leads` table for ad attribution and done-for-you follow-up only.

## Documentation rules

- Update canonical docs when contracts, shipped behavior, data models, provider boundaries, or
  validation gates change.
- Terminology is canonical: `onboarding` (never "setup"), `business_profile` (never
  "setup_profile"), `website_*` (never `cms_*`), `Placis` (never "OnCall").
- Plans and proposed (unshipped) work live under `planning/`, not here.
