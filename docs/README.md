# Placis Documentation

Docs for the Placis application — a **Go backend** plus the **`frontend-2`** Vite/React client. The
product: a
**done-for-you — delivered into your inbox, so you can DIY too** — marketing and advertising
service for construction companies. We research a business, build a profile, generate and edit a
website from trade templates, and suggest and run ads; the owner can do the same edits and ads
themselves through the CMS.

## Reading order

1. [Development principles](development-principles.md) — how work is sliced and reviewed (read before writing code)
2. [Docs conventions](docs-conventions.md) — how the docs tree is structured and written
3. [Glossary](glossary.md) — the naming vocabulary (read before naming anything)
4. [Architecture](architecture.md) — stack, module layout, runtime, boundaries
5. [General architecture](general-architecture/README.md) — LLM layer, audit, jobs, files, data model
6. [Auth](features/other/auth/README.md) — Clerk, tenant == org, roles
7. [Onboarding](features/onboarding/README.md) — research and business-profile building; [claim](features/onboarding/pipeline/07-claim.md) is pay-and-activate
8. [Website CMS](features/website/README.md) — blueprints, generation, editing, publication
9. [Ads](features/ads/README.md) — ad generation (#403); the authoritative spec is in [features/ads/ad-generation/](features/ads/ad-generation/ADR.md)
10. [Leads](features/other/leads/README.md) — public-form contacts for attribution and follow-up
11. [CI and delivery](ci-cd.md) — file-size guard, provider isolation, generated-code freshness
12. [Testing](testing.md) — the per-feature E2E tests

## Canonical references

| Topic | Doc |
| --- | --- |
| Stack, module layout, runtime | [architecture.md](architecture.md) |
| How work is sliced and reviewed | [development-principles.md](development-principles.md) |
| How docs are structured and written | [docs-conventions.md](docs-conventions.md) |
| Naming / vocabulary | [glossary.md](glossary.md) |
| Auth | [features/other/auth/README.md](features/other/auth/README.md) |
| Data model conventions + index | [general-architecture/data-model.md](general-architecture/data-model.md) |
| LLM layer, audit, jobs, files | [general-architecture/](general-architecture/README.md) |
| Onboarding loop (research → profile) | [features/onboarding/README.md](features/onboarding/README.md) |
| Claim / payments | [features/onboarding/pipeline/07-claim.md](features/onboarding/pipeline/07-claim.md) |
| Website building + editing | [features/website/README.md](features/website/README.md) |
| Ad generation | [features/ads/README.md](features/ads/README.md) |
| Leads | [features/other/leads/README.md](features/other/leads/README.md) |
| CI and delivery | [ci-cd.md](ci-cd.md) |
| Testing / per-feature E2E | [testing.md](testing.md) |
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
