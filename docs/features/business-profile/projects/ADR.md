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

3. **Archive is not delete** — `status` is `active` / `archived`. Archive /
   Unarchive HTTP, not `DELETE`. Archive drops that id from every
   project-gallery website section (then compact). Unarchive returns the row to
   the list, not onto website sections. (2026-08-29)

4. **Owner action = assistant action** — Projects tools call the same
   `POST` / `PATCH` / archive HTTP as `/cms/projects/{id}`
   ([website assistant](../../website/assistant.md)). No description-patches
   route. Hard-typed tools (projects package owns them; assistant registry lists
   them): `create_project`, `set_project_title`, `set_project_cover`,
   `patch_project_description`, `archive_project`, `unarchive_project`.
   Description patches are **Ask first**: pending in memory; **Apply** PATCHes
   the resulting `description`. Title and cover PATCH immediately. The LLM never
   sends a full `description` once copy exists (`span` / `quote` / `append` /
   `fill`). Writing on `/cms/projects/{id}` is Ads AI orbs, not Voice and not
   the website assistant overlay. (2026-08-29)
