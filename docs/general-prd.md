# Product

Placis is a **done-for-you — delivered into your inbox, so you can DIY too** marketing and
advertising service for construction companies. One loop: learn the business, apply a website
template, edit the website, then make ads.

Feature PRDs own the detail. This file is only the product-level loop, the boundary no feature
owns, and pointers.

## The loop

```text
onboard (from their Google Maps listing or company registry record)
  -> a few questions -> business research -> business profile
  -> website (website template + website copy generation) -> edit in the website editor -> website publication
  -> ads from the profile + approved photos
```

Done-for-you + DIY: Placis can do business research, build, tweak, and suggest ads; the owner can
do the website edits and ad creation themselves.

Cross-cutting: Clerk identity (tenant == Clerk organization for **active** tenants), Postgres
multitenancy, LLM + system auditability, and [voice](general-architecture/voice-agent.md) as a
channel into the same tools (not a separate product). How slices land:
[development principles](development-principles.md).

## Feature PRDs

- [Auth](features/other/auth/README.md) — Clerk, tenant resolution
- [Onboarding](features/onboarding/prd.md) — business research and the business profile; [pipeline](features/onboarding/pipeline/README.md)
- [Website](features/website/prd.md) — website templates, website editor, website publication
- [Website activation](features/onboarding/pipeline/08-website-activation.md) — pay-and-activate (Stripe)
- [Ads](features/ads/ad-generation/prd.md) — ad generation; terminal Ad status is **ad ready to post** (no ad posting)
- [Leads](features/other/leads/README.md) — website form contacts
- [Details](features/other/details/README.md) — the business profile the rest of the app reads
- [Media library](features/other/media/README.md)
- [Placis website](features/placis-website/README.md) — Placis’s own site

`frontend-2` is [reused and debloated](planning/frontend-debloat.md), not rebuilt.

## Out of scope

- **CRM / operations** — quotes, invoices, jobs, scheduling, crew, workflows, calendar, AI
  receptionist. Website forms persist a minimal `leads` table for ad attribution and done-for-you
  follow-up only.
- **App-modification surface** — `tenant_app_configs`, `tenant_app_change_requests`, module
  definitions, a “Modify App” flow, omission / declined-module machinery. Do not resurrect.
- **Deprecated tenant/org management** — org chooser, selected-org cookie, `/me/orgs`,
  `/me/tenants`, `POST /api/v1/tenants`, `PATCH /api/v1/tenants/{website_address}`, memberships
  CRUD. See [auth](features/other/auth/README.md).
- **Opaque freeform-JSON islands** — `JsonRecord` / `JsonObjectPayload` wrappers. Typed structs;
  `jsonb` only at the persistence/API boundary. See [backend stack](general-architecture/backend-stack.md).
- **Blog posts and careers** — deferred; [website PRD non-goals](features/website/prd.md) and
  [website ADR #8](features/website/ADR.md).

## Deferred

Not in the first cut. Do not sneak them into a slice:

- Custom-capability coding agents
- Website component marketplace
- QS / tendering
- Accounting integrations
- Native mobile app
