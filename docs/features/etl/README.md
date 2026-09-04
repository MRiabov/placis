# ETL

Extract **and** transform public contractor sources (Google Maps listing,
Facebook profile and posts, Instagram profile and posts, plus first-run crawl /
trade registry). Projects from posts / crawled sources / reviews usable as a
Project are transform on those ETL run kinds ([projects.md](pipeline/projects.md)); skip lives on
`etl.llm_source_to_project_classifications`. Extract identity is `etl.sources`.
Raw fetches and the Google Maps listing live in Postgres schema `etl`.
Transformed contractor-only rows live on the business profile. ETL is not
extract-only: transform is the business logic that writes the profile.

Onboarding 02 and a Monday / Wednesday / Friday schedule both call
`etl.StartRun` (`bill_usage=unbilled` until ETL is billed). Extract
chunks transform as they arrive (ETL fast extract p95 ≤ 5s, then ETL
slow extract). There is no owner-facing CMS screen in this slice.

- [ADR](ADR.md) — architectural decision record
- [architecture.md](architecture.md) — extract vs transform, ETL run kind
  triggers, packages (`StartRun` orchestrates; per-source extract/transform
  files do the work)
- [pipeline](pipeline/README.md) — ETL run kind triggers + per source (Google Maps, Facebook,
  Instagram, …)
- [persistence.md](persistence.md) — `etl` tables
- [technical-implementation.md](technical-implementation.md)
- [testing.md](testing.md)
- [sep-3-issue-list.md](sep-3-issue-list.md) — Sep 3 issue list (keep /
  doc gap / drop)

Business profile tables: [details persistence](../business-profile/details/persistence.md). Onboarding 02 only starts runs:
[02](../onboarding/pipeline/02-business-research.md).
