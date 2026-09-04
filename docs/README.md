# Placis Documentation

Docs for the Placis application — a **Go backend** plus the **`frontend-2`**
Vite/React SPA. The product: a
**done-for-you — delivered into your inbox, so you can DIY too** — marketing and
advertising service for construction companies. We do business research, build a
profile, select then copy a website template and edit a website, and suggest
ads; the owner can do the same edits and ads themselves in the CMS.

## Reading order

1. [Development principles](development-principles.md) — how work is sliced and reviewed (read before
   writing code)
2. [Docs conventions](docs-conventions.md) — how the docs tree is structured and written
3. [Glossary](glossary.md) — the naming vocabulary (read before naming anything)
4. [Product](general-prd.md) — the loop, product-level in/out of scope
5. [General architecture](general-architecture/README.md) — stack, module layout, processes, HTTP routes, LLM
   layer, audit, jobs, files, `frontend-2` UI
6. [Auth](features/other/auth/README.md) — Clerk; tenant == Clerk organization 1-1
7. [Onboarding](features/onboarding/README.md) — business research and business-profile building;
   [website activation](features/onboarding/pipeline/09-website-activation.md) is activation Price plus Placis Pro plan / month
   Checkout
8. [ETL](features/etl/README.md) — extract and transform (Google Maps, Facebook, Instagram); Monday /
   Wednesday / Friday refresh
9. [Business profile](features/business-profile/README.md) — Details, Projects, Certifications and reviews
10. [Website](features/website/README.md) — website templates, selecting and
    copying them, editing, website publication
11. [Assistant](features/assistant/README.md) — assistant (guide and doer); onboarding guide is a sibling
12. [Billing](features/billing/README.md) — usage credit, Stripe Subscription from 09 Checkout, Usage &
    billing, Pricing (bake at `astro build`)
13. [Placis website](features/placis-website/README.md) — Placis’s own site (Astro static → R2)
14. [Ads](features/ads/README.md) — ad generation (#403); the authoritative spec is in
    [features/ads/ad-generation/](features/ads/ad-generation/ADR.md). Future Meta ad posting: [ad-application/meta](features/ads/ad-application/meta/)
    (investigation, not the spec)
15. [Leads](features/other/leads/README.md) — website form contacts for attribution and follow-up
16. [CI and delivery](general-architecture/ci-cd.md) — file-size guard, folder fan-out, external API isolation,
    generated-code freshness
17. [Testing](general-architecture/testing.md) — the per-feature E2E tests
18. [Sep 3 issue lists](general-architecture/sep-3-issue-list.md) —
    per-feature keep / doc gap / drop (reclassified 2026-09-03)

## Canonical references

| Topic | Doc |
| --- | --- |
| Product loop and product-level scope | [general-prd.md](general-prd.md) |
| Stack, module layout, how processes run | [general-architecture/README.md](general-architecture/README.md) |
| How work is sliced and reviewed | [development-principles.md](development-principles.md) |
| How docs are structured and written | [docs-conventions.md](docs-conventions.md) |
| Naming / vocabulary | [glossary.md](glossary.md) |
| Auth | [features/other/auth/README.md](features/other/auth/README.md) |
| Persistence conventions + index | [general-architecture/persistence.md](general-architecture/persistence.md) |
| HTTP conventions + per-feature `api.md` | [general-architecture/api.md](general-architecture/api.md) |
| AI layer, audit, jobs, files, `frontend-2` UI | [general-architecture/](general-architecture/README.md) |
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
| `frontend-2` port (debloat index) | [planning/frontend-debloat.md](planning/frontend-debloat.md) |

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

- Update canonical docs when contracts, shipped behavior, data models, Google /
  LLM / Stripe / voice boundaries, or validation gates change.
- Terminology is canonical: `onboarding` (never "setup"), `business_profile`
  (never "setup_profile"), `website_*` (never `cms_*`), `Placis` for the product
  (keep `OnCall` when naming the predecessor repo). Domain words come from the
  [Glossary](glossary.md); implementation words never appear in product docs.
- Plans and proposed (unshipped) work live under `planning/`, not here.
