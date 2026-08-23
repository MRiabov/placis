# Placis Documentation

Docs for the Placis application — a **Go backend** plus the **`frontend-2`** Vite/React SPA. The
product: a
**done-for-you — delivered into your inbox, so you can DIY too** — marketing and advertising
service for construction companies. We do business research, build a profile, apply a website template
and edit a website, and suggest ads; the owner can do the same edits and ads
themselves in the CMS.

## Reading order

1. [Development principles](development-principles.md) — how work is sliced and reviewed (read before writing code)
2. [Docs conventions](docs-conventions.md) — how the docs tree is structured and written
3. [Glossary](glossary.md) — the naming vocabulary (read before naming anything)
4. [Architecture](architecture.md) — stack, module layout, how processes run, boundaries
5. [General architecture](general-architecture/README.md) — LLM layer, audit, jobs, files, data model, `frontend-2` UI
6. [Auth](features/other/auth/README.md) — Clerk, tenant == Clerk organization
7. [Onboarding](features/onboarding/README.md) — business research and business-profile building; [website activation](features/onboarding/pipeline/08-website-activation.md) is pay-and-activate
8. [Website](features/website/README.md) — website templates, applying them, editing, website publication
9. [Ads](features/ads/README.md) — ad generation (#403); the authoritative spec is in [features/ads/ad-generation/](features/ads/ad-generation/ADR.md). Future Meta ad posting: [ad-application/meta](features/ads/ad-application/meta/00-index-research.md) (research, not the spec)
10. [Leads](features/other/leads/README.md) — website form contacts for attribution and follow-up
11. [CI and delivery](ci-cd.md) — file-size guard, external API isolation, generated-code freshness
12. [Testing](testing.md) — the per-feature E2E tests

## Canonical references

| Topic | Doc |
| --- | --- |
| Stack, module layout, how processes run | [architecture.md](architecture.md) |
| How work is sliced and reviewed | [development-principles.md](development-principles.md) |
| How docs are structured and written | [docs-conventions.md](docs-conventions.md) |
| Naming / vocabulary | [glossary.md](glossary.md) |
| Auth | [features/other/auth/README.md](features/other/auth/README.md) |
| Data model conventions + index | [general-architecture/data-model.md](general-architecture/data-model.md) |
| LLM layer, audit, jobs, files, `frontend-2` UI | [general-architecture/](general-architecture/README.md) |
| Onboarding loop (business research → profile) | [features/onboarding/README.md](features/onboarding/README.md) |
| Website activation / payments | [features/onboarding/pipeline/08-website-activation.md](features/onboarding/pipeline/08-website-activation.md) |
| Website building + editing | [features/website/README.md](features/website/README.md) |
| Ad generation | [features/ads/README.md](features/ads/README.md) |
| Meta ad posting (research) | [features/ads/ad-application/meta/00-index-research.md](features/ads/ad-application/meta/00-index-research.md) |
| Leads | [features/other/leads/README.md](features/other/leads/README.md) |
| CI and delivery | [ci-cd.md](ci-cd.md) |
| Testing / per-feature E2E | [testing.md](testing.md) |
| Exhaustive rewrite plan | [planning/go-backend-rewrite.md](planning/go-backend-rewrite.md) |

## Product boundary

One product, one loop:

```text
onboard (from their Google Maps listing or company registry record)
  -> a few questions -> business research -> business profile
  -> website (website template + website copy generation) -> edit in the CMS -> website publication
  -> ads from the profile + approved photos
```

Done-for-you + DIY: Placis can do business research, build, tweak, and suggest ads; the owner can do the
website edits and ad creation themselves in the CMS.

There is **no** CRM/operations track (quotes/invoices/jobs/workflows). Website forms persist a
minimal `leads` table for ad attribution and done-for-you follow-up only.

## Naming

The authoritative **ubiquitous language** is the [Glossary](glossary.md) — domain terms, enums,
and internal terms, each defined once as a heading there. Product docs and owner-facing text use the
business's own words ("business profile", "their website", "website publication"); Internal names
stay in technical docs and code only (see the glossary Don't-say table).

## Documentation rules

- Update canonical docs when contracts, shipped behavior, data models, Google / LLM / Stripe /
  voice boundaries, or validation gates change.
- Terminology is canonical: `onboarding` (never "setup"), `business_profile` (never
  "setup_profile"), `website_*` (never `cms_*`), `Placis` for the product (keep `OnCall` when naming the predecessor repo). Domain words come from
  the [Glossary](glossary.md); implementation words never appear in product docs.
- Plans and proposed (unshipped) work live under `planning/`, not here.
