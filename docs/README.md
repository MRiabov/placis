# Placis Documentation

Docs for the Placis application — a **Go backend** plus the **`frontend-3`**
Vite/React SPA. The product: a
**done-for-you — delivered into your inbox, so you can DIY too** — marketing and
advertising service for construction companies. We do business research, build a
profile, select then copy a website template and edit a website, and suggest
ads; the owner can do the same edits and ads themselves in the CMS.

## Reading order

1. [AGENTS.md](../AGENTS.md) — agent entry: documentation-first gate, `apps/`,
   `frontend-3` greenfield ([ADR](general-architecture/ADR.md) 3)
2. [Development principles](development-principles.md) — how
   development tasks are reviewed (read before writing code)
3. [Implementation strategy](planning/implementation-strategy.md) —
   development-task order (Go + `frontend-3`); planning, not shipped
   behavior
4. [Docs conventions](docs-conventions.md) — how the docs tree is structured and written
5. [Glossary](glossary.md) — the naming vocabulary (read before naming anything)
6. [Product](general-prd.md) — the loop, product-level in/out of scope
7. [General architecture](general-architecture/README.md) — stack, module layout, processes, HTTP routes,
   `frontend-3` UI
8. [Infrastructure](infrastructure/README.md) — tenancy (Clerk), config, store, AI, files, River jobs
9. [Onboarding](features/onboarding/README.md) — business research and business-profile building;
   [website activation](features/onboarding/pipeline/09-website-activation.md) is activation Price plus Placis Pro plan / month
   Checkout
10. [ETL](features/etl/README.md) — extract and transform (Google Maps, Facebook, Instagram); Monday /
    Wednesday / Friday refresh
11. [Business profile](features/business-profile/README.md) — Details, Projects, Certifications and reviews
12. [Website](features/website/README.md) — website templates, selecting and
    copying them, editing, website publication
13. [Assistant](features/assistant/README.md) — assistant (guide and doer); onboarding guide is a sibling
14. [Billing](features/billing/README.md) — usage credit, Stripe Subscription from 09 Checkout, Usage &
    billing, Pricing (bake at `astro build`)
15. [Placis website](features/placis-website/README.md) — Placis’s own site (Astro static → R2)
16. [Ads](features/ads/README.md) — ad generation (#403); the authoritative spec is in
    [features/ads/ad-generation/](features/ads/ad-generation/ADR.md). Future Meta ad posting: [ad-application/meta](features/ads/ad-application/meta/)
    (investigation, not the spec)
17. [Leads](features/other/leads/README.md) — website form contacts for attribution and follow-up
18. [CI and delivery](general-architecture/ci-cd.md) — file-size guard, folder fan-out, external API isolation,
    generated-code freshness
19. [Testing](general-architecture/testing.md) — the per-feature E2E tests
20. [Sep 3 issue lists](general-architecture/sep-3-issue-list.md) —
    per-feature keep / doc gap / drop (reclassified 2026-09-03)

## Canonical references

| Topic | Doc |
| --- | --- |
| Agent entry (documentation-first gate) | [AGENTS.md](../AGENTS.md) |
| Product loop and product-level scope | [general-prd.md](general-prd.md) |
| Stack, module layout, how processes run | [general-architecture/README.md](general-architecture/README.md) |
| How development tasks are reviewed | [development-principles.md](development-principles.md) |
| Implementation order (planning) | [planning/implementation-strategy.md](planning/implementation-strategy.md) |
| How docs are structured and written | [docs-conventions.md](docs-conventions.md) |
| Naming / vocabulary | [glossary.md](glossary.md) |
| Auth / tenancy | [infrastructure/tenancy/README.md](infrastructure/tenancy/README.md) |
| Persistence conventions + index | [general-architecture/persistence.md](general-architecture/persistence.md) |
| Store (pool / goose) | [infrastructure/store.md](infrastructure/store.md) |
| HTTP conventions + per-feature `api.md` | [general-architecture/api.md](general-architecture/api.md) |
| AI layer, audit, jobs, files | [infrastructure/](infrastructure/README.md) |
| Onboarding loop (business research → profile) | [features/onboarding/README.md](features/onboarding/README.md) |
| ETL (extract + transform) | [features/etl/README.md](features/etl/README.md) |
| Business profile | [features/business-profile/README.md](features/business-profile/README.md) |
| Website activation / payments | [features/onboarding/pipeline/09-website-activation.md](features/onboarding/pipeline/09-website-activation.md) |
| Website building + editing | [features/website/README.md](features/website/README.md) |
| Assistant | [features/assistant/README.md](features/assistant/README.md) |
| Billing (usage credit) | [features/billing/README.md](features/billing/README.md) |
| Placis website (Astro static → R2) | [features/placis-website/README.md](features/placis-website/README.md) |
| Ad generation | [features/ads/README.md](features/ads/README.md) |
| Meta ad posting (investigation) | [features/ads/ad-application/meta](features/ads/ad-application/meta/) |
| Leads | [features/other/leads/README.md](features/other/leads/README.md) |
| CI and delivery | [general-architecture/ci-cd.md](general-architecture/ci-cd.md) |
| Testing / per-feature E2E | [general-architecture/testing.md](general-architecture/testing.md) |
| `frontend-3` greenfield (withdrawn `frontend-2` port) | [planning/frontend-debloat.md](planning/frontend-debloat.md) |

## Product boundary

One product, one loop:

```text
onboard (from their Google Maps listing or company registry record)
  -> a few questions -> business research -> business profile
  -> website (website template + automatic website copy generation) -> edit in the CMS -> website publication
  -> ads from the profile + approved photos
```

Done-for-you + DIY: Placis can do business research, build, tweak, and suggest
ads; the owner can do the website edits and ad creation themselves in the CMS.

There is **no** CRM/operations track (quotes/invoices/jobs/workflows). Website
forms persist a minimal `leads` table for ad attribution and done-for-you
follow-up only.

## Naming

The authoritative **ubiquitous language** is the [Glossary](glossary.md) — domain terms,
enums, and internal terms, each defined once as a heading there. Product docs
and owner-facing text use the business's own words ("business profile", "their
website", "website publication"); Internal names stay in technical docs and code
only (see the glossary Don't-say table).

## Documentation rules

- Implementation waits on owner-reviewed named lists (`persistence.md`,
  `api.md`, `testing.md`). Every changeset starts with those docs, not after
  code. In Plan mode, updating docs is the first step. See
  [AGENTS.md](../AGENTS.md).
- Update canonical docs when contracts, shipped behavior, data models, Google /
  LLM / Stripe / voice boundaries, or validation gates change.
- Terminology is canonical: `onboarding` (never "setup"), `business_profile`
  (never "setup_profile"), `website_*` (never `cms_*`), `Placis` for the product
  (keep `OnCall` when naming the predecessor repo). Domain words come from the
  [Glossary](glossary.md); implementation words never appear in product docs.
- Plans and proposed (unshipped) work live under `planning/`, not here.
