# ETL

Extract **and** transform public contractor sources (Google Maps listing, Facebook profile and
posts, Instagram profile and posts, plus first-run crawl / trade registry). Raw fetches and the
Google Maps listing live in Postgres schema `etl`. Transformed contractor-only rows live on the
business profile. ETL is not extract-only: transform is the business logic that writes the
profile.

Onboarding 02 and a Monday / Wednesday / Friday schedule both call `etl.StartRun`. There is no
owner-facing CMS screen in this slice.

- [ADR.md](ADR.md) — decisions
- [architecture.md](architecture.md) — extract vs transform, triggers, packages
- [pipeline](pipeline/README.md) — extract, Google Maps listing, transform
- [persistence.md](persistence.md) — `etl` tables
- [technical-implementation.md](technical-implementation.md)
- [testing.md](testing.md)

Business profile tables: [details persistence](../other/details/persistence.md). Onboarding 02
only starts runs: [02](../onboarding/pipeline/02-business-research.md).
