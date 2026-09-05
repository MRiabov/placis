# Product

Placis is a **done-for-you — delivered into your inbox, so you can DIY too**
marketing and advertising service for construction companies. One loop: learn
the business, select then copy a website template, edit the website, then make
ads.

Feature PRDs own the detail. This file is only the product-level loop, the
boundary no feature owns, and pointers.

## The loop

```text
onboard (from their Google Maps listing or company registry record)
  -> a few questions -> business research -> business profile
  -> website (website template + automatic website copy generation) -> edit in the website editor -> website publication
  -> ads from the profile + approved photos
```

Public Maps / Facebook pages keep feeding photos and reviews after website
activation (same online research consent; not a second onboarding).

Done-for-you + DIY: Placis can do business research, build, tweak, and suggest
ads; the owner can do the website edits and ad creation themselves.

Cross-cutting: Clerk identity (tenant == Clerk organization for **active**
tenants), Postgres multitenancy, LLM + system auditability, and [voice](general-architecture/voice-agent.md) as a
channel into the same tools (not a separate product). How development tasks
land: [development principles](development-principles.md).

## Feature PRDs

- [Auth](features/other/auth/README.md) — Clerk, tenant resolution
- [Onboarding](features/onboarding/prd.md) — business research and the business profile; [pipeline](features/onboarding/pipeline/README.md);
  [onboarding assistant](features/onboarding/assistant.md) (guide)
- [Assistant](features/assistant/prd.md) — CMS chat and voice after website activation
- [Billing](features/billing/prd.md) — usage credit, Stripe Subscription
  from 09 Checkout, Usage & billing, Pricing (bake at `astro build`;
  Choose on Placis Pro plan / month goes to 09)
- [ETL](features/etl/README.md) — extract and transform; Monday / Wednesday / Friday refresh
- [Website](features/website/prd.md) — website templates, website editor, website publication
- [Website activation](features/onboarding/pipeline/09-website-activation.md) — activation Price plus Placis Pro plan / month Checkout
  (Stripe)
- [Ads](features/ads/ad-generation/prd.md) — ad generation; terminal Ad status is **ad ready to post** (no ad
  posting)
- [Leads](features/other/leads/README.md) — website leads and ad leads
  (`/cms/leads`)
- [Business profile](features/business-profile/README.md) — Details, Projects, Certifications and reviews
- [Media library](features/other/media/README.md)
- [ETL](features/other/etl/README.md) — continuing public extract (Facebook posts, photos, reviews)
- [Placis website](features/placis-website/README.md) — Placis’s own site

`frontend-3` is greenfield. Delete `frontend-2` before the first owner-UI
implementation. Do not use `frontend-2` as a reference.
[ADR](general-architecture/ADR.md) 3. Stack:
[frontend-stack.md](general-architecture/frontend-stack.md).

## Out of scope

- **CRM / operations** — quotes, invoices, jobs, scheduling, crew, workflows,
  calendar, AI receptionist. Website forms persist a minimal `leads` table for
  ad attribution and done-for-you follow-up only.
- **App-modification surface** — `tenant_app_configs`,
  `tenant_app_change_requests`, module definitions, a “Modify App” flow,
  omission / declined-module machinery. Do not resurrect.
- **Deprecated tenant/org management** — org chooser, selected-org cookie,
  `/me/orgs`, `/me/tenants`, `POST /v1/tenants`,
  `PATCH /v1/tenants/{website_prefix}`, memberships CRUD. See [auth](features/other/auth/README.md).
- **Opaque freeform-JSON islands** — Don't say: `JsonRecord` /
  `JsonObjectPayload` wrappers. Typed structs; `jsonb` is persistence-only. See
  [HTTP conventions](general-architecture/api.md).
- **Blog posts and careers** — deferred; [website PRD non-goals](features/website/prd.md) and
  [website ADR #8](features/website/ADR.md).

## Deferred

Not in the first cut. Do not sneak them into a development task:

- Custom-capability coding agents
- Website component marketplace
- QS / tendering
- Accounting integrations
- Native mobile app
