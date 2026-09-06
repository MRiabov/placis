# Business profile

The live record website and ads read. Onboarding and ETL transform write it. The
owner edits it on Profile screens in The CMS.

**Details** is one screen on this record, not the record itself ([ETL ADR 9](../etl/ADR.md):
Details the screen is a subset of the business profile). Live-profile tables and
projects share Postgres schema `business_profile`.

## Screens

- [details/](details/README.md) — Business details (`/cms/details`). Owns `business_profiles` and
  list tables (services, areas, hours, reviews, Facebook / Instagram,
  certification ticks). HTTP: [details/api.md](details/api.md). Increment writer:
  [details/architecture.md](details/architecture.md). Tests: [details/testing.md](details/testing.md). Outward Dos:
  `internal/profile/service.go`.
- [projects/](projects/README.md) — Projects (`/cms/projects`). Table: `business_profile.projects`.
  HTTP: [projects/api.md](projects/api.md). Tests: [projects/testing.md](projects/testing.md).
- [certifications/](certifications/README.md) — certification ticks on
  Certifications and reviews (`/cms/certifications-and-reviews`). HTTP:
  [certifications/api.md](certifications/api.md).
- [reviews/](reviews/README.md) — **All reviews** / **top reviews** on that
  same screen. HTTP: [reviews/api.md](reviews/api.md). Screen:
  [reviews/frontend.md](reviews/frontend.md). Tests:
  [reviews/testing.md](reviews/testing.md) (HTTP 1:1 stays Details
  `testing.md`). Persistence stays on
  [business profile persistence](details/persistence.md).

How the owner reaches them:
[CMS frontend](../../general-architecture/cms/frontend.md) (left nav).
Go / `frontend-3` files: [file-trees.md](file-trees.md). Media library:
[media library file trees](../other/media/file-trees.md). River job kind
`reviews_ranking_for_display`: [jobs.md](jobs.md).

- [sep-3-issue-list.md](sep-3-issue-list.md) — Sep 3 issue list (keep /
  doc gap / drop)

## Not here

- [Media library](../other/media/README.md) — Profile child and a shared photo library; not a
  business-profile table. Logo on Details picks from it.
- Website editor **reviews Content** (ordered `website_slot_reviews` on that
  website section) — [website frontend](../website/frontend.md).
- Onboarding and ETL — they **write** this record; they are not screens on it.

## Writers and readers

Onboarding builds the live row. ETL transform fills empty fields, lands new
reviews / posts / photos, and raises research conflicts on Details. The website
shows the record (live website editor immediately; visitors after website
publication). Ads read it (and top reviews, projects, approved photos).
