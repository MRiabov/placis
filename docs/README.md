# Placis Documentation

Docs for the Placis application — a **Go backend** plus the **`frontend-2`** Vite/React client. The
product: a
**done-for-you — delivered into your inbox, so you can DIY too** — marketing and advertising
service for construction companies. We research a business, build a profile, generate and edit a
website from trade templates, and suggest and run ads; the owner can do the same edits and ads
themselves through the CMS.

## Reading order

1. [Development principles](development-principles.md) — how work is sliced and reviewed (read before writing code)
2. [Glossary](glossary.md) — the naming vocabulary (read before naming anything)
3. [Architecture](architecture.md) — stack, module layout, runtime, boundaries
4. [Tenancy, auth, and data model](tenancy-auth-and-data-model.md) — Clerk auth, tenant isolation, full schema
5. [Onboarding](features/onboarding/README.md) — research and business-profile building
6. [Website CMS](features/website/README.md) — blueprints, generation, editing, publication
7. [Ads](features/ads/README.md) — ad generation (#403); the authoritative spec is in [features/ads/ad-generation/](features/ads/ad-generation/ADR.md)
8. [AI, audit, and jobs](ai-audit-jobs.md) — LLM traceability, audit events, background jobs, files, payments
9. [CI and delivery](ci-cd.md) — file-size guard, provider isolation, generated-code freshness

## Canonical references

| Topic | Doc |
| --- | --- |
| Stack, module layout, runtime | [architecture.md](architecture.md) |
| How work is sliced and reviewed | [development-principles.md](development-principles.md) |
| Naming / vocabulary | [glossary.md](glossary.md) |
| Auth, tenancy, schema | [tenancy-auth-and-data-model.md](tenancy-auth-and-data-model.md) |
| Onboarding loop (research → profile) | [features/onboarding/README.md](features/onboarding/README.md) |
| Website building + editing | [features/website/README.md](features/website/README.md) |
| Ad generation | [features/ads/README.md](features/ads/README.md) |
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
