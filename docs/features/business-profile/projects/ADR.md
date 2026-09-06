# Projects Decision Record

Status: decided (dates on each entry). Update an entry (keeping the old
decision + date) instead of silently replacing the old entry.

## Decisions

1. **Projects is a working Profile screen** — `/cms/projects` under Profile,
   next to Business details. Title, description, cover photo from the media
   library. Not a stub.
   - 2026-08-19: as Profile child in details ADR 2.
   - 2026-08-20: working screen in the website first slice.
   - 2026-08-27: moved here.
   - 2026-09-06: Owner create / PATCH / approve / archive / unarchive
     appends `business_profile_edits` (`list=projects`).

2. **The table is `business_profile.projects`** — Ads and the website read it.
   It is not `website.projects`. Schema `details` is not renamed in this pass
   ([ETL ADR 9](../../etl/ADR.md)); this is the first table in the intended
   `business_profile` namespace. (2026-08-27)
   - 2026-09-04: Schema `details` renamed to `business_profile`. Live-profile
     tables share this namespace; `projects` is no longer the only table in it.

3. **Archive is not delete** — `status` is `active` / `archived`. Archive /
   Unarchive HTTP, not `DELETE`. Archive drops that id from every
   project-gallery website section (then compact). Unarchive returns the row to
   the list, not onto website sections. (2026-08-29)
   - 2026-08-29, later: `status` is `draft` / `active` / `archived`. Unarchive
     returns a **project draft**. See decision 5.

4. **Owner action = assistant action** — Projects tools call the same `POST` /
   `PATCH` / archive HTTP as `/cms/projects/{id}` ([website
   assistant](../../website/assistant.md)). No description-patches route.
   Hard-typed tools (projects package owns them; assistant registry lists them):
   `create_project`, `set_project_title`, `set_project_cover`,
   `patch_project_description`, `archive_project`, `unarchive_project`.
   Description patches are **Ask first**: pending in memory; **Apply** PATCHes
   the resulting `description`. Title and cover PATCH immediately. The LLM never
   sends a full `description` once copy exists (`span` / `quote` / `append` /
   `fill`). Writing on `/cms/projects/{id}` is Ads AI orbs, not Voice and not
   the website assistant overlay. (2026-08-29)
   - 2026-08-29, later: writing on `/cms/projects/{id}` is **inline AI
     assistance**. Cover is pick. Projects **write** tools are allowed only on
     the website editor; the Assistant on Projects stays guide.

5. **Create is a project draft** — `POST /v1/projects` / `create_project` /
   first click-off on New project inserts `status=draft`. **Approve** is `POST
   /v1/projects/{id}/approve` (empty body, Idempotency-Key; same verb as ads
   approve). `draft` → `active`. Already `active` on retry: **200**. **409** if
   not a project draft. Not an assistant tool this pass. Website publication
   bakes only `active` rows into `website_manifest.projects[]` and
   `{{projects.*}}`. Draft ids may sit on unpublished galleries; bake omits them
   (no 409). `POST …/unarchive` returns **project draft**, not silently
   `active`. Archive still `POST …/archive` (`draft` or `active` → `archived`).
   Onboarding / already-`active` rows stay `active`. GET list default is
   non-archived (`draft` + `active`). (2026-08-29)

6. **ETL insert is `active` from a source usable as a Project** — Facebook /
   Instagram posts, crawled URLs that are a past named job, and reviews usable
   as a Project insert `status=active`, matching decision 5 (onboarding /
   already-`active` stay `active`). Not a project draft. No Approve in the
   client interview. Client interview Archive (`POST
   /v1/onboarding/projects/{projectId}/archive`) is the same persist as CMS
   Archive (`active` → `archived`, `algorithm=human`). CMS `POST /v1/projects`
   still inserts a project draft. (2026-08-30)

7. **The Project cites sources; sources do not own Projects** — Drop
   `facebook_post_id` / `instagram_post_id` / crawl URL /
   `business_profile_review_id` on `projects`. ETL Projects cite ≥1
   `etl.sources` id via `project_sources`. Owner drafts have zero cites.
   Classify skip / yes/no lives on `etl.llm_source_to_project_classifications`
   (required `source_id`; `project_id` only when yes). Same crawl URL, Extract +
   HTML both usable as a Project → one Project, two cites. Text under 200
   characters is verdict no, no LLM. (2026-08-30)
