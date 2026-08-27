# Business profile

The live record website and ads read. Onboarding and ETL transform write it. The owner edits it
on Profile screens in The CMS.

**Details** is one screen on this record, not the record itself ([ETL ADR 9](../etl/ADR.md):
Details the screen is a subset of the business profile). Postgres schema `details` is **not**
renamed in this pass.

## Screens

- [details/](details/README.md) — Business details (`/cms/details`). Owns `business_profiles` and
  list tables (services, areas, hours, reviews, Facebook / Instagram, certification ticks).
- [projects/](projects/README.md) — Projects (`/cms/projects`). Table: `business_profile.projects`.
- [certifications-and-reviews/](certifications-and-reviews/README.md) — Certifications and reviews
  (`/cms/certifications-and-reviews`). Persistence and HTTP stay on [details](details/persistence.md)
  / [details HTTP](details/api.md).

How the owner reaches them: [CMS frontend](../../general-architecture/cms/frontend.md) (left nav).

## Not here

- [Media library](../other/media/README.md) — Profile child and a shared photo library; not a
  business-profile table. Logo on Details picks from it.
- Website editor **reviews Content** (ordered `website_slot_reviews` on that website section) —
  [website frontend](../website/frontend.md).
- Onboarding and ETL — they **write** this record; they are not screens on it.

## Writers and readers

Onboarding builds the live row. ETL transform fills empty fields, lands new reviews / posts /
photos, and raises research conflicts on Details. The website shows the record (live
website editor immediately; visitors after website publication). Ads read it (and top reviews, projects,
approved photos).
