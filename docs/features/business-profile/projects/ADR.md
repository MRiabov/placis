# Projects Decision Record

Status: decided (dates on each entry). Update an entry (keeping the old
decision + date) instead of silently replacing the old entry.

## Decisions

1. **Projects is a working Profile screen** — `/cms/projects` under Profile,
   next to Business details. Title, description, cover photo from the media
   library. Not a stub. (2026-08-19 as Profile child in details ADR 2;
   2026-08-20 working screen in the website first slice; moved here 2026-08-27)

2. **The table is `business_profile.projects`** — Ads and the website read it.
   It is not `website.projects`. Schema `details` is not renamed in this pass
   ([ETL ADR 9](../../etl/ADR.md)); this is the first table in the intended `business_profile`
   namespace. (2026-08-27)
