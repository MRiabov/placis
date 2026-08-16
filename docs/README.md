# Placis Documentation

Docs for the Placis application — a **Go backend** plus the **`frontend-2`** Vite/React client. The
product: a
**done-for-you — delivered into your inbox, so you can DIY too** — marketing and advertising
service for construction companies. We research a business, build a profile, generate and edit a
website from trade blueprints, and suggest and run ads; the owner can do the same edits and ads
themselves through the CMS.

## Reading order

1. [Glossary](glossary.md) — the naming vocabulary (read before naming anything)
2. [Architecture](architecture.md) — stack, module layout, runtime, boundaries
3. [Tenancy, auth, and data model](tenancy-auth-and-data-model.md) — Clerk auth, tenant isolation, full schema
4. [Onboarding](onboarding/README.md) — research and business-profile building
5. [Website CMS](website/README.md) — blueprints, generation, editing, publication
6. [Ads](ads/README.md) — ad generation (#403); the authoritative spec is in [ads/ad-generation/](ads/ad-generation/ADR.md)
7. [AI, audit, and jobs](ai-audit-jobs.md) — LLM traceability, audit events, background jobs, files, payments
8. [CI and delivery](ci-cd.md) — file-size guard, provider isolation, generated-code freshness

## Canonical references

| Topic | Doc |
| --- | --- |
| Stack, module layout, runtime | [architecture.md](architecture.md) |
| Naming / vocabulary | [glossary.md](glossary.md) |
| Auth, tenancy, schema | [tenancy-auth-and-data-model.md](tenancy-auth-and-data-model.md) |
| Onboarding loop (research → profile) | [onboarding/README.md](onboarding/README.md) |
| Website building + editing | [website/README.md](website/README.md) |
| Ad generation | [ads/README.md](ads/README.md) |
| AI trace, audit, jobs, files, payments | [ai-audit-jobs.md](ai-audit-jobs.md) |
| CI and delivery | [ci-cd.md](ci-cd.md) |
| Exhaustive rewrite plan | [planning/go-backend-rewrite.md](planning/go-backend-rewrite.md) |

## Product boundary

One product, one loop:

```text
onboard (from their Google Maps listing or company-registry record)
  -> a few questions -> research -> business profile
  -> website (template + LLM refinement) -> edit (CMS) -> publish
  -> ads from the profile + approved media
```

Done-for-you + DIY: the managed team can research, build, tweak, and run ads; the owner can do
the website edits and ad creation themselves through the CMS.

There is **no** CRM/operations track (leads/quotes/invoices/jobs/workflows). Public-site forms
persist a minimal `leads` table for ad attribution and done-for-you follow-up only.

## Naming

The authoritative **ubiquitous language** is the [Glossary](glossary.md). One rule: product docs
and user-facing text use the business's own words ("business profile", "their website", "publish");
implementation words ("versioned", "normalize", "state machine", `source_refs`) stay in technical
docs and code only.

## Documentation rules

- Update canonical docs when contracts, shipped behavior, data models, provider boundaries, or
  validation gates change.
- Terminology is canonical: `onboarding` (never "setup"), `business_profile` (never
  "setup_profile"), `website_*` (never `cms_*`), `Placis` (never "OnCall"). Domain words come from
  the [Glossary](glossary.md); implementation words never appear in product docs.
- Plans and proposed (unshipped) work live under `planning/`, not here.
